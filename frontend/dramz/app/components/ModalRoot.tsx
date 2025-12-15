'use client'

import { useSelector } from 'react-redux'
import { RootState } from '../state/store'
import LoginModal from './LoginModal'
import FaqModal from './FaqModal'
import PurchaseModal from './PurchaseModal'
import InfoModal from './InfoModal'
import RepostModal from './RepostModal'
import AllSeriesModal from './AllSeriesModal'
import ChangeLanguageModal from './ChangeLanguageModal'
import ChangeNameModal from './ChangeNameModal'
import NoUsernameModal from './NoUsernameModal'

export default function ModalRoot() {
  const modal = useSelector((s: RootState) => s.ui.modal)
  if (modal === 'login') return <LoginModal />
  if (modal === 'faq') return <FaqModal />
  if (modal === 'purchase') return <PurchaseModal />
  if (modal === 'info') return <InfoModal />
  if (modal === 'repost') return <RepostModal />
  if (modal === 'allSeries') return <AllSeriesModal />
  if (modal === 'changeLanguage') return <ChangeLanguageModal />
  if (modal === 'changeName') return <ChangeNameModal />
  if (modal === 'noUsername') return <NoUsernameModal />
  return null
}


