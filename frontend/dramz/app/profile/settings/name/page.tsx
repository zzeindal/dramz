'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../state/store'
import { openModal } from '../../../state/slices/ui'
import { useTranslation } from '../../../hooks/useTranslation'

export default function ChangeNamePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const displayName = useSelector((s: RootState) => s.auth.displayName)
  const user = useSelector((s: RootState) => s.auth.user)
  const { t } = useTranslation()
  
  const currentName = displayName || user?.first_name || user?.username || ''
  const [newName, setNewName] = useState('')

  const handleChange = () => {
    if (newName.trim() && newName.trim() !== currentName) {
      dispatch(openModal({ 
        name: 'changeName', 
        data: { from: currentName, to: newName.trim() } 
      }))
    }
  }

  return (
    <main className="w-full relative min-h-screen app-frame">
      <section className="px-8 mt-20 relative z-10">
        <div className="text-white text-lg font-medium mb-4">
          {t('profile.displayName')}
        </div>
        
        <div
          style={{
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
            borderRadius: '9px',
            pointerEvents: 'none',
            padding: '1px',
            marginBottom: '24px'
          }}
        >
          <div
            className="rounded-[8px] p-4 h-full w-full relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(20, 16, 38, 0.9)'
            }}
          >
            <div className="text-white/70 text-sm mb-1">{currentName}</div>
          </div>
        </div>

        <div className="text-white text-lg font-medium mb-4">
          {t('settings.enterNewName')}
        </div>
        
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('settings.enterNewName')}
          className="w-full rounded-lg p-4 bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-[#8F37FF] mb-6"
        />

        <button
          onClick={handleChange}
          disabled={!newName.trim() || newName.trim() === currentName}
          className="w-full h-12 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: newName.trim() && newName.trim() !== currentName
              ? 'linear-gradient(135deg, #8F37FF 0%, #AC6BFF 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            boxShadow: newName.trim() && newName.trim() !== currentName
              ? '0 4px 20px rgba(143, 55, 255, 0.4)'
              : 'none'
          }}
        >
          {t('settings.changeNameButton')}
        </button>
      </section>
    </main>
  )
}

