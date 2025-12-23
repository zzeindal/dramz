'use client'

import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState } from '../../../state/store'
import { openModal } from '../../../state/slices/ui'
import Header from '../../../components/Header'
import { getUserReferrals } from '@/lib/api/user'
import type { ReferralLink } from '@/types/api'
import { useTranslation } from '../../../hooks/useTranslation'

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://dramz.tv'

const getPlatformInfo = (platform: string) => {
  const platforms: Record<string, { name: string; icon: React.ReactElement; bgImage: string }> = {
    telegram: {
      name: 'Telegram',
      icon: (
        <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.422898 10.2334C3.28738 8.73652 6.48492 7.48716 9.47253 6.23144C14.6124 4.17468 19.7727 2.15357 24.985 0.271939C25.9991 -0.0486539 27.8213 -0.362136 28 1.06361C27.9021 3.08182 27.4997 5.08821 27.2236 7.0946C26.523 11.5068 25.7131 15.904 24.9233 20.3017C24.6512 21.7666 22.717 22.5248 21.4793 21.5874C18.505 19.6814 15.5078 17.7939 12.5714 15.8437C11.6095 14.9165 12.5015 13.5849 13.3605 12.9227C15.8103 10.6323 18.4083 8.6864 20.73 6.27765C21.3563 4.84291 19.5058 6.05206 18.8955 6.42258C15.5417 8.61514 12.2701 10.9416 8.73419 12.8685C6.92807 13.8117 4.82299 13.0057 3.01768 12.4794C1.39902 11.8436 -0.972957 11.203 0.422734 10.2336L0.422898 10.2334Z" fill="white" />
        </svg>
      ),
      bgImage: 'url(/tg-bg.png)'
    },
    instagram: {
      name: 'Instagram',
      icon: (
        <svg width="27" height="28" viewBox="0 0 27 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M7.20146 0.0414755C4.42713 0.262324 1.96237 2.02262 0.767819 4.63622C0.366947 5.51335 0.137488 6.39085 0.0471779 7.39232C-0.0135403 8.0653 -0.0166524 19.8123 0.0436713 20.566C0.271332 23.4108 1.92173 25.9117 4.39531 27.1603C5.31025 27.6221 6.21624 27.8711 7.29115 27.956C8.03222 28.0145 18.9744 28.0147 19.7469 27.9562C20.437 27.904 21.0892 27.7724 21.6957 27.5631C24.5337 26.5835 26.6094 23.9467 26.9609 20.8748C26.996 20.5681 27.0063 18.5021 26.9964 13.725L26.9826 7.00645L26.8818 6.5298C26.4128 4.31287 25.2369 2.52247 23.4541 1.31091C22.3692 0.573646 21.1052 0.140709 19.7399 0.0387505C19.026 -0.0145438 7.87479 -0.0121366 7.20146 0.0414755ZM6.75894 2.7396C4.60456 3.14375 2.88857 4.96706 2.56394 7.19698C2.46504 7.87655 2.46718 20.3312 2.56635 20.9643C2.87248 22.919 4.18838 24.5371 6.00581 25.1939C6.13838 25.2418 6.43741 25.3212 6.67029 25.3704C7.08002 25.4568 7.30084 25.4597 13.4927 25.4597C18.9895 25.4597 19.9449 25.4501 20.2695 25.3915C21.3609 25.1944 22.3505 24.6289 23.1473 23.7471C23.95 22.8585 24.3939 21.827 24.5087 20.5827C24.5397 20.2469 24.5497 17.9658 24.5388 13.7023C24.5244 8.03285 24.5148 7.2889 24.4518 7.00645C24.2045 5.89585 23.7973 5.08672 23.1076 4.33566C22.3462 3.50642 21.4155 2.97806 20.329 2.75803C19.9178 2.67482 19.6335 2.67137 13.49 2.67527C8.36909 2.67854 7.0154 2.69148 6.75894 2.7396ZM20.2803 4.92476C20.0081 5.01128 19.8889 5.088 19.6255 5.34616C18.8112 6.14426 19.0382 7.53536 20.068 8.05886C20.293 8.17316 20.366 8.18674 20.758 8.18674C21.1536 8.18674 21.2218 8.1738 21.457 8.05423C22.2872 7.63214 22.6203 6.6087 22.2041 5.75808C21.8602 5.05499 21.018 4.6902 20.2803 4.92476ZM12.7572 6.84866C11.1354 7.05226 9.71686 7.76583 8.56821 8.95583C7.59088 9.96833 7.00198 11.0676 6.67375 12.4922C6.56521 12.9635 6.55705 13.0711 6.55622 14.0428C6.55543 14.9566 6.56735 15.1421 6.65183 15.5299C6.86472 16.5067 7.18953 17.3034 7.69592 18.0908C8.74291 19.7187 10.3385 20.8093 12.2463 21.2011C12.9415 21.3438 14.1054 21.3442 14.7983 21.2019C17.337 20.6805 19.3593 18.8539 20.1611 16.3579C20.4276 15.5285 20.4904 15.0911 20.4904 14.0654C20.4904 13.0648 20.437 12.6748 20.1838 11.8287C20.0249 11.2974 19.5601 10.3481 19.2131 9.84617C18.8288 9.29025 18.1037 8.53937 17.5788 8.15369C16.7721 7.561 15.6329 7.0735 14.6862 6.91589C14.1617 6.82859 13.1877 6.79464 12.7572 6.84866ZM12.9789 9.39258C12.001 9.51791 11.0502 9.99438 10.3365 10.7166C8.67781 12.3953 8.52266 15.1251 9.97893 17.0097C11.279 18.6924 13.541 19.2439 15.4147 18.3351C16.5121 17.8029 17.373 16.833 17.7942 15.6543C18.205 14.5047 18.127 13.1062 17.5905 12C17.3442 11.4923 17.1643 11.2283 16.7878 10.8223C15.9512 9.91998 14.9353 9.43992 13.7217 9.37351C13.4926 9.36098 13.1584 9.36956 12.9789 9.39258Z" fill="white" />
        </svg>
      ),
      bgImage: 'url(/insta-bg.png)'
    },
    youtube: {
      name: 'YouTube',
      icon: (
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M27.4961 3.125C27.3008 2.42578 26.7305 1.85547 26.0312 1.66016C23.9062 1.09375 14 1.09375 14 1.09375C14 1.09375 4.09375 1.09375 1.96875 1.66016C1.26953 1.85547 0.699219 2.42578 0.503906 3.125C-0.0625 5.25 -0.0625 10 -0.0625 10C-0.0625 10 -0.0625 14.75 0.503906 16.875C0.699219 17.5742 1.26953 18.1445 1.96875 18.3398C4.09375 18.9062 14 18.9062 14 18.9062C14 18.9062 23.9062 18.9062 26.0312 18.3398C26.7305 18.1445 27.3008 17.5742 27.4961 16.875C28.0625 14.75 28.0625 10 28.0625 10C28.0625 10 28.0625 5.25 27.4961 3.125ZM11.1875 13.4375V6.5625L18.5 10L11.1875 13.4375Z" fill="white"/>
        </svg>
      ),
      bgImage: 'url(/yt-bg.png)'
    },
    x: {
      name: 'X',
      icon: (
        <img src="/X-icon.png" alt="X" className="w-6 h-6" />
      ),
      bgImage: 'url(/x-bg.png)'
    }
  }
  return platforms[platform.toLowerCase()] || { name: platform, icon: <></>, bgImage: 'url(/tg-bg.png)' }
}

