'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MutableRefObject } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { getGameState, playGame } from '@/lib/api/game'
import { GameReward, pickRandomReward } from './rewardsConfig'
import { useTranslation } from '../hooks/useTranslation'
import { useIsIOS } from '../hooks/useIsIOS'
import { showToast } from '../utils/toast'
import RewardSpinner from '../components/RewardSpinner'

type GameStatus = 'idle' | 'running' | 'won' | 'lost' | 'cooldown'

type LoadedImages = {
  background: HTMLImageElement
  idleFrames: HTMLImageElement[]
  runFrames: HTMLImageElement[]
  jumpFrames: HTMLImageElement[]
  obstacleAssets: HTMLImageElement[]
}

type GameCallbacksRef = MutableRefObject<{
  onScore: (score: number) => void
  onLives: (lives: number) => void
  onGameOver: (result: 'won' | 'lost') => void
}>

type EntityType = 'obstacle'

type Entity = {
  id: number
  type: EntityType
  x: number
  y: number
  width: number
  height: number
  assetIndex?: number
}

type PlayerAnimation = 'idle' | 'run' | 'jump'

type Player = {
  x: number
  y: number
  width: number
  height: number
  vy: number
  onGround: boolean
  jumpsUsed: number
  animation: PlayerAnimation
  frameIndex: number
  frameTimer: number
}


const PHYSICS = {
  gravity: 2600,
  jumpVelocity: -1100,
  doubleJumpVelocity: -950,
  baseSpeed: 260,
  maxSpeed: 520,
  speedIncreasePerSecond: 16,
}

let ENTITY_ID_COUNTER = 1

