'use client'

import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { useFaq } from '@/hooks/useFaq'

export default function FaqModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'faq')
  const dispatch = useDispatch()
  const { data, loading, error } = useFaq()
  const items = data || []
  return (
    <Modal open={open} onClose={() => dispatch(closeModal())} title="FAQ">
      <div className="flex flex-col">
        <div className="flex-1 space-y-0">
          {loading && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b border-white/10 pb-4 pt-4 first:pt-0">
                  <div className="h-4 bg-white/10 rounded mb-2 animate-pulse" />
                  <div className="h-3 bg-white/10 rounded w-5/6 animate-pulse" />
                </div>
              ))}
            </>
          )}
          {!loading && error && (
            <div className="text-xs text-red-300 text-center py-4">
              Не удалось загрузить FAQ
            </div>
          )}
          {!loading && !error && items.map((it, index) => (
            <div key={it._id} className="border-b border-white/10 pb-4 pt-4 first:pt-0 last:border-b-0">
              <div className="text-sm font-semibold text-white mb-1">{it.question}</div>
              <div className="text-xs text-white/70 leading-relaxed whitespace-pre-line">{it.answer}</div>
            </div>
          ))}
          {!loading && !error && items.length === 0 && (
            <div className="text-xs text-white/70 text-center py-4">
              FAQ пока пуст
            </div>
          )}
        </div>
        <button className="w-full h-12 rounded-xl primary mt-6 flex items-center justify-center gap-2 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2C5.58 2 2 5.13 2 9C2 11.38 3.19 13.47 5 14.74V18L8.5 16.5C9.17 16.58 9.83 16.58 10.5 16.5L14 18V14.74C15.81 13.47 17 11.38 17 9C17 5.13 13.42 2 10 2Z" fill="white" fillOpacity="0.95"/>
            <circle cx="7" cy="9" r="1" fill="#9b5cff"/>
            <circle cx="13" cy="9" r="1" fill="#9b5cff"/>
            <path d="M7 11.5C7.5 12 8.5 12.5 10 12.5C11.5 12.5 12.5 12 13 11.5" stroke="#9b5cff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold">Связаться с поддержкой</span>
        </button>
      </div>
    </Modal>
  )
}


