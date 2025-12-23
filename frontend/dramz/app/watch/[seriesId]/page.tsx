'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useSeriesEpisodes } from '@/hooks/useSeriesEpisodes'
import { API_BASE_URL } from '@/lib/api/client'
import { bookmarkSeries, getSeriesStatus, likeSeries } from '@/lib/api/series'
import CrownIcon from '../../components/CrownIcon'
import BottomSheet from '../../components/BottomSheet'
import { useTranslation } from '../../hooks/useTranslation'
import type { RootState } from '../../state/store'
import { openModal } from '../../state/slices/ui'
import type { ApiEpisode } from '@/types/api'

export default function WatchPage() {
  const params = useParams()
  const dispatch = useDispatch()
  const seriesId = params?.seriesId as string
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const { data: episodesData, loading, error } = useSeriesEpisodes(seriesId)
  const show = episodesData?.series
  const episodes = episodesData?.episodes || []
  const isPurchased = episodesData?.isPurchased || false
  const { t } = useTranslation()

  const [selectedEpisode, setSelectedEpisode] = useState<number | 'trailer' | null>(null)
  const [episodesSheetOpen, setEpisodesSheetOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [bookmarksCount, setBookmarksCount] = useState(0)

  useEffect(() => {
    if (!episodes.length) return
    if (selectedEpisode === null) {
      setSelectedEpisode(episodes[0].episodeNumber)
    }
  }, [episodes, selectedEpisode])

  useEffect(() => {
    if (!seriesId || !accessToken) return

    let cancelled = false

    const loadStatus = async () => {
      try {
        const status = await getSeriesStatus(seriesId, accessToken)
        if (cancelled) return
        setIsLiked(status.isLiked)
        setIsBookmarked(status.isBookmarked)
        setLikesCount(status.likesCount)
        setBookmarksCount(status.bookmarksCount)
      } catch (e) {
        console.error('Failed to load series status', e)
      }
    }

    loadStatus()

    return () => {
      cancelled = true
    }
  }, [seriesId, accessToken])

  const ensureAuth = () => {
    if (accessToken) return true
    dispatch(openModal({ name: 'login' }))
    return false
  }

  const handleToggleLike = async () => {
    if (!ensureAuth()) return
    try {
      const res = await likeSeries(seriesId, accessToken as string)
      setIsLiked(res.isLiked)
      setLikesCount(res.likesCount)
    } catch (e) {
      console.error('Failed to toggle like', e)
    }
  }

  const handleToggleBookmark = async () => {
    if (!ensureAuth()) return
    try {
      const res = await bookmarkSeries(seriesId, accessToken as string)
      setIsBookmarked(res.isBookmarked)
      setBookmarksCount(res.bookmarksCount)
    } catch (e) {
      console.error('Failed to toggle bookmark', e)
    }
  }

  const handleOpenEpisodes = () => {
    if (!episodes.length) return
    setEpisodesSheetOpen(true)
  }

  const handleEpisodeClick = (episode: ApiEpisode | 'trailer') => {
    if (episode === 'trailer') {
      setSelectedEpisode('trailer')
      setEpisodesSheetOpen(false)
      return
    }
    const canWatch = isPurchased || episode.isFree
    if (!canWatch) {
      setEpisodesSheetOpen(false)
      return
    }
    setSelectedEpisode(episode.episodeNumber)
    setEpisodesSheetOpen(false)
  }

  const currentEpisodeNumber =
    selectedEpisode && selectedEpisode !== 'trailer'
      ? selectedEpisode
      : episodes[0]?.episodeNumber

  const totalEpisodes = episodes.length
  const heroImage = show?.coverImage ? `${API_BASE_URL}/${show.coverImage}` : null

  return (
    <div className="relative">
      <main className="w-full relative z-10">
        {loading && (
          <section className="px-4">
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden relative bg-white/10 aspect-[3/4] animate-pulse" />
              <div className="h-6 bg-white/10 rounded-xl w-2/3 mx-auto animate-pulse" />
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="px-4">
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
                <div>{t('series.failedToLoadSeries')}</div>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && show && (
          <>
            <section className="relative">
              <div className="relative h-[calc(100vh-140px)] w-full">
                {heroImage && (
                  <>
                    <img
                      src={heroImage}
                      alt={show.title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,9,32,0.3) 0%, rgba(13,9,32,0.9) 85%, rgba(13,9,32,1) 100%)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,9,32,0.9) 0%, rgba(13,9,32,0.6) 25%, transparent 55%)' }} />
                  </>
                )}

                <div className="relative z-10 flex h-full">
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleOpenEpisodes}
                        className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center active:scale-95"
                      >
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 6.5V19.5L19 13L8 6.5Z" fill="#0D0920" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-auto px-4 pb-5 space-y-3">
                      {totalEpisodes > 0 && (
                        <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                          <span>{t('series.episodeProgressLabel')}</span>
                          {currentEpisodeNumber && (
                            <span>
                              Ep {currentEpisodeNumber}/{totalEpisodes}
                            </span>
                          )}
                        </div>
                      )}
                      {totalEpisodes > 0 && (
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#B49AFA] to-[#8F37FF]"
                            style={{
                              width:
                                currentEpisodeNumber && totalEpisodes
                                  ? `${Math.max(4, (currentEpisodeNumber / totalEpisodes) * 100)}%`
                                  : '4%'
                            }}
                          />
                        </div>
                      )}


                    </div>
                  </div>

                  <div className="absolute inset-y-0 right-4 flex flex-col justify-center gap-6">
                    <button
                      type="button"
                      onClick={handleToggleLike}
                      className="flex flex-col items-center gap-1 active:scale-95"
                    >

                      <div>
                        {!isLiked ? (
                          <svg width="25" height="27" viewBox="0 0 25 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 18.1323C0 19.1304 0.144173 20.0711 0.432518 20.9544C0.720863 21.8376 1.12262 22.6179 1.6378 23.2952C2.15298 23.9725 2.74697 24.5032 3.41978 24.8874C4.09258 25.2716 4.8096 25.4637 5.57083 25.4637H9.38852C10.1421 25.8756 10.9764 26.1984 11.8914 26.4321C12.8064 26.6658 13.7791 26.7826 14.8095 26.7826H16.4011C17.1239 26.7826 17.7871 26.7588 18.3907 26.7113C18.9943 26.6638 19.4998 26.5885 19.9074 26.4856C20.707 26.2796 21.3395 25.9093 21.8046 25.3746C22.2698 24.8399 22.5024 24.2081 22.5024 23.4794C22.5024 23.1942 22.4563 22.909 22.364 22.6239C22.7639 22.3229 23.0715 21.9565 23.2868 21.5247C23.502 21.093 23.6097 20.6276 23.6097 20.1286C23.6097 19.6216 23.5212 19.1701 23.3444 18.774C23.6135 18.4967 23.8231 18.1621 23.9731 17.7699C24.123 17.3778 24.1979 16.9639 24.1979 16.5283C24.1979 16.251 24.1653 15.9718 24.0999 15.6905C24.0346 15.4093 23.9404 15.1618 23.8173 14.9479C24.171 14.441 24.3478 13.8191 24.3478 13.0824C24.3478 12.4962 24.2114 11.9615 23.9385 11.4783C23.6655 10.9951 23.2983 10.6128 22.8369 10.3316C22.3756 10.0504 21.8604 9.90981 21.2914 9.90981H16.9201C16.7817 9.90981 16.6702 9.87813 16.5856 9.81476C16.501 9.75138 16.4587 9.66028 16.4587 9.54146C16.4587 9.21668 16.5587 8.79882 16.7587 8.28788C16.9586 7.77694 17.1873 7.21451 17.4449 6.60059C17.7025 5.98668 17.9313 5.35494 18.1312 4.70538C18.3311 4.05582 18.4311 3.43002 18.4311 2.82798C18.4311 2.2814 18.3157 1.79422 18.085 1.36646C17.8543 0.9387 17.541 0.604015 17.145 0.36241C16.749 0.120803 16.2935 0 15.7783 0C15.2092 0 14.721 0.162391 14.3134 0.487173C13.9059 0.811955 13.5176 1.34269 13.1485 2.07939C12.7948 2.76856 12.42 3.44981 12.024 4.12314C11.628 4.79647 11.1993 5.47773 10.738 6.1669C10.2766 6.85607 9.76529 7.57891 9.20398 8.33542C8.64267 9.09191 8.01984 9.90189 7.3355 10.7653H5.13254C4.42514 10.7653 3.76002 10.9555 3.1372 11.3357C2.51437 11.7159 1.96843 12.2447 1.49939 12.9219C1.03035 13.5993 0.663194 14.3835 0.397916 15.2746C0.132639 16.1658 0 17.1183 0 18.1323ZM6.70114 18.0729C6.70114 17.2174 6.77035 16.445 6.90875 15.7559C7.04715 15.0667 7.27206 14.3993 7.58348 13.7537C7.89489 13.1081 8.31203 12.4249 8.8349 11.704C9.41159 10.9119 10.044 10.0603 10.7322 9.14934C11.4204 8.23837 12.1105 7.26402 12.8025 6.22631C13.4946 5.18859 14.129 4.07958 14.7056 2.89927C14.9209 2.44774 15.1131 2.15069 15.2823 2.0081C15.4515 1.86552 15.6399 1.79422 15.8475 1.79422C16.1012 1.79422 16.3049 1.88334 16.4587 2.06158C16.6125 2.23981 16.6895 2.49527 16.6895 2.82798C16.6895 3.31119 16.5895 3.84193 16.3896 4.4202C16.1896 4.99847 15.9608 5.59259 15.7033 6.20255C15.4457 6.8125 15.217 7.40463 15.017 7.97895C14.817 8.55325 14.7171 9.07409 14.7171 9.54146C14.7171 10.2148 14.9555 10.7436 15.4322 11.1277C15.909 11.5119 16.4895 11.704 17.1738 11.704H21.2914C21.6682 11.704 21.9815 11.8367 22.2314 12.1021C22.4813 12.3674 22.6062 12.6942 22.6062 13.0824C22.6062 13.5894 22.3948 14.0528 21.9719 14.4726C21.872 14.5756 21.8162 14.6845 21.8046 14.7994C21.7931 14.9142 21.8297 15.0271 21.9142 15.138C22.1064 15.4232 22.2448 15.6688 22.3294 15.8747C22.414 16.0807 22.4564 16.2985 22.4564 16.5283C22.4564 16.8134 22.391 17.0768 22.2603 17.3184C22.1295 17.56 21.9334 17.7838 21.672 17.9898C21.526 18.1007 21.4299 18.2314 21.3837 18.3818C21.3376 18.5324 21.3568 18.6988 21.4414 18.8809C21.5874 19.1582 21.695 19.382 21.7643 19.5522C21.8335 19.7226 21.8681 19.9147 21.8681 20.1286C21.8681 20.7385 21.4606 21.2613 20.6455 21.697C20.5148 21.7683 20.4322 21.8594 20.3975 21.9703C20.363 22.0812 20.3726 22.204 20.4263 22.3387C20.5725 22.6951 20.6648 22.9367 20.7032 23.0635C20.7416 23.1902 20.7608 23.3288 20.7608 23.4794C20.7608 23.7725 20.6551 24.0279 20.4437 24.2458C20.2322 24.4636 19.915 24.628 19.4921 24.7388C19.1538 24.826 18.7213 24.8914 18.1946 24.935C17.6679 24.9785 17.0739 24.9963 16.4126 24.9884L14.8209 24.9647C13.2062 24.9488 11.7894 24.6477 10.5707 24.0616C9.35199 23.4754 8.40238 22.6674 7.72189 21.6376C7.04139 20.6078 6.70114 19.4196 6.70114 18.0729ZM1.74161 18.1323C1.74161 17.1105 1.90115 16.1777 2.22025 15.334C2.53936 14.4904 2.9565 13.8171 3.47167 13.3141C3.98685 12.8111 4.54047 12.5596 5.13254 12.5596C5.30939 12.5596 5.48624 12.5596 5.6631 12.5596C5.83995 12.5596 6.02065 12.5596 6.20519 12.5596C5.76691 13.3914 5.44973 14.2528 5.25365 15.144C5.05757 16.0351 4.95954 16.9995 4.95954 18.0373C4.95954 19.1542 5.14792 20.188 5.52469 21.1385C5.90146 22.0891 6.43971 22.9327 7.13942 23.6694C6.87799 23.6694 6.61656 23.6694 6.35513 23.6694C6.0937 23.6694 5.83226 23.6694 5.57083 23.6694C4.89418 23.6694 4.26366 23.416 3.67928 22.909C3.09491 22.402 2.62587 21.7307 2.27216 20.895C1.91846 20.0593 1.74161 19.1384 1.74161 18.1323Z" fill="white" fill-opacity="0.8" />
                          </svg>
                        ) : (
                          <svg width="25" height="27" viewBox="0 0 25 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 18.4174C0 19.7125 0.232509 20.8983 0.697526 21.9747C1.16254 23.0512 1.79847 23.9132 2.60529 24.5608C3.41211 25.2083 4.32426 25.5321 5.34174 25.5321H7.52374C6.41883 24.6827 5.60803 23.6315 5.09134 22.3784C4.57466 21.1253 4.32824 19.763 4.35208 18.2913C4.36798 17.198 4.49318 16.2098 4.72768 15.3268C4.96218 14.4437 5.2543 13.6637 5.60405 12.9868C5.95381 12.3098 6.31152 11.7316 6.67717 11.2523H4.88865C3.96656 11.2523 3.13588 11.5719 2.39663 12.211C1.65737 12.8501 1.07312 13.71 0.64387 14.7907C0.214623 15.8714 0 17.0803 0 18.4174ZM6.00946 18.3292C5.99356 19.5233 6.20023 20.6292 6.62948 21.6468C7.05872 22.6644 7.68074 23.5537 8.49551 24.3147C9.31028 25.0758 10.296 25.6708 11.4525 26.0998C12.6091 26.5286 13.9028 26.7515 15.3337 26.7684L17.0268 26.7809C17.8296 26.7894 18.5212 26.7662 19.1014 26.7115C19.6817 26.6569 20.1388 26.5791 20.4727 26.4781C20.9576 26.3521 21.3968 26.1229 21.7903 25.7907C22.1837 25.4585 22.3805 24.9813 22.3805 24.3589C22.3805 24.1067 22.3526 23.888 22.297 23.7029C22.2414 23.518 22.1738 23.354 22.0943 23.2111C21.991 23.0344 22.0148 22.9124 22.1658 22.8451C22.5473 22.6854 22.8772 22.4205 23.1554 22.0504C23.4336 21.6804 23.5728 21.2347 23.5728 20.7133C23.5728 20.1247 23.4297 19.6327 23.1436 19.2374C23.0005 19.0355 23.0323 18.8674 23.2389 18.7328C23.5172 18.5646 23.7437 18.308 23.9185 17.9632C24.0935 17.6185 24.1809 17.2317 24.1809 16.8027C24.1809 16.5084 24.1372 16.214 24.0498 15.9197C23.9623 15.6253 23.8351 15.3983 23.6682 15.2386C23.5093 15.0787 23.5251 14.9105 23.7158 14.7339C23.9146 14.5657 24.0696 14.3365 24.1809 14.0464C24.2922 13.7563 24.3478 13.4262 24.3478 13.0562C24.3478 12.6357 24.2544 12.253 24.0676 11.9082C23.8808 11.5634 23.6244 11.288 23.2985 11.082C22.9726 10.8759 22.607 10.7729 22.2016 10.7729H17.8495C17.293 10.7729 16.8479 10.6321 16.5141 10.3503C16.1802 10.0686 16.0132 9.68807 16.0132 9.20871C16.0132 8.76299 16.1166 8.24579 16.3233 7.6571C16.5299 7.06842 16.7704 6.44189 17.0447 5.77752C17.319 5.11315 17.5594 4.45087 17.7661 3.79071C17.9727 3.13054 18.0761 2.51032 18.0761 1.93004C18.0761 1.32454 17.9131 0.851491 17.5872 0.510894C17.2613 0.170298 16.8559 0 16.371 0C15.9258 0 15.5741 0.149274 15.3157 0.447821C15.0574 0.746368 14.809 1.13953 14.5706 1.6273C13.6564 3.51949 12.6369 5.2435 11.5122 6.7993C10.3874 8.35511 9.35599 9.78898 8.418 11.1009C7.88542 11.841 7.44425 12.5684 7.0945 13.2832C6.74474 13.9981 6.48043 14.7592 6.30158 15.5665C6.12273 16.3739 6.02536 17.2947 6.00946 18.3292Z" fill="white" fill-opacity="0.8" />
                          </svg>
                        )}
                      </div>

                      <div className="text-[11px] text-white/80">
                        {likesCount}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      className="flex flex-col items-center gap-1 active:scale-95"
                    >
                      <div>
                        {!isBookmarked ? (
                          <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.34022 21.913C1.64366 21.913 1.93024 21.8296 2.19997 21.6627C2.4697 21.4959 2.89115 21.1877 3.46432 20.7382L8.40792 16.8051C8.48378 16.737 8.55964 16.737 8.6355 16.8051L13.5791 20.7382C14.1523 21.1809 14.5716 21.4873 14.8372 21.6576C15.1027 21.8279 15.3914 21.913 15.7032 21.913C16.1247 21.913 16.4534 21.8041 16.6894 21.5861C16.9254 21.3682 17.0435 21.0617 17.0435 20.6667V2.93195C17.0435 1.95804 16.7442 1.2259 16.1457 0.735541C15.5472 0.24518 14.6538 0 13.4653 0H3.57811C2.38962 0 1.49615 0.24518 0.897688 0.735541C0.299229 1.2259 0 1.95804 0 2.93195V20.6667C0 21.0617 0.118006 21.3682 0.354019 21.5861C0.59003 21.8041 0.918762 21.913 1.34022 21.913ZM2.37698 19.1547C2.28426 19.2228 2.19786 19.2484 2.11778 19.2314C2.03771 19.2143 1.99767 19.1547 1.99767 19.0526V2.95239C1.99767 2.5097 2.13886 2.17598 2.42123 1.95122C2.70361 1.72648 3.12295 1.61411 3.67926 1.61411H13.3768C13.9247 1.61411 14.3398 1.72648 14.6221 1.95122C14.9046 2.17598 15.0458 2.5097 15.0458 2.95239V19.0526C15.0458 19.1547 15.0057 19.2143 14.9256 19.2314C14.8455 19.2484 14.7591 19.2228 14.6664 19.1547L9.19182 14.8641C8.98952 14.7074 8.76615 14.6291 8.52171 14.6291C8.27728 14.6291 8.05391 14.7074 7.85161 14.8641L2.37698 19.1547Z" fill="white" fillOpacity="0.8" />
                          </svg>
                        ) : (
                          <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.34022 21.913C1.64366 21.913 1.93024 21.8296 2.19997 21.6627C2.4697 21.4959 2.89115 21.1877 3.46432 20.7382L8.40792 16.8051C8.48378 16.737 8.55964 16.737 8.6355 16.8051L13.5791 20.7382C14.1523 21.1809 14.5716 21.4873 14.8372 21.6576C15.1027 21.8279 15.3914 21.913 15.7032 21.913C16.1247 21.913 16.4534 21.8041 16.6894 21.5861C16.9254 21.3682 17.0435 21.0617 17.0435 20.6667V2.93195C17.0435 1.95804 16.7442 1.2259 16.1457 0.735541C15.5472 0.245181 14.6538 0 13.4653 0H3.57811C2.38962 0 1.49615 0.245181 0.897688 0.735541C0.299229 1.2259 0 1.95804 0 2.93195В20.6667C0 21.0617 0.118006 21.3682 0.354018 21.5861C0.59003 21.8041 0.918762 21.913 1.34022 21.913ZM2.37698 19.1547C2.28426 19.2228 2.19786 19.2484 2.11778 19.2314C2.03771 19.2143 1.99767 19.1547 1.99767 19.0526V2.95239C1.99767 2.5097 2.13886 2.17598 2.42123 1.95122C2.70361 1.72648 3.12295 1.61411 3.67926 1.61411H13.3768C13.9247 1.61411 14.3398 1.72648 14.6221 1.95122C14.9046 2.17598 15.0458 2.5097 15.0458 2.95239В19.0526C15.0458 19.1547 15.0057 19.2143 14.9256 19.2314C14.8455 19.2484 14.7591 19.2228 14.6664 19.1547L9.19182 14.8641C8.98952 14.7074 8.76615 14.6291 8.52171 14.6291C8.27728 14.6291 8.05391 14.7074 7.85161 14.8641L2.37698 19.1547Z" fill="white" fillOpacity="0.8" />
                            <path d="M2.37698 19.1547C2.28426 19.2228 2.19786 19.2484 2.11778 19.2314C2.03771 19.2143 1.99767 19.1547 1.99767 19.0526V2.95239C1.99767 2.5097 2.13886 2.17598 2.42123 1.95122C2.70361 1.72648 3.12295 1.61411 3.67926 1.61411H13.3768C13.9247 1.61411 14.3398 1.72648 14.6221 1.95122C14.9046 2.17598 15.0458 2.5097 15.0458 2.95239В19.0526C15.0458 19.1547 15.0057 19.2143 14.9256 19.2314C14.8455 19.2484 14.7591 19.2228 14.6664 19.1547L9.19182 14.8641C8.98952 14.7074 8.76615 14.6291 8.52171 14.6291C8.27728 14.6291 8.05391 14.7074 7.85161 14.8641L2.37698 19.1547Z" fill="white" fillOpacity="0.8" />
                          </svg>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-white/70">
                        {t('series.save')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {totalEpisodes > 0 && (
              <section className="px-4 pt-2 pb-4">
                <button
                  type="button"
                  onClick={handleOpenEpisodes}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 flex items-center justify-between active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/60">
                      {t('series.episodesShort')}
                    </div>
                    {currentEpisodeNumber && (
                      <div className="text-sm font-semibold text-white">
                        Ep {currentEpisodeNumber}/{totalEpisodes}
                      </div>
                    )}
                  </div>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 6L7 1L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </section>
            )}
          </>
        )}

        {!loading && !error && !show && (
          <section className="px-4">
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
                {t('series.seriesNotFound')}
              </div>
            </div>
          </section>
        )}
      </main>

      {
        totalEpisodes > 0 && (
          <BottomSheet
            open={episodesSheetOpen}
            onClose={() => setEpisodesSheetOpen(false)}
            title={t('series.episodesTitle')}
            height={440}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleEpisodeClick('trailer')}
                  className={`h-12 rounded-xl text-xs font-semibold flex items-center justify-center ${selectedEpisode === 'trailer'
                    ? 'bg-[#8F37FF] text-white'
                    : 'bg-[#2A2148] text-white/80'
                    }`}
                >
                  {t('series.trailer')}
                </button>
                {episodes.map(ep => {
                  const isSelected = selectedEpisode !== 'trailer' && selectedEpisode === ep.episodeNumber
                  const unlocked = isPurchased || ep.isFree
                  return (
                    <button
                      key={ep.episodeNumber}
                      type="button"
                      onClick={() => handleEpisodeClick(ep)}
                      className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center ${unlocked
                        ? isSelected
                          ? 'bg-[#8F37FF] text-white'
                          : 'bg-[#2A2148] text-white'
                        : 'bg-white/5 text-white/40'
                        }`}
                    >
                      {ep.episodeNumber}
                    </button>
                  )
                })}
              </div>

              {!isPurchased && show && (
                <div className="text-xs text-white/70 mt-2">
                  {t('series.freeEpisodesInfo')
                    .replace('{count}', String(show.freeEpisodesCount || 0))}
                </div>
              )}
            </div>
          </BottomSheet>
        )
      }
    </div >
  )
}