class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private images: LoadedImages
  private callbacks: GameCallbacksRef

  private width = 0
  private height = 0
  private groundY = 0
  private playerAspectRatio = 1

  private player: Player = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    vy: 0,
    onGround: true,
    jumpsUsed: 0,
    animation: 'idle',
    frameIndex: 0,
    frameTimer: 0,
  }

  private entities: Entity[] = []
  private score = 0
  private lives = 3
  private speed = PHYSICS.baseSpeed
  private bgOffset = 0
  private spawnTimer = 0
  private gameOver = false
  private scoreTimer = 0

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    images: LoadedImages,
    callbacks: GameCallbacksRef,
  ) {
    this.canvas = canvas
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.images = images
    this.callbacks = callbacks
    
    // Calculate aspect ratio from the first idle frame (or any frame)
    const firstFrame = images.idleFrames[0] || images.runFrames[0] || images.jumpFrames[0]
    if (firstFrame && firstFrame.width > 0 && firstFrame.height > 0) {
      this.playerAspectRatio = firstFrame.width / firstFrame.height
    }
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.canvas.width = width * window.devicePixelRatio
    this.canvas.height = height * window.devicePixelRatio
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    this.ctx.imageSmoothingEnabled = false

    this.groundY = this.height * 0.78
    const playerHeight = this.height * 0.32
    // Calculate width based on actual image aspect ratio (object-contain behavior)
    const playerWidth = playerHeight * this.playerAspectRatio

    this.player.width = playerWidth
    this.player.height = playerHeight
    this.player.x = this.width * 0.18
    if (this.player.y === 0) {
      this.player.y = this.groundY - playerHeight
    } else {
      this.player.y = Math.min(this.player.y, this.groundY - playerHeight)
    }
  }

  startRun(initialLives: number = 3) {
    this.score = 0
    this.lives = initialLives
    this.speed = PHYSICS.baseSpeed
    this.bgOffset = 0
    this.entities = []
    this.spawnTimer = this.getNextSpawnInterval()
    this.gameOver = false

    this.player.vy = 0
    this.player.onGround = true
    this.player.jumpsUsed = 0
    this.player.animation = 'run'
    this.player.frameIndex = 0
    this.player.frameTimer = 0
    this.player.y = this.groundY - this.player.height

    this.callbacks.current.onScore(this.score)
    this.callbacks.current.onLives(this.lives)
  }

  tap() {
    if (this.gameOver) return
    // Single jump
    if (this.player.onGround) {
      this.player.vy = PHYSICS.jumpVelocity
      this.player.onGround = false
      this.player.jumpsUsed = 1
      this.player.animation = 'jump'
      return
    }
    // Double-jump while in air
    if (!this.player.onGround && this.player.jumpsUsed < 2) {
      this.player.vy = PHYSICS.doubleJumpVelocity
      this.player.jumpsUsed += 1
      this.player.animation = 'jump'
    }
  }

  step(dt: number, status: GameStatus) {
    if (!this.width || !this.height) return

    if (status === 'running' && !this.gameOver) {
      this.updatePhysics(dt)
    } else {
      // Ensure player stays on the ground in non-running states
      if (this.player.y + this.player.height > this.groundY) {
        this.player.y = this.groundY - this.player.height
        this.player.vy = 0
        this.player.onGround = true
        this.player.jumpsUsed = 0
      }
    }

    this.updateAnimation(dt, status)
    this.render()
  }

  private updatePhysics(dt: number) {
    // Gravity
    this.player.vy += PHYSICS.gravity * dt
    this.player.y += this.player.vy * dt

    if (this.player.y + this.player.height >= this.groundY) {
      this.player.y = this.groundY - this.player.height
      this.player.vy = 0
      this.player.onGround = true
      this.player.jumpsUsed = 0
    }

    // World speed ramps up gradually
    this.speed = Math.min(PHYSICS.maxSpeed, this.speed + PHYSICS.speedIncreasePerSecond * dt)

    // Background parallax scroll
    this.bgOffset -= this.speed * dt * 0.25

    // Spawn and move entities
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnEntity()
      this.spawnTimer = this.getNextSpawnInterval()
    }

    this.entities.forEach((e) => {
      e.x -= this.speed * dt
    })

    // Remove entities that passed behind player and increase score
    const passedEntities = this.entities.filter((e) => e.x + e.width < this.player.x)
    if (passedEntities.length > 0) {
      this.score += passedEntities.length
      this.callbacks.current.onScore(this.score)
      if (!this.gameOver && this.score >= 100) {
        this.finishGame('won')
      }
    }

    this.entities = this.entities.filter((e) => e.x + e.width > -this.width * 0.2)

    this.checkCollisions()
  }

  private updateAnimation(dt: number, status: GameStatus) {
    let frames: HTMLImageElement[]
    let frameDuration: number

    if (status === 'running') {
      if (!this.player.onGround || this.player.vy < -50) {
        this.player.animation = 'jump'
        frames = this.images.jumpFrames
        frameDuration = 0.05
      } else {
        this.player.animation = 'run'
        frames = this.images.runFrames
        frameDuration = 0.07
      }
    } else {
      this.player.animation = 'idle'
      frames = this.images.idleFrames
      frameDuration = 0.12
    }

    if (!frames.length) return

    this.player.frameTimer += dt
    if (this.player.frameTimer >= frameDuration) {
      this.player.frameTimer = 0
      this.player.frameIndex = (this.player.frameIndex + 1) % frames.length
    }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    const bgImg = this.images.background
    const scale = this.height / bgImg.height
    const bgWidth = bgImg.width * scale
    let x = this.bgOffset % bgWidth
    if (x > 0) x -= bgWidth
    x = Math.floor(x)
    while (x < this.width) {
      ctx.drawImage(bgImg, x, 0, bgWidth, this.height)
      x += bgWidth
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    const groundHeight = this.height * 0.18
    ctx.fillRect(0, this.groundY - groundHeight * 0.2, this.width, groundHeight * 0.4)

    for (const e of this.entities) {
      if (this.images.obstacleAssets && this.images.obstacleAssets.length > 0 && e.assetIndex !== undefined) {
        const asset = this.images.obstacleAssets[e.assetIndex % this.images.obstacleAssets.length]
        if (asset) {
          ctx.drawImage(asset, e.x, e.y, e.width, e.height)
        }
      }
    }

    const frames =
      this.player.animation === 'jump'
        ? this.images.jumpFrames
        : this.player.animation === 'run'
          ? this.images.runFrames
          : this.images.idleFrames

    if (frames.length) {
      const frame = frames[this.player.frameIndex % frames.length]
      ctx.drawImage(frame, this.player.x, this.player.y, this.player.width, this.player.height)
    }
  }

  private spawnEntity() {
    if (!this.images.obstacleAssets || this.images.obstacleAssets.length === 0) return

    const id = ENTITY_ID_COUNTER++
    const assetIndex = Math.floor(Math.random() * this.images.obstacleAssets.length)
    const asset = this.images.obstacleAssets[assetIndex]

    if (!asset || asset.width === 0 || asset.height === 0) return

    const scale = (this.height * 0.18) / asset.height
    const width = asset.width * scale
    const height = asset.height * scale
    const x = this.width
    const y = this.groundY - height

    this.entities.push({ 
      id, 
      type: 'obstacle', 
      x, 
      y, 
      width, 
      height, 
      assetIndex 
    })
  }

  private checkCollisions() {
    const playerBox = {
      x: this.player.x + this.player.width * 0.22,
      y: this.player.y + this.player.height * 0.25,
      width: this.player.width * 0.56,
      height: this.player.height * 0.55,
    }

    const remaining: Entity[] = []

    for (const e of this.entities) {
      const hit =
        playerBox.x < e.x + e.width &&
        playerBox.x + playerBox.width > e.x &&
        playerBox.y < e.y + e.height &&
        playerBox.y + playerBox.height > e.y

      if (!hit) {
        remaining.push(e)
        continue
      }

      this.lives -= 1
      this.callbacks.current.onLives(this.lives)
      if (this.lives <= 0 && !this.gameOver) {
        this.finishGame('lost')
      }
    }

    this.entities = remaining
  }

  private finishGame(result: 'won' | 'lost') {
    if (this.gameOver) return
    this.gameOver = true
    this.callbacks.current.onGameOver(result)
  }

  private getNextSpawnInterval() {
    const speedFactor = this.speed / PHYSICS.baseSpeed
    const min = 0.7 / speedFactor
    const max = 1.4 / speedFactor
    return min + Math.random() * (max - min)
  }
}

