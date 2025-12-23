'use client'

import { useEffect, useState, useRef } from 'react'
import { GameReward } from '../game/rewardsConfig'
import { useTranslation } from '../hooks/useTranslation'

interface RewardSpinnerProps {
  reward: GameReward
  onComplete: () => void
  onClose: () => void
}

const PRIZE_IMAGES = [
  { type: 'crowns', value: 20, image: '/game-prizes/20-crown.png' },
  { type: 'crowns', value: 30, image: '/game-prizes/30-crown.png' },
  { type: 'crowns', value: 45, image: '/game-prizes/45-crown.png' },
  { type: 'free_series', value: 0, image: '/game-prizes/free-serial.png' },
]

const WHEEL_SEGMENTS = [...PRIZE_IMAGES, ...PRIZE_IMAGES]

export default function RewardSpinner({ reward, onComplete, onClose }: RewardSpinnerProps) {
  const { t } = useTranslation()
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(true)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    let targetSegmentIndex = 0

    if (reward.type === 'crowns') {
      const indices = WHEEL_SEGMENTS
        .map((segment, index) => ({ segment, index }))
        .filter(
          item =>
            item.segment.type === 'crowns' &&
            item.segment.value === reward.crowns,
        )
      if (indices.length > 0) {
        targetSegmentIndex = indices[indices.length - 1].index
      }
    } else if (reward.type === 'free_series') {
      const indices = WHEEL_SEGMENTS
        .map((segment, index) => ({ segment, index }))
        .filter(item => item.segment.type === 'free_series')
      if (indices.length > 0) {
        targetSegmentIndex = indices[indices.length - 1].index
      }
    }

    const segmentAngle = 360 / WHEEL_SEGMENTS.length
    const rounds = 5
    const finalRotation = 360 * rounds - targetSegmentIndex * segmentAngle
    const duration = 4500
    const start = performance.now()

    setIsSpinning(true)

    const animate = (time: number) => {
      const elapsed = time - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const currentRotation = finalRotation * eased

      setRotation(currentRotation)

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reward, onComplete])

  const rewardLabel =
    reward.type === 'crowns'
      ? `${reward.crowns} ${t('game.crowns')}`
      : reward.seriesTitle || t('game.series')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#5b21ff_0%,_#0b061b_45%,_#050112_100%)] opacity-90" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-purple-500/30 blur-3xl animate-[pulseRing_3s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-160px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl text-[11px] uppercase tracking-[0.2em] text-purple-100">
            <span>{t('game.victory')}</span>
          </div>
          <div className="text-[26px] font-semibold mt-2">
            {t('game.prizeChance')}
          </div>
          <div className="text-sm text-white/80">
            {reward.type === 'crowns'
              ? t('game.crownsInProfile')
              : t('game.seriesAvailableFree')}
          </div>
        </div>

        <div className="relative w-72 h-72 mb-10">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,_rgba(255,255,255,0.25),_rgba(168,85,247,0.4),_rgba(56,189,248,0.3),_rgba(255,255,255,0.25))] opacity-80 animate-[spinGlow_12s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full bg-black/70 border border-purple-400/60 shadow-[0_0_40px_rgba(168,85,247,0.9)] overflow-hidden flex items-center justify-center">
            <div
              className="relative w-full h-full transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {WHEEL_SEGMENTS.map((segment, index) => {
                const angle = (360 / WHEEL_SEGMENTS.length) * index
                const isFreeSeries = segment.type === 'free_series'

                return (
                  <div
                    key={`${segment.type}-${segment.value}-${index}`}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-42%) translateX(-50%)`,
                      transformOrigin: '50% 50%',
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor: isFreeSeries
                          ? 'rgba(251, 191, 36, 0.22)'
                          : 'rgba(15, 23, 42, 0.85)',
                        boxShadow: isFreeSeries
                          ? '0 0 30px rgba(251, 191, 36, 0.9)'
                          : '0 0 18px rgba(168, 85, 247, 0.7)',
                      }}
                    >
                      <img
                        src={segment.image}
                        alt=""
                        className="w-full h-full object-contain p-2"
                        style={{
                          transform: `rotate(${-angle}deg)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="absolute -top-[18px] left-1/2 -translate-x-1/2">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]" />
              <div className="w-[3px] h-5 mx-auto bg-gradient-to-b from-amber-300 to-transparent" />
            </div>

            {!isSpinning && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 16 }).map((_, index) => {
                  const colors = ['#fde68a', '#f9a8d4', '#a5b4fc', '#6ee7b7']
                  const color = colors[index % colors.length]

                  return (
                    <span
                      key={index}
                      className="absolute w-1.5 h-3 rounded-full"
                      style={{
                        left: `${(index * 6.25) % 100}%`,
                        top: '-8%',
                        backgroundColor: color,
                        opacity: 0.9,
                        animation: 'confettiFloat 4s linear infinite',
                        animationDelay: `${index * -0.25}s`,
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-xs mx-auto mb-6">
          <div className={`rounded-2xl px-5 py-4 text-center border border-white/15 bg-black/60 backdrop-blur-xl shadow-[0_0_40px_rgba(15,23,42,0.9)] ${!isSpinning ? 'animate-[rewardPulse_1.8s_ease-out_infinite]' : ''}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] text-purple-200/80 mb-1">
              {reward.type === 'crowns' ? t('game.crowns') : t('game.series')}
            </div>
            <div className="text-xl font-semibold">
              {rewardLabel}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              if (!isSpinning) onClose()
            }}
            disabled={isSpinning}
            className="px-10 py-4 rounded-2xl text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_15px_40px_rgba(124,58,237,0.7)] active:scale-95"
            style={{
              background:
                'radial-gradient(circle at top, #fbbf24 0%, #ec4899 30%, #8b5cf6 70%, #4f46e5 100%)',
            }}
          >
            {isSpinning ? t('game.loadingMiniGame') : t('game.claimGift')}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spinGlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.95);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.5;
          }
        }

        @keyframes confettiFloat {
          0% {
            transform: translate3d(0, 0, 0) rotateZ(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 120vh, 0) rotateZ(360deg);
            opacity: 0;
          }
        }

        @keyframes rewardPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.6);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.8);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.6);
          }
        }
      `}</style>
    </div>
  )
}

