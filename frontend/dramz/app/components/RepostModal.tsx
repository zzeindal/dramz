'use client'

import BottomSheet from './BottomSheet'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../state/store'
import { closeModal } from '../state/slices/ui'
import { useState, useMemo } from 'react'
import { completeTask, fetchActiveTasks } from '../state/slices/tasks'
import { useTranslation } from '../hooks/useTranslation'
import { showToast } from '../utils/toast'
import Image from 'next/image'

function getSocialMediaIcons() {
  const instagramIcon = (
    <div className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'rgba(20, 16, 38, 0.9)' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.20146 0.0414755C4.42713 0.262324 1.96237 2.02262 0.767819 4.63622C0.366947 5.51335 0.137488 6.39085 0.0471779 7.39232C-0.0135403 8.0653 -0.0166524 19.8123 0.0436713 20.566C0.271332 23.4108 1.92173 25.9117 4.39531 27.1603C5.31025 27.6221 6.21624 27.8711 7.29115 27.956C8.03222 28.0145 18.9744 28.0147 19.7469 27.9562C20.437 27.904 21.0892 27.7724 21.6957 27.5631C24.5337 26.5835 26.6094 23.9467 26.9609 20.8748C26.996 20.5681 27.0063 18.5021 26.9964 13.725L26.9826 7.00645L26.8818 6.5298C26.4128 4.31287 25.2369 2.52247 23.4541 1.31091C22.3692 0.573646 21.1052 0.140709 19.7399 0.0387505C19.026 -0.0145438 7.87479 -0.0121366 7.20146 0.0414755ZM6.75894 2.7396C4.60456 3.14375 2.88857 4.96706 2.56394 7.19698C2.46504 7.87655 2.46718 20.3312 2.56635 20.9643C2.87248 22.919 4.18838 24.5371 6.00581 25.1939C6.13838 25.2418 6.43741 25.3212 6.67029 25.3704C7.08002 25.4568 7.30084 25.4597 13.4927 25.4597C18.9895 25.4597 19.9449 25.4501 20.2695 25.3915C21.3609 25.1944 22.3505 24.6289 23.1473 23.7471C23.95 22.8585 24.3939 21.827 24.5087 20.5827C24.5397 20.2469 24.5497 17.9658 24.5388 13.7023C24.5244 8.03285 24.5148 7.2889 24.4518 7.00645C24.2045 5.89585 23.7973 5.08672 23.1076 4.33566C22.3462 3.50642 21.4155 2.97806 20.329 2.75803C19.9178 2.67482 19.6335 2.67137 13.49 2.67527C8.36909 2.67854 7.0154 2.69148 6.75894 2.7396ZM20.2803 4.92476C20.0081 5.01128 19.8889 5.088 19.6255 5.34616C18.8112 6.14426 19.0382 7.53536 20.068 8.05886C20.293 8.17316 20.366 8.18674 20.758 8.18674C21.1536 8.18674 21.2218 8.1738 21.457 8.05423C22.2872 7.63214 22.6203 6.6087 22.2041 5.75808C21.8602 5.05499 21.018 4.6902 20.2803 4.92476ZM12.7572 6.84866C11.1354 7.05226 9.71686 7.76583 8.56821 8.95583C7.59088 9.96833 7.00198 11.0676 6.67375 12.4922C6.56521 12.9635 6.55705 13.0711 6.55622 14.0428C6.55543 14.9566 6.56735 15.1421 6.65183 15.5299C6.86472 16.5067 7.18953 17.3034 7.69592 18.0908C8.74291 19.7187 10.3385 20.8093 12.2463 21.2011C12.9415 21.3438 14.1054 21.3442 14.7983 21.2019C17.337 20.6805 19.3593 18.8539 20.1611 16.3579C20.4276 15.5285 20.4904 15.0911 20.4904 14.0654C20.4904 13.0648 20.437 12.6748 20.1838 11.8287C20.0249 11.2974 19.5601 10.3481 19.2131 9.84617C18.8288 9.29025 18.1037 8.53937 17.5788 8.15369C16.7721 7.561 15.6329 7.0735 14.6862 6.91589C14.1617 6.82859 13.1877 6.79464 12.7572 6.84866ZM12.9789 9.39258C12.001 9.51791 11.0502 9.99438 10.3365 10.7166C8.67781 12.3953 8.52266 15.1251 9.97893 17.0097C11.279 18.6924 13.541 19.2439 15.4147 18.3351C16.5121 17.8029 17.373 16.833 17.7942 15.6543C18.205 14.5047 18.127 13.1062 17.5905 12C17.3442 11.4923 17.1643 11.2283 16.7878 10.8223C15.9512 9.91998 14.9353 9.43992 13.7217 9.37351C13.4926 9.36098 13.1584 9.36956 12.9789 9.39258Z" fill="white" />
      </svg>
    </div>
  )
  
  const tiktokIcon = (
    <div className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'rgba(20, 16, 38, 0.9)' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.59 6.69C19.19 5.29 18.3 4.1 17.07 3.4C16.26 2.92 15.31 2.64 14.29 2.64V7.64C14.88 7.64 15.44 7.75 15.96 7.96V5.96C16.5 5.96 17.03 6.06 17.52 6.25V9.25C17.03 9.06 16.5 8.96 15.96 8.96V12.96C15.96 16.26 13.22 18.96 9.96 18.96C8.89 18.96 7.88 18.68 7 18.18C5.77 17.48 4.88 16.29 4.48 14.89C4.3 14.29 4.2 13.66 4.2 13C4.2 9.7 6.94 7 10.2 7C10.79 7 11.35 7.11 11.87 7.32V10.32C11.35 10.11 10.79 10 10.2 10C8.42 10 7 11.42 7 13.2C7 14.98 8.42 16.4 10.2 16.4C11.98 16.4 13.4 14.98 13.4 13.2V2H16.4C16.4 3.85 17.55 5.4 19.2 5.85V8.85C18.69 8.95 18.15 9 17.59 9V6.69H19.59Z" fill="white"/>
      </svg>
    </div>
  )
  
  return { instagramIcon, tiktokIcon }
}