function useGameAssets() {
  const [images, setImages] = useState<LoadedImages | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = (err) => reject(err)
      })

    async function loadAll() {
      try {
        const backgroundPromise = loadImage('/game-assets/bg-repeatable.png')

        const idleFramesPromise = Promise.all(
          [140, 141, 142, 143, 144, 145, 146, 147, 148].map((n) =>
            loadImage(`/game-assets/idol/Property 1=Frame ${n}.png`),
          ),
        )

        const runFrameNumbers = [
          1948754744, 1948754745, 1948754746, 1948754747, 1948754748, 1948754749, 1948754750, 1948754751,
          1948754752, 1948754753, 1948754754, 1948754755,
        ]
        const jumpFrameNumbers = [
          1948754759, 1948754760, 1948754761, 1948754762, 1948754763, 1948754764, 1948754765, 1948754766,
          1948754767, 1948754768, 1948754769, 1948754770, 1948754771, 1948754772, 1948754773,
        ]

        const runFramesPromise = Promise.all(
          runFrameNumbers.map((n) => loadImage(`/game-assets/run/Property 1=Frame ${n}.png`)),
        )
        const jumpFramesPromise = Promise.all(
          jumpFrameNumbers.map((n) => loadImage(`/game-assets/jump/Property 1=Frame ${n}.png`)),
        )

        const obstacleAssetsPromise = Promise.all([
          loadImage('/game-assets/assets-black/ChatGPT Image 21 окт. 2025 г., 20_02_32 2.png'),
          loadImage('/game-assets/assets-black/ChatGPT Image 21 окт. 2025 г., 20_04_11 2.png'),
          loadImage('/game-assets/assets-black/ChatGPT Image 21 окт. 2025 г., 20_06_54 2.png'),
          loadImage('/game-assets/assets-black/ChatGPT Image 21 окт. 2025 г., 20_10_36 2.png'),
          loadImage('/game-assets/assets-black/ChatGPT Image 21 окт. 2025 г., 20_13_08 2.png'),
          loadImage('/game-assets/assets-white/ChatGPT Image 21 окт. 2025 г., 20_02_32 1.png'),
          loadImage('/game-assets/assets-white/ChatGPT Image 21 окт. 2025 г., 20_04_11 1.png'),
          loadImage('/game-assets/assets-white/ChatGPT Image 21 окт. 2025 г., 20_06_54 1.png'),
          loadImage('/game-assets/assets-white/ChatGPT Image 21 окт. 2025 г., 20_10_36 1.png'),
          loadImage('/game-assets/assets-white/ChatGPT Image 21 окт. 2025 г., 20_13_08 1.png'),
        ])

        const [background, idleFrames, runFrames, jumpFrames, obstacleAssets] = await Promise.all([
          backgroundPromise,
          idleFramesPromise,
          runFramesPromise,
          jumpFramesPromise,
          obstacleAssetsPromise,
        ])

        if (cancelled) return

        setImages({
          background,
          idleFrames,
          runFrames,
          jumpFrames,
          obstacleAssets,
        })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAll()

    return () => {
      cancelled = true
    }
  }, [])

  return { images, loading }
}

