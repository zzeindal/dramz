'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useCrownExchangeRate } from '@/hooks/useCrownExchangeRate'
import { useSeriesEpisodes } from '@/hooks/useSeriesEpisodes'
import PayButton from '../../components/PayButton'
import { API_BASE_URL } from '@/lib/api/client'
import CrownIcon from '../../components/CrownIcon'

export default function PurchasePage() {
  const params = useParams()
  const seriesId = params?.seriesId as string
  const [method, setMethod] = useState<'visa' | 'usdt'>('visa')
  const [crowns, setCrowns] = useState(0)
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
    return crownRate
  }, [rate, crownRate])
  const { data: episodesData, loading } = useSeriesEpisodes(seriesId)
  const show = episodesData?.series
  const episodesCount = episodesData?.episodes?.length ?? 0

  const backgroundImage = show?.coverImage ? `${API_BASE_URL}/${show.coverImage}` : null

  return (
    <>
      {backgroundImage && (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat app-frame"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              zIndex: 0
            }}
          />
          <div
            className="fixed inset-0 app-frame"
            style={{
              zIndex: 1,
              background: 'rgba(13, 9, 32, 0.97)'
            }}
          />
        </>
      )}
      <main className="w-full px-4 py-6 space-y-4 relative z-10">
        <h1 className="text-2xl font-bold text-white mb-6">Покупка сериала</h1>
        {loading ? (
          <div className="space-y-4">
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden animate-pulse"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                <div className="h-6 bg-white/10 rounded w-2/3" />
              </div>
            </div>
          </div>
        ) : !show ? (
          <div
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius: '9px',
              pointerEvents: 'none',
              padding: '1px'
            }}
          >
            <div
              className="rounded-[8px] px-4 py-3 h-full w-full text-sm text-red-300 text-center relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(20, 16, 38, 0.9)'
              }}
            >
              Сериал не найден
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-3 h-full w-full py-3 relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >

                <div className="text-xs text-white/60 mb-1">Сериал</div>
                <div className="text-sm text-white font-medium">{show.title}</div>
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
                className="rounded-[8px] px-3 h-full w-full py-3 relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60 mb-1">Кол-во серий</div>
                <div className="text-sm text-white font-medium">{episodesCount || '-'}</div>
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
                className="rounded-[8px] px-3 h-full w-full py-3 relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60 mb-3">Способ оплат</div>
                <div className="flex items-center gap-3" style={{ pointerEvents: 'auto' }}>
                  <button
                    onClick={() => setMethod('visa')}
                    className={`relative rounded-md transition-all overflow-hidden ${method === 'visa' ? 'ring-2 ring-white' : ''}`}
                    style={{ width: '90px', height: '60px' }}
                  >
                    <Image
                      src="/visa.svg"
                      alt="Visa"
                      width={90}
                      height={60}
                      className="w-full h-full object-cover"
                    />
                    {method === 'visa' && (
                      <div className="absolute bottom-0 left-0 px-1 bg-white rounded-tr-md text-[10px] text-black font-medium opacity-90">Выбрано</div>
                    )}
                  </button>
                  <button
                    onClick={() => setMethod('usdt')}
                    className={`relative rounded-md transition-all overflow-hidden ${method === 'usdt' ? 'ring-2 ring-white' : ''}`}
                    style={{ width: '90px', height: '60px' }}
                  >
                    <Image
                      src="/usdt.svg"
                      alt="USDT"
                      width={90}
                      height={60}
                      className="w-full h-full object-cover"
                    />
                    {method === 'usdt' && (
                      <div className="absolute bottom-0 left-0 px-1 bg-white rounded-tr-md text-[10px] text-black font-medium opacity-90">Выбрано</div>
                    )}
                  </button>
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
                className="rounded-[8px] px-3 h-full w-full py-3 relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div className="text-xs text-white/60 flex items-center justify-between mb-3">
                  <span>Добавить короны для скидки</span>
                  <span className="text-xs flex items-center gap-1">1 USDT - {crownsPerUsdt} <CrownIcon /></span>
                </div>
                <div className="text-[16px] text-white font-medium min-w-[50px] flex items-center gap-1">{crowns} <CrownIcon className="w-4 h-4 text-[#fffff]" /></div>
                <div className="flex items-center mt-4 gap-3" style={{ pointerEvents: 'auto' }}>
                  <input
                    type="range"
                    min={0}
                    max={maxCrowns}
                    value={crowns}
                    onChange={e => setCrowns(Number(e.target.value))}
                    className="flex-1 h-1 appearance-none cursor-pointer slider"
                    style={{
                      backgroundColor: '#3D2A8D',
                      backgroundImage: `linear-gradient(to right, #8F37FF 0%, #8F37FF ${(crowns / maxCrowns) * 100}%, transparent ${(crowns / maxCrowns) * 100}%),
                        radial-gradient(circle, rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px)`,
                      backgroundSize: `100% 100%, 25px 100%`,
                      backgroundPosition: `0 0, 0 50%`,
                      backgroundRepeat: 'no-repeat, repeat-x',
                      borderRadius: '2px'
                    }}
                  />
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
                  className="rounded-[8px] px-3 h-full w-full py-3 relative overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(20, 16, 38, 0.9)'
                  }}
                >
                  <div className="text-xs text-white/60 mb-1">Скидка коронами</div>
                  <div className="text-sm text-white font-medium flex items-center gap-1">{crowns} <CrownIcon /> = {discount.toFixed(0)} USDT</div>
                </div>
              </div>
              <div
                className="rounded-[8px] px-3 h-full w-full py-3 relative overflow-hidden"
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(112, 78, 215, 0.4) 100%)',
                }}
              >
                <div className="text-xs text-white/60 mb-1">Сумма к оплате</div>
                <div className="text-sm text-white font-semibold">{total.toFixed(0)} USDT</div>
              </div>
            </div>

            <PayButton amount={total.toFixed(0)} />
          </div>
        )}
      </main>
    </>
  )
}

