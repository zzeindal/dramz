'use client'

import { GameReward } from '../game/rewardsConfig'
import { useTranslation } from '../hooks/useTranslation'

interface RewardModalProps {
  reward: GameReward
  onClose: () => void
}

export default function RewardModal({ reward, onClose }: RewardModalProps) {
  const { t } = useTranslation()

  if (reward.type === 'crowns') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="w-full max-w-xs mx-6">
          <div 
            className="rounded-3xl p-8 text-center"
            style={{ backgroundColor: '#1a1533' }}
          >
            <div className="text-white text-lg mb-6 leading-relaxed">
              {t('game.crownsInProfile')}
            </div>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl text-white font-medium active:scale-95 transition-transform"
              style={{ backgroundColor: '#704ED7' }}
            >
              {t('game.great')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-xs mx-6">
        <div 
          className="rounded-3xl p-8 text-center"
          style={{ backgroundColor: '#1a1533' }}
        >
          <div className="text-white text-lg mb-2">
            {t('game.series')}
          </div>
          <div className="text-white text-lg mb-2 font-semibold">
            "{reward.seriesTitle || t('game.series')}"
          </div>
          <div className="text-white text-lg mb-6">
            {t('game.seriesAvailableFree')}
          </div>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl text-white font-medium active:scale-95 transition-transform"
            style={{ backgroundColor: '#704ED7' }}
          >
            {t('game.great')}
          </button>
        </div>
      </div>
    </div>
  )
}

