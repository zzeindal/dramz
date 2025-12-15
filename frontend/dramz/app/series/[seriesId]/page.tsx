'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSeriesEpisodes } from '@/hooks/useSeriesEpisodes'
import { API_BASE_URL } from '@/lib/api/client'
import CrownIcon from '../../components/CrownIcon'

export default function SeriesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params?.seriesId as string
  const { data: episodesData, loading, error } = useSeriesEpisodes(seriesId)
  const show = episodesData?.series

  const handleWatch = () => {
    router.push(`/watch/${seriesId}`)
  }

  const handleBuy = () => {
    router.push(`/purchase/${seriesId}`)
  }

  return (
    <div className="relative">
      <main className="w-full relative z-10">
        <section className="px-4">
          {loading && (
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden relative bg-white/10 aspect-[3/4] animate-pulse" />
              <div className="h-6 bg-white/10 rounded-xl w-2/3 mx-auto animate-pulse" />
              <div className="mt-3 space-y-3">
                <div className="w-full h-12 rounded-2xl bg-white/10 animate-pulse" />
                <div className="w-full h-12 rounded-2xl bg-white/10 animate-pulse" />
              </div>
            </div>
          )}
          {!loading && error && (
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-4 py-3 h-full w-full text-sm text-red-300 text-center space-y-2 relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                <div>Не удалось загрузить сериал. Попробуйте позже.</div>
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-red-400 mt-2 break-all">{error}</div>
                )}
              </div>
            </div>
          )}
          {!loading && !error && show && (
            <div className="px-2">
              <div className="flex justify-center mt-4 mb-6">
                <img
                  src={`${API_BASE_URL}/${show.coverImage}`}
                  alt=""
                  className="rounded-[24px] shadow-[0_0px_10px_rgba(143,55,255,0.4)] h-[43vh] aspect-auto object-cover object-center"
                />
              </div>
              <div className="text-center mt-4 text-[28px] font-semibold">
                {show.title}
              </div>
              <div className="text-center text-[12px] text-white/70 px-10">
                {show.description}
              </div>
              <div className="mt-3 space-y-3">
                <button
                  onClick={handleWatch}
                  className="w-full h-12 rounded-full shadow-[0_0px_10px_rgba(143,55,255,0.4)] bg-[#0D0920] text-white font-medium flex items-center justify-center gap-2 px-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.790849 10.6667C0.921569 10.6667 1.04466 10.6421 1.16013 10.5929C1.2756 10.5437 1.40087 10.4833 1.53595 10.4117L9.93467 6.23229C10.2135 6.08917 10.4052 5.94829 10.5098 5.80965C10.6144 5.671 10.6667 5.51223 10.6667 5.33334C10.6667 5.15444 10.6144 4.99567 10.5098 4.85703C10.4052 4.71838 10.2135 4.57974 9.93467 4.44109L1.53595 0.254927C1.39651 0.187841 1.26906 0.128581 1.15359 0.0771487C1.03812 0.0257162 0.915032 0 0.784317 0C0.544664 0 0.354031 0.0872118 0.212418 0.261635C0.0708061 0.436059 0 0.668624 0 0.95933L0.00653594 9.70733C0.00653594 9.99805 0.0773419 10.2306 0.218954 10.405C0.360566 10.5794 0.551198 10.6667 0.790849 10.6667Z" fill="white" fillOpacity="0.8" />
                  </svg>
                  <span>Смотреть первые 10 серий</span>
                </button>
                <button
                  onClick={handleBuy}
                  className="w-full h-12 rounded-full text-white font-medium flex items-center justify-center gap-1 px-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-glow-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #8F37FF 0%, #AC6BFF 100%)'
                  }}
                >
                  <span>Купить сразу все серии</span>
                  <CrownIcon />
                </button>
              </div>
            </div>
          )}
          {!loading && !error && !show && (
            <div
              style={{
                background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
                borderRadius: '9px',
                pointerEvents: 'none',
                padding: '1px'
              }}
            >
              <div
                className="rounded-[8px] px-4 py-3 h-full w-full text-sm text-white/80 text-center relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                Сериал не найден
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