function formatCooldown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function renderRewardDescription(reward: GameReward | null, t: (key: string) => string): string {
  if (!reward) return ''
  if (reward.type === 'crowns') {
    return `${reward.title} — ${reward.crowns ?? 0} ${t('game.crowns')}`
  }
  const seriesName = reward.seriesTitle ?? t('game.series')
  return `${reward.title} — ${t('game.freeWatch')} ${seriesName}`
}

export default function GamePage() {
  const router = useRouter()
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const { images, loading: assetsLoading } = useGameAssets()
  const { t } = useTranslation()
  const isIOS = useIsIOS()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const statusRef = useRef<GameStatus>('idle')
  const callbacksRef = useRef<{
    onScore: (score: number) => void
    onLives: (lives: number) => void
    onGameOver: (result: 'won' | 'lost') => void
  }>({
    onScore: () => {},
    onLives: () => {},
    onGameOver: () => {},
  })
  const cooldownEndRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  const [status, setStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [cooldownMs, setCooldownMs] = useState(0)
  const [reward, setReward] = useState<GameReward | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [showRewardSpinner, setShowRewardSpinner] = useState(false)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    if (!accessToken) {
      setLoadingState(false)
      return
    }

    const fetchGameState = async () => {
      try {
        const gameState = await getGameState(accessToken)
        setLives(gameState.lives)
        
        if (gameState.lives === 0 && gameState.nextPlayAvailableAt) {
          const nextPlayDate = new Date(gameState.nextPlayAvailableAt).getTime()
          const now = Date.now()
          if (nextPlayDate > now) {
            cooldownEndRef.current = nextPlayDate
            setCooldownMs(nextPlayDate - now)
            setStatus('cooldown')
          } else {
            cooldownEndRef.current = null
            setCooldownMs(0)
            setStatus('idle')
          }
        } else if (gameState.nextPlayAvailableAt) {
          const nextPlayDate = new Date(gameState.nextPlayAvailableAt).getTime()
          const now = Date.now()
          if (nextPlayDate > now) {
            cooldownEndRef.current = nextPlayDate
            setCooldownMs(nextPlayDate - now)
            if (!gameState.canPlay) {
              setStatus('cooldown')
            } else {
              setStatus('idle')
            }
          } else {
            cooldownEndRef.current = null
            setCooldownMs(0)
            setStatus('idle')
          }
        } else {
          cooldownEndRef.current = null
          setCooldownMs(0)
          if (gameState.lives > 0) {
            setStatus('idle')
          } else {
            setStatus('cooldown')
          }
        }
      } catch (error) {
        console.error('Failed to fetch game state:', error)
      } finally {
        setLoadingState(false)
      }
    }

    fetchGameState()

    const interval = window.setInterval(() => {
      const end = cooldownEndRef.current
      if (!end) {
        if (statusRef.current === 'cooldown') {
          fetchGameState().catch(console.error)
        }
        return
      }
      const now = Date.now()
      const remaining = Math.max(0, end - now)
      setCooldownMs(remaining)
      if (remaining <= 0) {
        cooldownEndRef.current = null
        if (statusRef.current === 'cooldown') {
          fetchGameState().catch(console.error)
        }
      }
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [accessToken])

  // Callbacks from engine to React state
  useEffect(() => {
    callbacksRef.current.onScore = (value: number) => {
      setScore(value)
    }
    callbacksRef.current.onLives = (value: number) => {
      setLives(value)
    }
    callbacksRef.current.onGameOver = async (result: 'won' | 'lost') => {
      setStatus(result)

      if (accessToken) {
        try {
          const gameState = await getGameState(accessToken)
          setLives(gameState.lives)

          if (gameState.lives === 0 && gameState.nextPlayAvailableAt) {
            const nextPlayDate = new Date(gameState.nextPlayAvailableAt).getTime()
            cooldownEndRef.current = nextPlayDate
            setCooldownMs(nextPlayDate - Date.now())
          } else {
            cooldownEndRef.current = null
            setCooldownMs(0)
          }
        } catch (error) {
          console.error('Failed to fetch game state after game over:', error)
        }
      }
    }
  }, [accessToken])

  useEffect(() => {
    if (!images) return
    if (!canvasRef.current || !containerRef.current) return
    if (engineRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const engine = new GameEngine(canvas, ctx, images, callbacksRef as GameCallbacksRef)
    engineRef.current = engine

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      engine.resize(width, height)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const loop = (time: number) => {
      const last = lastTimeRef.current ?? time
      const dt = Math.min(0.05, (time - last) / 1000)
      lastTimeRef.current = time

      engine.step(dt, statusRef.current)
      rafRef.current = window.requestAnimationFrame(loop)
    }

    rafRef.current = window.requestAnimationFrame(loop)

    return () => {
      resizeObserver.disconnect()
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [images])

  const startGame = async () => {
    if (statusRef.current === 'cooldown') return
    if (!engineRef.current) return
    if (!accessToken) return
    if (lives <= 0) return

    try {
      const response = await playGame(accessToken)
      setReward({
        id: response.reward.rewardType,
        title: response.reward.rewardType === 'small' ? t('game.smallPrize') : 
               response.reward.rewardType === 'medium' ? t('game.mediumPrize') :
               response.reward.rewardType === 'large' ? t('game.largePrize') : t('game.superRarePrize'),
        type: response.reward.seriesId ? 'free_series' : 'crowns',
        crowns: response.reward.crownsAmount,
        seriesId: response.reward.seriesId || undefined,
        seriesTitle: response.reward.seriesTitle || undefined,
        probability: 0,
      })
      setLives(response.remainingLives)
      
      if (response.remainingLives === 0 && response.nextPlayAvailableAt) {
        const nextPlayDate = new Date(response.nextPlayAvailableAt).getTime()
        cooldownEndRef.current = nextPlayDate
        setCooldownMs(nextPlayDate - Date.now())
      } else {
        cooldownEndRef.current = null
        setCooldownMs(0)
      }

      setScore(0)
      engineRef.current.startRun(response.remainingLives)
      setStatus('running')
    } catch (error: any) {
      console.error('Failed to start game:', error)
      const errorMessage = error?.message || t('game.gameAvailableIn')
      showToast(errorMessage)
      
      if (accessToken) {
        try {
          const gameState = await getGameState(accessToken)
          setLives(gameState.lives)
          if (gameState.lives === 0 && gameState.nextPlayAvailableAt) {
            const nextPlayDate = new Date(gameState.nextPlayAvailableAt).getTime()
            cooldownEndRef.current = nextPlayDate
            setCooldownMs(nextPlayDate - Date.now())
            setStatus('cooldown')
          } else if (!gameState.canPlay && gameState.nextPlayAvailableAt) {
            const nextPlayDate = new Date(gameState.nextPlayAvailableAt).getTime()
            cooldownEndRef.current = nextPlayDate
            setCooldownMs(nextPlayDate - Date.now())
            setStatus('cooldown')
          } else if (!gameState.canPlay) {
            setStatus('cooldown')
          }
        } catch (fetchError) {
          console.error('Failed to fetch game state:', fetchError)
        }
      }
    }
  }

  const handleTap = () => {
    const currentStatus = statusRef.current
    if (currentStatus === 'idle') {
      if (!cooldownEndRef.current) {
        startGame().catch(console.error)
      }
      return
    }
    if (currentStatus !== 'running') return
    engineRef.current?.tap()
  }

  const handleClose = () => {
    router.push('/')
  }

  const canStart = status !== 'cooldown' && !assetsLoading && !loadingState && lives > 0 && (cooldownEndRef.current === null || Date.now() >= (cooldownEndRef.current || 0))
  const heartsToShow = lives

  return (
    <main className="w-full h-full game-page">
      <div
        ref={containerRef}
        className="relative w-full h-[calc(100vh-24px)] overflow-hidden game-touch-layer"
        onPointerDown={handleTap}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
          <img src="/game-assets/score-icon.png" alt="" className="h-6 w-6 object-contain" />
          <span className="text-white font-semibold text-sm">x{score}</span>
        </div>

        <div className="absolute top-2 left-0 right-0 flex justify-center items-start z-10">
          <div className="relative inline-block">
            <img src="/game-assets/hearts-bg.png" alt="" className="object-contain max-w-full" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <img
                  key={i}
                  src={i < heartsToShow ? '/game-assets/heart-active.png' : '/game-assets/heart-inactive.png'}
                  alt=""
                  className="object-contain w-4 h-4"
                />
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
          }}
          className="absolute top-3 right-4 z-10 active:scale-95"
        >
          <img src="/game-assets/close-icon.png" alt={t('game.close')} className="object-contain w-10 h-10" />
        </button>

        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 z-10 pointer-events-none">
            <button
              type="button"
              disabled={!canStart}
              onClick={canStart ? () => startGame().catch(console.error) : undefined}
              className="pointer-events-auto active:scale-95 disabled:opacity-60"
            >
              <img
                src="/game-assets/start-button.png"
                alt={t('game.start')}
                className="object-contain max-w-[280px] w-[72vw]"
              />
            </button>
            {cooldownEndRef.current && (
              <div className="mt-3 text-xs text-white/80 text-center">
                {t('game.playAgainIn')} {formatCooldown(cooldownMs)}
              </div>
            )}
            {assetsLoading && !cooldownEndRef.current && (
              <div className="mt-3 text-xs text-white/80 text-center">{t('game.loadingMiniGame')}</div>
            )}
          </div>
        )}

        {status === 'cooldown' && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 z-10">
            <img
              src="/game-assets/start-button.png"
              alt=""
              className="object-contain max-w-[280px] w-[72vw] opacity-40"
            />
            <div className="mt-3 text-sm text-white/90 text-center px-6">
              {lives === 0 ? (
                <>{t('game.livesEnded')} {formatCooldown(cooldownMs)}.</>
              ) : (
                <>{t('game.gameAvailableIn')} {formatCooldown(cooldownMs)}.</>
              )}
            </div>
          </div>
        )}

        {status === 'lost' && !showRewardSpinner && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-20"
            style={isIOS ? {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            } : {}}
          >
            <div className="relative w-[85%] max-w-xs">
              <img src="/game-assets/lose-popup.png" alt="" className="w-full h-auto object-contain" />
              <div className="absolute inset-0 px-7 pt-10 pb-6 flex flex-col justify-between">
                <div className="space-y-3 text-center text-[13px] leading-relaxed">
                  
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (reward) {
                        setShowRewardSpinner(true)
                      } else {
                        handleClose()
                      }
                    }}
                    className="active:scale-95"
                  >
                    <img
                      src="/game-assets/lose-button.png"
                      alt={t('game.goHome')}
                      className="object-contain max-w-[260px] w-[68vw]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'won' && !showRewardSpinner && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-20"
            style={isIOS ? {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            } : {}}
          >
            <div className="relative w-[85%] max-w-xs">
              <img src="/game-assets/win-popup.png" alt="" className="w-full h-auto object-contain" />
              <div className="absolute inset-0 px-7 pt-9 pb-6 flex flex-col justify-between">
                <div className="space-y-3 text-center text-[13px] leading-relaxed">
                  <div className="text-[20px] font-semibold">{t('game.victory')}</div>
                  <div>{t('game.scoredPoints').replace('{score}', score.toString())}</div>
                  <div>{t('game.congratulations')}</div>
                  <div>{t('game.prizeChance')}</div>
                  <div className="font-semibold text-[12px]">{renderRewardDescription(reward, t)}</div>
                  <div className="text-[11px] text-white/80">
                    {t('game.playAgainInHour')}
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (reward) {
                        setShowRewardSpinner(true)
                      } else {
                        handleClose()
                      }
                    }}
                    className="active:scale-95"
                  >
                    <img
                      src="/game-assets/win-button.png"
                      alt={t('game.claimGift')}
                      className="object-contain max-w-[260px] w-[68vw]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRewardSpinner && reward && (
          <RewardSpinner
            reward={reward}
            onComplete={() => {
              setShowRewardSpinner(false)
              router.push('/rewards')
            }}
            onClose={() => {
              setShowRewardSpinner(false)
              router.push('/rewards')
            }}
          />
        )}
      </div>
    </main>
  )
}


