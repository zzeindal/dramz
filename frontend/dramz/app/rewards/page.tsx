'use client'

import CrownIcon from '../components/CrownIcon'
import { useDispatch, useSelector } from 'react-redux'
import { openModal } from '../state/slices/ui'
import { useEffect, useMemo, useState } from 'react'
import { RootState } from '../state/store'
import { fetchActiveTasks, completeTask } from '../state/slices/tasks'
import { useTranslation } from '../hooks/useTranslation'
import { showToast } from '../utils/toast'

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
  const { t } = useTranslation()

  useEffect(() => {
    if (!accessToken) return
    dispatch(fetchActiveTasks({ token: accessToken }) as any)
  }, [accessToken, dispatch])

  const computeCountdowns = useMemo(() => {
    return (now: number) => {
      const map: Record<string, number> = {}
      tasks.forEach(task => {
        if (task.nextAvailableAt) {
          const next = new Date(task.nextAvailableAt).getTime()
          const diff = Math.max(0, Math.floor((next - now) / 1000))
          if (diff > 0) map[task.id] = diff
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

  const handleActionClick = async (taskId: string, type: string) => {
    if (!accessToken) {
      dispatch(openModal({ name: 'login' }))
      return
    }
    if (type === 'manual') {
      dispatch(openModal({ name: 'repost', data: { taskId } }))
      return
    }
    try {
      const result = await dispatch(completeTask({ token: accessToken, taskId }) as any)
      if (completeTask.rejected.match(result)) {
        showToast(t('rewards.cannotCompleteTask'))
      } else {
        dispatch(fetchActiveTasks({ token: accessToken }) as any)
      }
    } catch (error) {
      showToast(t('rewards.cannotCompleteTask'))
    }
  }

  return (
    <main className="w-full pb-8">
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
            <div className="text-white/90 text-sm font-bold uppercase tracking-[0.08em]">{t('rewards.crownBalance')}</div>
            <div className="text-2xl font-semibold flex items-center gap-2 text-white">{crowns} <CrownIcon className="w-6 h-6" /></div>
          </div>
        </div>
      </section>
      <section className="px-5 mt-4">
        <div className="text-white font-semibold mb-3 text-lg">{t('rewards.howToEarn')}</div>
        <div className="overflow-hidden  border-t-[2px] border-[#261f3f]">
          {loadingActive && (
            <div className="py-3 text-white/70 text-sm">{t('rewards.loadingTasks')}</div>
          )}
          {!loadingActive && tasks.map(task => {
            const seconds = countdowns[task.id]
            const hasCountdown = seconds !== undefined && seconds > 0
            const isCompleting = !!completing[task.id]
            const disabled = !task.canComplete || hasCountdown || isCompleting
            return (
              <div key={task.id} className=" py-3 border-b-[2px] border-[#261f3f] last:border-0">
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-white mb-1">{task.title}</div>
                    <div className="text-sm text-white/80 leading-relaxed">{task.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-base whitespace-nowrap flex items-center gap-1 text-white">
                      {task.reward} <CrownIcon className="w-5 h-5" />
                    </div>
                    {hasCountdown ? (
                      <div className="px-3 py-1.5 rounded-md text-xs font-medium text-white whitespace-nowrap bg-white/10">
                        {formatCountdown(seconds)}
                      </div>
                    ) : (
                      <button
                        disabled={disabled}
                        onClick={() => handleActionClick(task.id, task.type)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#704ED7' }}
                      >
                        {isCompleting ? t('rewards.sending') : t('rewards.complete')}
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


