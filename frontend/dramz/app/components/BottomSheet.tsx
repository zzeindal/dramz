'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export default function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentY, setCurrentY] = useState(0)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragThreshold = 50

  useEffect(() => {
    currentYRef.current = currentY
  }, [currentY])

  useEffect(() => {
    if (!open) {
      setCurrentY(0)
      setIsDragging(false)
      currentYRef.current = 0
    }
  }, [open])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - startYRef.current
    if (deltaY > 0) {
      setCurrentY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (currentYRef.current > dragThreshold) {
      onClose()
    } else {
      setCurrentY(0)
    }
    setIsDragging(false)
  }

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startYRef.current = e.clientY
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startYRef.current
        if (deltaY > 0) {
          setCurrentY(deltaY)
        }
      }

      const handleGlobalMouseUp = () => {
        if (currentYRef.current > dragThreshold) {
          onClose()
        } else {
          setCurrentY(0)
        }
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, onClose])

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end bg-black/60 app-frame"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={sheetRef}
        className="w-full bg-[#0f0b1d] border-t border-[#261f3f] rounded-t-3xl text-white flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          transform: `translateY(${currentY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <div 
          className="flex-shrink-0 pt-3 pb-2 px-4 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleDragHandleMouseDown}
        >
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-3" />
          {title && (
            <div className="text-xl font-semibold mb-2 text-center">{title}</div>
          )}
        </div>
        <div className="h-px bg-[#261f3f] flex-shrink-0" />
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

