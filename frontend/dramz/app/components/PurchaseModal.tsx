'use client'

import Modal from './Modal'
import PayButton from './PayButton'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { useMemo, useState } from 'react'
import { useCrownExchangeRate } from '@/hooks/useCrownExchangeRate'
import { useSeriesEpisodes } from '@/hooks/useSeriesEpisodes'
import CrownIcon from './CrownIcon'

export default function PurchaseModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'purchase')
  const data = useSelector((s: RootState) => s.ui.modalData)
  const dispatch = useDispatch()
  const [method, setMethod] = useState<'visa' | 'usdt'>('visa')
  const [crowns, setCrowns] = useState(0)
  const show = data?.show
  const seriesId = data?.seriesId || show?._id || null
  const basePrice = 12
  const crownRate = 10
  const maxCrowns = 100
  const discount = useMemo(() => Math.min(crowns, maxCrowns) / crownRate, [crowns])
  const total = useMemo(() => Math.max(basePrice - discount, 0), [basePrice, discount])
  const { data: rate } = useCrownExchangeRate()
  const crownsPerUsdt = useMemo(() => {
    if (rate && rate.usdPerCrown > 0) {
      return Math.round(1 / rate.usdPerCrown)
    }
    return maxCrowns / (basePrice || 1)
  }, [rate, maxCrowns, basePrice])
  const { data: episodesData } = useSeriesEpisodes(seriesId)
  const episodesCount = episodesData?.episodes?.length ?? 0

  return (
    <Modal open={open} onClose={() => dispatch(closeModal())} title="Покупка">
      {!show ? null : (
        <div className="space-y-3">
          <div className="text-white/70 text-sm">Подтвердите покупку</div>
          <div className="space-y-3">
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60">Сериал</div>
                <div className="text-sm mt-1">{show.title}</div>
              </div>
            </div>
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60">Кол-во серий</div>
                <div className="text-sm mt-1">{episodesCount || '-'}</div>
              </div>
            </div>
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60">Способ оплат</div>
                <div className="mt-2 flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
                  <button onClick={() => setMethod('visa')} className={`px-3 py-2 rounded-lg text-sm ${method === 'visa' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>VISA</button>
                  <button onClick={() => setMethod('usdt')} className={`px-3 py-2 rounded-lg text-sm ${method === 'usdt' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>USDT</button>
                </div>
              </div>
            </div>
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60 flex items-center justify-between">
                  <div>Добавить короны для скидки</div>
                  <div className="flex items-center gap-1">1 USDT - {crownsPerUsdt} <CrownIcon /></div>
                </div>
                <div className="mt-2 flex items-center gap-2" style={{ pointerEvents: 'auto' }}>
                  <input type="range" min={0} max={maxCrowns} value={crowns} onChange={e => setCrowns(Number(e.target.value))} className="w-full" />
                  <div className="px-2 py-1 rounded bg-white/10 text-xs">{crowns}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                style={{
                  background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                  borderRadius: '9px',
                  pointerEvents: 'none',
                  padding: '1px'
                }}
              >
                <div
                  className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(20, 16, 38, 0.9)'
                  }}
                >
                  <div className="text-xs text-white/60">Скидка коронами</div>
                  <div className="text-sm mt-1 flex items-center gap-1">{crowns} <CrownIcon /> = {discount.toFixed(0)} USDT</div>
                </div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                  borderRadius: '9px',
                  pointerEvents: 'none',
                  padding: '1px'
                }}
              >
                <div
                  className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(20, 16, 38, 0.9)'
                  }}
                >
                  <div className="text-xs text-white/60">Сумма к оплате</div>
                  <div className="text-sm mt-1">{total.toFixed(0)} USDT</div>
                </div>
              </div>
            </div>
            <PayButton amount={total.toFixed(0)} />
          </div>
        </div>
      )}
    </Modal>
  )
}


