'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSeriesList } from '@/hooks/useSeriesList'
import { API_BASE_URL } from '@/lib/api/client'
import PayButton from './components/PayButton'

export default function Home() {
  const router = useRouter()
  const { data, loading, error } = useSeriesList()
  const [currentIndex, setCurrentIndex] = useState(0)
  const shows = data && data.length > 0 ? data.slice(0, 3) : []
  const show = shows[currentIndex] || null
  const seriesListRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const openWatch = () => {
    if (!show) return
    router.push(`/series/${show._id}`)
  }

  const scrollToSeriesList = () => {
    seriesListRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      touchStartX.current = 0
      touchEndX.current = 0
      return
    }
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentIndex < shows.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }

    touchStartX.current = 0
    touchEndX.current = 0
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }
  // const backgroundStyle = {
  //   backgroundImage: 'url("/bg-pages.png")',
  //   backgroundSize: 'cover',
  //   backgroundPosition: 'center center',
  //   backgroundRepeat: 'no-repeat'
  // }

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {shows.length > 0 && (
        <div className="absolute -top-30 left-0 w-full h-screen pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div
            ref={sliderRef}
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {shows.map((slideShow, index) => (
              <div key={slideShow._id} className="min-w-full h-full relative">
                <img
                  src={`${API_BASE_URL}/${slideShow.coverImage}`}
                  alt=""
                  className="absolute top-0 left-0 w-full h-full object-cover object-top"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13, 9, 32, 0.95) 0%, rgba(13, 9, 32, 0.8) 15%, rgba(13, 9, 32, 0.3) 40%, rgba(13, 9, 32, 0.8) 60%, rgba(13, 9, 32, 0.6) 85%, rgba(13, 9, 32, 0.95) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13, 9, 32, 0.98) 0%, rgba(13, 9, 32, 0.7) 20%, rgba(13, 9, 32, 0.2) 40%, transparent 60%)' }} />
        </div>
      )}
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
            <>
              <div className='h-[43vh]' />
              {shows.length > 1 && (
                <div className="flex justify-center gap-2 mb-4">
                  {shows.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                        ? 'bg-[#8F37FF] w-6 shadow-lg shadow-[#8F37FF]/50'
                        : 'bg-[#8F37FF]/40 w-2'
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              <div
                key={`title-${currentIndex}`}
                className="text-center mt-4 text-[28px] font-semibold transition-all duration-500 ease-in-out animate-fade-in"
              >
                {show.title}
              </div>
              <div
                key={`desc-${currentIndex}`}
                className="text-center text-[12px] text-white/70 px-10 transition-all duration-500 ease-in-out animate-fade-in"
              >
                {show.description}
              </div>
              <div
                key={`buttons-${currentIndex}`}
                className="mt-3 space-y-3 transition-all duration-500 ease-in-out animate-fade-in"
              >
                <PayButton
                  onClick={openWatch}
                  className="w-full h-12 rounded-full bg-white/10 text-white font-medium flex items-center justify-center gap-2 px-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" amount={''}                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.790849 10.6667C0.921569 10.6667 1.04466 10.6421 1.16013 10.5929C1.2756 10.5437 1.40087 10.4833 1.53595 10.4117L9.93467 6.23229C10.2135 6.08917 10.4052 5.94829 10.5098 5.80965C10.6144 5.671 10.6667 5.51223 10.6667 5.33334C10.6667 5.15444 10.6144 4.99567 10.5098 4.85703C10.4052 4.71838 10.2135 4.57974 9.93467 4.44109L1.53595 0.254927C1.39651 0.187841 1.26906 0.128581 1.15359 0.0771487C1.03812 0.0257162 0.915032 0 0.784317 0C0.544664 0 0.354031 0.0872118 0.212418 0.261635C0.0708061 0.436059 0 0.668624 0 0.95933L0.00653594 9.70733C0.00653594 9.99805 0.0773419 10.2306 0.218954 10.405C0.360566 10.5794 0.551198 10.6667 0.790849 10.6667Z" fill="white" fillOpacity="0.8" />
                  </svg>
                  <span>Смотреть</span>
                </PayButton>
                <button
                  onClick={scrollToSeriesList}
                  className="w-full flex justify-center"
                >
                  <svg
                    className="text-white/80 animate-updown"
                    width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.2085 11L17.5002 18.2916" stroke="white" strokeWidth="2.91667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5 18.2916L24.7917 11" stroke="white" strokeWidth="2.91667" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </>
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
                Сериалы пока недоступны
              </div>
            </div>
          )}
        </section>

        <section ref={seriesListRef} className="mt-12 pb-8">
          <div className="px-4 flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Будущие новинки</h2>
            <Link
              href="/all-series"
              className="text-sm text-white/80"
            >
              Все новинки {'>'}
            </Link>
          </div>
          {data && data.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              <div
                className="flex gap-4 px-4 pb-2"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollPaddingLeft: '1rem'
                }}
              >
                {data.map((series) => (
                  <div
                    key={series._id}
                    className="flex-shrink-0"
                    style={{
                      width: 'calc((100vw - 5rem) / 3.3)',
                      maxWidth: '109px',
                      minWidth: '109px',
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <div
                      onClick={() => router.push(`/series/${series._id}`)}
                      className="cursor-pointer active:scale-95 transition-transform"
                    >
                      <img
                        src={`${API_BASE_URL}/${series.coverImage}`}
                        alt={series.title}
                        className="w-full h-[145px] object-cover rounded-xl mb-2"
                      />
                      <h3 className="text-sm font-medium text-center text-white">{series.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="px-4">
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
              </div>
            )
          )}
        </section>
      </main>
    </div>
  )
}
