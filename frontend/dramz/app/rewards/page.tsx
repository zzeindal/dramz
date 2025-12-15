'use client'

import CrownIcon from '../components/CrownIcon'
import { useDispatch, useSelector } from 'react-redux'
import { openModal } from '../state/slices/ui'
import { useEffect, useMemo, useState } from 'react'
import { RootState } from '../state/store'
import { fetchActiveTasks, completeTask } from '../state/slices/tasks'

function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function RewardsPage() {
  const dispatch = useDispatch()
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const crowns = useSelector((s: RootState) => s.auth.apiUser?.crowns) || 0
  const { active: tasks, loadingActive, completing } = useSelector((s: RootState) => s.tasks)
  const [countdowns, setCountdowns] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!accessToken) return
    dispatch(fetchActiveTasks({ token: accessToken }) as any)
  }, [accessToken, dispatch])

  const computeCountdowns = useMemo(() => {
    return (now: number) => {
      const map: Record<string, number> = {}
      tasks.forEach(t => {
        if (t.nextAvailableAt) {
          const next = new Date(t.nextAvailableAt).getTime()
          const diff = Math.max(0, Math.floor((next - now) / 1000))
          if (diff > 0) map[t.id] = diff
        }
      })
      return map
    }
  }, [tasks])

  useEffect(() => {
    setCountdowns(computeCountdowns(Date.now()))
    const interval = setInterval(() => {
      setCountdowns(computeCountdowns(Date.now()))
    }, 1000)
    return () => clearInterval(interval)
  }, [computeCountdowns])

  const handleActionClick = (taskId: string, type: 'manual' | 'automatic') => {
    if (!accessToken) {
      dispatch(openModal({ name: 'login' }))
      return
    }
    if (type === 'manual') {
      dispatch(openModal({ name: 'repost', data: { taskId } }))
      return
    }
    dispatch(completeTask({ token: accessToken, taskId }) as any)
  }

  return (
    <main className="w-full">
      <section className="px-4 pt-4">
        <div
          style={{
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
            borderRadius: '9px',
            pointerEvents: 'none',
            padding: '1px'
          }}
        >
          <div
            className="rounded-[8px] p-4 h-full w-full flex items-center justify-between relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(20, 16, 38, 0.9)'
            }}
          >
            <div className="text-white/80 text-sm">Баланс корон</div>
            <div className="text-lg font-semibold flex items-center gap-1 text-white">{crowns} <CrownIcon className="w-5 h-5" /></div>
          </div>
        </div>
      </section>
      <section className="px-5 mt-4">
        <div className="text-white font-medium mb-2 text-extrabold text-base">Как заработать короны?</div>
        <div className="overflow-hidden  border-t-[2px] border-[#261f3f]">
          {loadingActive && (
            <div className="py-3 text-white/70 text-sm">Загрузка заданий...</div>
          )}
          {!loadingActive && tasks.map(t => {
            const seconds = countdowns[t.id]
            const hasCountdown = seconds !== undefined && seconds > 0
            const isCompleting = !!completing[t.id]
            const disabled = !t.canComplete || hasCountdown || isCompleting
            return (
              <div key={t.id} className=" py-3 border-b-[2px] border-[#261f3f] last:border-0">
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">{t.title}</div>
                    <div className="text-xs text-white/70 leading-relaxed">{t.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-sm whitespace-nowrap flex items-center gap-1 text-white">
                      {t.reward} <CrownIcon className="w-4 h-4" />
                    </div>
                    {hasCountdown ? (
                      <div className="px-3 py-1.5 rounded-md text-xs font-medium text-white whitespace-nowrap bg-white/10">
                        {formatCountdown(seconds)}
                      </div>
                    ) : (
                      <button
                        disabled={disabled}
                        onClick={() => handleActionClick(t.id, t.type)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#704ED7' }}
                      >
                        {isCompleting ? 'Отправка...' : 'Выполнить'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}


