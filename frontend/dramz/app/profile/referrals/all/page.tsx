'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState } from '../../../state/store'
import Header from '../../../components/Header'
import { getUserReferrals } from '@/lib/api/user'
import { useTranslation } from '../../../hooks/useTranslation'

const DefaultAvatarIcon = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.53218 12.187C2.5664 12.187 3.08351 11.6632 3.08351 10.6157V6.0935C3.08351 5.09708 3.33887 4.34657 3.84959 3.84197C4.36032 3.33738 5.09449 3.08508 6.0521 3.08508H10.6869C11.7339 3.08508 12.2574 2.5677 12.2574 1.53296C12.2574 0.510985 11.7339 0 10.6869 0H6.0138C4.00919 0 2.50574 0.495017 1.50345 1.48505C0.501149 2.47508 0 3.95374 0 5.92104V10.6157C0 11.6632 0.510725 12.187 1.53218 12.187ZM35.9487 12.187C36.9829 12.187 37.5 11.6632 37.5 10.6157V5.92104C37.5 3.95374 36.9989 2.47508 35.9966 1.48505C34.9943 0.495017 33.4908 0 31.4862 0H26.7939C25.7597 0 25.2426 0.510985 25.2426 1.53296C25.2426 2.5677 25.7597 3.08508 26.7939 3.08508H31.4288C32.3735 3.08508 33.1077 3.33738 33.6312 3.84197C34.1547 4.34657 34.4164 5.09708 34.4164 6.0935V10.6157C34.4164 11.6632 34.9272 12.187 35.9487 12.187ZM6.0138 37.5H10.6869C11.7339 37.5 12.2574 36.989 12.2574 35.967C12.2574 34.9322 11.7339 34.4149 10.6869 34.4149H6.0521C5.09449 34.4149 4.36032 34.1626 3.84959 33.658C3.33887 33.1534 3.08351 32.4028 3.08351 31.4064V26.8842C3.08351 25.8367 2.5664 25.3129 1.53218 25.3129C0.510725 25.3129 0 25.8367 0 26.8842V31.5597C0 33.5398 0.501149 35.0248 1.50345 36.0148C2.50574 37.0049 4.00919 37.5 6.0138 37.5ZM26.7939 37.5H31.4862C33.4908 37.5 34.9943 37.0049 35.9966 36.0148C36.9989 35.0248 37.5 33.5398 37.5 31.5597V26.8842C37.5 25.8367 36.9829 25.3129 35.9487 25.3129C34.9272 25.3129 34.4164 25.8367 34.4164 26.8842V31.4064C34.4164 32.4028 34.1547 33.1534 33.6312 33.658C33.1077 34.1626 32.3735 34.4149 31.4288 34.4149H26.7939C25.7597 34.4149 25.2426 34.9322 25.2426 35.967C25.2426 36.989 25.7597 37.5 26.7939 37.5ZM10.2081 27.4207H27.3111C28.307 27.4207 29.0634 27.1716 29.5805 26.6735C30.0976 26.1752 30.3562 25.4279 30.3562 24.4315V14.2948C30.3562 13.2856 30.0976 12.5319 29.5805 12.0337C29.0634 11.5355 28.307 11.2864 27.3111 11.2864H24.8211C24.4509 11.2864 24.1764 11.2417 23.9976 11.1522C23.8189 11.0628 23.621 10.8968 23.404 10.654L22.6187 9.77259C22.3762 9.5171 22.1112 9.3191 21.8239 9.17858C21.5366 9.03805 21.1504 8.96778 20.6652 8.96778H16.7965C16.2985 8.96778 15.9059 9.03805 15.6186 9.17858C15.3313 9.3191 15.0664 9.5171 14.8238 9.77259L14.0386 10.654C13.8215 10.884 13.6268 11.0469 13.4544 11.1427C13.2821 11.2385 13.0043 11.2864 12.6213 11.2864H10.2081C9.19943 11.2864 8.43973 11.5355 7.92901 12.0337C7.41828 12.5319 7.16291 13.2856 7.16291 14.2948V24.4315C7.16291 25.4279 7.41828 26.1752 7.92901 26.6735C8.43973 27.1716 9.19943 27.4207 10.2081 27.4207ZM18.7883 25.0064C17.7158 25.0064 16.7454 24.7509 15.8772 24.2398C15.0089 23.7288 14.3163 23.039 13.7991 22.1705C13.282 21.3017 13.0235 20.3308 13.0235 19.2577C13.0235 18.1975 13.282 17.233 13.7991 16.3643C14.3163 15.4956 15.0089 14.8058 15.8772 14.2948C16.7454 13.7838 17.7158 13.5283 18.7883 13.5283C19.848 13.5283 20.8088 13.7838 21.6707 14.2948C22.5326 14.8058 23.2221 15.4956 23.7392 16.3643C24.2563 17.233 24.5148 18.1975 24.5148 19.2577C24.5148 20.3436 24.2563 21.3209 23.7392 22.1895C23.2221 23.0582 22.5326 23.7448 21.6707 24.2494C20.8088 24.7541 19.848 25.0064 18.7883 25.0064ZM18.7691 23.3584C19.5097 23.3584 20.1896 23.1763 20.809 22.8123C21.4282 22.4482 21.9229 21.9532 22.2932 21.3273C22.6634 20.7014 22.8486 20.0115 22.8486 19.2577C22.8486 18.504 22.6634 17.8174 22.2932 17.1978C21.9229 16.5783 21.4282 16.0865 20.809 15.7224C20.1896 15.3583 19.5097 15.1763 18.7691 15.1763C18.0158 15.1763 17.3263 15.3583 16.7007 15.7224C16.0751 16.0865 15.5803 16.5783 15.2164 17.1978C14.8525 17.8174 14.6706 18.504 14.6706 19.2577C14.6706 20.0115 14.8525 20.7014 15.2164 21.3273C15.5803 21.9532 16.0751 22.4482 16.7007 22.8123C17.3263 23.1763 18.0158 23.3584 18.7691 23.3584ZM26.4109 16.4984C26.0661 16.4984 25.766 16.3739 25.5107 16.1248C25.2553 15.8757 25.1277 15.5659 25.1277 15.1954C25.1277 14.8377 25.2553 14.5343 25.5107 14.2852C25.766 14.0361 26.0661 13.9116 26.4109 13.9116C26.7683 13.9116 27.0747 14.0361 27.3301 14.2852C27.5856 14.5343 27.7133 14.8377 27.7133 15.1954C27.7133 15.5659 27.5856 15.8757 27.3301 16.1248C27.0747 16.3739 26.7683 16.4984 26.4109 16.4984Z" fill="white" fillOpacity="0.8"/>
  </svg>
)