const CopyIcon = () => (
  <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.52648 20H10.1874C11.0296 20 11.6612 19.7907 12.0823 19.372C12.5034 18.9533 12.714 18.3307 12.714 17.504V11.2242H7.02527C6.49823 11.2242 6.10975 11.101 5.85982 10.8546C5.60989 10.6081 5.48493 10.2306 5.48493 9.72182V3.96662H2.52648C1.68432 3.96662 1.0527 4.17594 0.631622 4.5946C0.210541 5.01325 0 5.63593 0 6.46264V17.504C0 18.336 0.210541 18.96 0.631622 19.376C1.0527 19.792 1.68432 20 2.52648 20ZM7.01711 10.1352H12.5672C12.5238 9.98148 12.4532 9.8278 12.3554 9.67412C12.2575 9.52044 12.1163 9.35349 11.9316 9.17327L7.57946 4.84897C7.40017 4.66879 7.23038 4.52041 7.07009 4.40382C6.90981 4.28723 6.75088 4.20774 6.59332 4.16535V9.72971C6.59332 10 6.73458 10.1352 7.01711 10.1352ZM13.8223 16.0334H14.1402C14.5586 16.0334 14.9253 15.9804 15.2404 15.8745C15.5555 15.7684 15.8191 15.6121 16.031 15.4054C16.2429 15.1987 16.4018 14.9391 16.5078 14.6264C16.6137 14.3138 16.6667 13.9507 16.6667 13.5374V5.99364H12.1597C11.7305 5.99364 11.4004 5.88103 11.1695 5.6558C10.9386 5.43058 10.8232 5.11129 10.8232 4.69793V0H6.47922C5.65336 0 5.02581 0.206677 4.59658 0.620032C4.16735 1.03339 3.95273 1.63752 3.95273 2.43243V2.88553H5.13447C5.70497 2.88553 6.22928 2.96502 6.70742 3.12401C7.18555 3.28299 7.65281 3.58506 8.10921 4.03021L12.7384 8.53738C13.1948 8.98253 13.4895 9.44224 13.6226 9.91653C13.7558 10.3908 13.8223 10.8982 13.8223 11.4388V16.0334ZM12.3146 5H16.5689C16.5472 4.87282 16.4942 4.75093 16.41 4.63434C16.3257 4.51776 16.2102 4.38792 16.0635 4.24483L12.6161 0.818761C12.4749 0.675676 12.3431 0.561739 12.2209 0.476948C12.0986 0.392157 11.975 0.341813 11.85 0.325915L11.8582 4.53895C11.8582 4.84632 12.0103 5 12.3146 5Z" fill="white" fillOpacity="0.8" />
  </svg>
)

