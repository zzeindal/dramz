'use client'

import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { useRouter } from 'next/navigation'
import { useSeriesList } from '@/hooks/useSeriesList'
import { API_BASE_URL } from '@/lib/api/client'

export default function AllSeriesModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'allSeries')
  const dispatch = useDispatch()
  const router = useRouter()
  const { data, loading, error } = useSeriesList()
  const series = data || []

  const handleSeriesClick = (series: any) => {
    dispatch(closeModal())
    router.push(`/series/${series._id}`)
  }

  return (
    <Modal open={open} onClose={() => dispatch(closeModal())} title="Все новинки">
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        {loading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 animate-pulse">
                <div className="w-24 h-32 bg-white/10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
              </div>
            ))}
          </>
        )}
        {!loading && error && (
          <div className="text-xs text-red-300 text-center py-4">
            Не удалось загрузить сериалы
          </div>
        )}
        {!loading && !error && series.map((item) => (
          <div
            key={item._id}
            onClick={() => handleSeriesClick(item)}
            className="flex gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm cursor-pointer active:bg-white/15 transition-colors"
          >
            <img
              src={`${API_BASE_URL}/${item.coverImage}`}
              alt={item.title}
              className="w-[109px] h-[166px] object-cover rounded-xl flex-shrink-0"
            />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-white/70 line-clamp-3">{item.description}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeriesClick(item)
                }}
                className="mt-2 w-full h-10 rounded-xl primary text-sm"
              >
                Смотреть
              </button>
            </div>
          </div>
        ))}
        {!loading && !error && series.length === 0 && (
          <div className="text-xs text-white/70 text-center py-4">
            Сериалы пока недоступны
          </div>
        )}
      </div>
    </Modal>
  )
}

