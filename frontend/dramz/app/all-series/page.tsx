'use client'

import { useRouter } from 'next/navigation'
import { useSeriesList } from '@/hooks/useSeriesList'
import { API_BASE_URL } from '@/lib/api/client'

export default function AllSeriesPage() {
  const router = useRouter()
  const { data, loading, error } = useSeriesList()
  const series = data || []

  const handleSeriesClick = (series: any) => {
    router.push(`/series/${series._id}`)
  }

  const backgroundStyle = {
    backgroundImage: 'url("/bg-pages.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat'
  }

  return (
    <div className="relative" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black/60" style={{ zIndex: 1 }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0D0920 0%, transparent 20%, transparent 80%, #0D0920 100%)', zIndex: 2 }} />
      <main className="w-full relative z-10">

        <section className="px-4">
          <h1 className="text-2xl font-bold mb-6">Все новинки</h1>
          
          {loading && (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[3/4] bg-white/10 rounded-xl mb-2" />
                  <div className="h-4 bg-white/10 rounded w-3/4 mx-auto" />
                </div>
              ))}
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
                className="rounded-[8px] px-4 py-3 h-full w-full text-sm text-red-300 text-center relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(20, 16, 38, 0.9)'
                }}
              >
                Не удалось загрузить сериалы
              </div>
            </div>
          )}

          {!loading && !error && series.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {series.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSeriesClick(item)}
                  className="cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src={`${API_BASE_URL}/${item.coverImage}`}
                    alt={item.title}
                    className="w-full aspect-[3/4] object-cover rounded-xl mb-2"
                  />
                  <h3 className="text-sm font-medium text-center text-white line-clamp-2">{item.title}</h3>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && series.length === 0 && (
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
                Сериалы пока недоступны
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