export default function ReferralLinksPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const authInitialized = useSelector((s: RootState) => s.auth.initialized)
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!authInitialized) {
      return
    }
    if (!accessToken) {
      setLoading(false)
      dispatch(openModal({ name: 'login' }))
      return
    }

    const fetchReferrals = async () => {
      try {
        const data = await getUserReferrals(accessToken)
        setReferralLinks(data.referralLinks || [])
      } catch (error) {
        console.error('Failed to fetch referrals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [accessToken, dispatch])

  const handleCopy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setShowCopyNotification(true)
      setTimeout(() => {
        setShowCopyNotification(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (loading) {
    return (
      <main className="w-full relative min-h-screen app-frame">
        <section className="px-4 pt-4 relative z-10">
          <div className="text-white text-center py-8">
            {t('referrals.loading')}
          </div>
        </section>
      </main>
    )
  }

  if (!accessToken) {
    return (
      <main className="w-full relative min-h-screen app-frame">
        <section className="px-4 pt-4 relative z-10">
        </section>
      </main>
    )
  }

  if (referralLinks.length === 0) {
    return (
      <main className="w-full relative min-h-screen app-frame">
        <section className="px-4 pt-4 relative z-10">
          <div className="text-white text-center py-8">
            {t('referrals.noReferralLinks')}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="w-full relative min-h-screen app-frame">
      {showCopyNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {t('referrals.linkCopied')}
        </div>
      )}
      <section className="px-4 pt-4 relative z-10">
        <div className="space-y-4">
          {referralLinks.map((link) => {
            const platformInfo = getPlatformInfo(link.type)
            const referralLink = `${WEB_APP_URL}?ref=${link.code}`
            return (
              <div key={link.type} className="rounded-[12px] overflow-hidden">
                <div
                  className="p-4"
                  style={{
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: platformInfo.bgImage
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {platformInfo.icon}
                    <span className="text-white font-medium text-base">{platformInfo.name}</span>
                    {link.activatedCount > 0 && (
                      <span className="text-white/70 text-xs ml-auto">
                        {link.activatedCount} {t('referrals.activations')}
                      </span>
                    )}
                  </div>
                  <div
                    className="p-3 rounded-[8px] flex items-center justify-between"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <span className="text-white/80 text-sm flex-1 truncate mr-2">
                      {referralLink}
                    </span>
                    <button
                      onClick={() => handleCopy(referralLink)}
                      className="flex-shrink-0"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

