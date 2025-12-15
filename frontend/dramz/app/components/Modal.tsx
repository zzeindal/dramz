'use client'

import { ReactNode } from 'react'

export default function Modal({ open, onClose, children, title, closable = true }: { open: boolean, onClose: () => void, children: ReactNode, title?: string, closable?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closable ? (e) => { if (e.target === e.currentTarget) onClose() } : undefined}>
      <div className="w-full  max-w-[440px] max-h-[90vh] flex flex-col">
        <div className=" border bg-[#0D0920] rounded-[8px] border-[#261f3f] text-white flex flex-col overflow-hidden">
          {closable && (
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
              <div className="text-xl font-semibold">{title}</div>
              <button onClick={onClose} className="text-2xl leading-none px-2 text-white/80 hover:text-white transition-colors">×</button>
            </div>
          )}

          <div className="h-px bg-[#261f3f] flex-shrink-0" />
          <div className="p-4 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}