export default function AllReferralsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const data = await getUserReferrals(accessToken)
        setReferrals(data.referrals || [])
      } catch (error) {
        console.error('Failed to fetch referrals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [accessToken])

  return (
    <main className="w-full relative min-h-screen app-frame">
      <Header />
      <section className="px-4 pt-4 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-white">{t('referrals.yourReferrals')}</h1>
        </div>

        <div className="space-y-0">
          {loading ? (
            <div className="text-white/70 text-sm text-center py-8">{t('referrals.loading')}</div>
          ) : referrals.length === 0 ? (
            <div className="text-white/70 text-sm text-center py-8">{t('profile.noReferrals')}</div>
          ) : (
            referrals.map((referral, index) => (
              <div
                key={index}
                className="w-full flex items-center gap-3 py-4 border-b border-[#261f3f] last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                  {referral.image ? (
                    <img src={referral.image} alt={referral.name} className="w-full h-full object-cover" />
                  ) : (
                    <DefaultAvatarIcon />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{referral.name}</div>
                  <div className="text-white/70 text-xs">{referral.username ? `@${referral.username}` : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 mb-4">
          <button
            onClick={() => router.push('/profile/referrals/links')}
            className="w-full rounded-[12px] p-4 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #8F37FF 0%, #AC6BFF 100%)'
            }}
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 5.5C8.5 4.67157 9.17157 4 10 4C10.8284 4 11.5 4.67157 11.5 5.5V7.5C11.5 8.32843 10.8284 9 10 9C9.17157 9 8.5 8.32843 8.5 7.5V5.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.5 12.5C8.5 11.6716 9.17157 11 10 11C10.8284 11 11.5 11.6716 11.5 12.5V14.5C11.5 15.3284 10.8284 16 10 16C9.17157 16 8.5 15.3284 8.5 14.5V12.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.5 8.5C4.67157 8.5 4 9.17157 4 10C4 10.8284 4.67157 11.5 5.5 11.5H7.5C8.32843 11.5 9 10.8284 9 10C9 9.17157 8.32843 8.5 7.5 8.5H5.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 8.5C13.6716 8.5 13 9.17157 13 10C13 10.8284 13.6716 11.5 14.5 11.5H16.5C17.3284 11.5 18 10.8284 18 10C18 9.17157 17.3284 8.5 16.5 8.5H14.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-white font-medium">{t('profile.yourReferralLinks')}</span>
            </div>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="text-white/70 text-xs mb-8">
          {t('profile.onlyWatchedAccounts')}
        </div>
      </section>
    </main>
  )
}