export default function RepostModal() {
  const open = useSelector((s: RootState) => s.ui.modal === 'repost')
  const modalData = useSelector((s: RootState) => s.ui.modalData) as { taskId?: string } | null
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const tasks = useSelector((s: RootState) => s.tasks.active)
  const completing = useSelector((s: RootState) => modalData?.taskId ? !!s.tasks.completing[modalData.taskId] : false)
  const dispatch = useDispatch()
  const [link, setLink] = useState('')
  const taskId = modalData?.taskId || ''
  const { t } = useTranslation()

  const task = useMemo(() => {
    return tasks.find(t => t.id === taskId)
  }, [tasks, taskId])

  const socialIcons = useMemo(() => {
    return getSocialMediaIcons()
  }, [])

  const handleSubmit = async () => {
    if (!accessToken || !taskId || !link) return
    try {
      const result = await dispatch(completeTask({ token: accessToken, taskId, link }) as any)
      if (completeTask.rejected.match(result)) {
        showToast(t('rewards.cannotCompleteTask'))
      } else {
        await dispatch(fetchActiveTasks({ token: accessToken }) as any)
        setLink('')
        dispatch(closeModal())
      }
    } catch (error) {
      showToast(t('rewards.cannotCompleteTask'))
    }
  }

  return (
    <BottomSheet open={open} onClose={() => dispatch(closeModal())} title={t('modals.confirmRepost')} height={525} backgroundImage="/reposts-bg.png">
      <div className="space-y-4 relative min-h-full mt-50">
        <div className="text-sm text-white/80 text-center">{t('modals.pasteLink')}</div>
        <div
          style={{
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
            borderRadius: '9px',
            pointerEvents: 'none',
            padding: '1px'
          }}
        >
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder={t('modals.pasteLinkHere')}
            className="w-full h-11 rounded-[8px] px-3 outline-none text-white placeholder:text-white/50 relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(20, 16, 38, 0.9)',
              pointerEvents: 'auto'
            }}
          />
        </div>
        <button
          disabled={!link || completing}
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {completing ? t('rewards.sending') : t('modals.send')}
        </button>
      </div>
    </BottomSheet>
  )
}


