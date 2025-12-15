export type ApiSeries = {
  _id: string
  title: string
  description: string
  coverImage: string
  price: number
  isVisible: boolean
  freeEpisodesCount: number
  createdAt: string
  updatedAt: string
}

export type ApiEpisode = {
  episodeNumber: number
  isComplete: boolean
  isFree: boolean
  availableMediaCount: number
}

export type SeriesEpisodesResponse = {
  series: ApiSeries
  episodes: ApiEpisode[]
  isPurchased: boolean
}

export type ApiFaqItem = {
  _id: string
  question: string
  answer: string
  order: number
}

export type CrownExchangeRate = {
  rubPerCrown: number
  usdPerCrown: number
  telegramStarPerCrown: number
}

export type GetTokenRequest = {
  initData: string
  referralCode?: string
}

export type GetTokenResponseUser = {
  telegramId: number
  username: string | null
  displayName: string | null
  crowns: number
  referralCode?: string
}

export type GetTokenResponse = {
  accessToken: string
  user: GetTokenResponseUser
}

export type UserBalance = {
  telegramId: number
  crowns: number
  username: string | null
  displayName: string | null
}

export type UserProfile = {
  telegramId: number
  username: string | null
  displayName: string | null
  crowns: number
  registeredAt: string
  lastActivityAt: string
  totalPurchases: number
  totalSpent: number
  totalViews: number
  referralCode?: string
  image?: string | null
}

export type PurchaseCrownsRequest = {
  amount: number
  currency: 'RUB' | 'USD' | 'TELEGRAM_STAR'
  transactionHash?: string
}

export type PurchaseCrownsResponse = {
  success: boolean
  user: UserProfile | UserBalance | null
  crownsAdded: number
  amount: number
  currency: 'RUB' | 'USD' | 'TELEGRAM_STAR'
  purchase: unknown
}

export type RegisterUserRequest = {
  telegramId: number
  username: string | null
  displayName: string | null
}

export type LikeSeriesResponse = {
  isLiked: boolean
  likesCount: number
}

export type BookmarkSeriesResponse = {
  isBookmarked: boolean
  bookmarksCount: number
}

export type SeriesStatusResponse = {
  isLiked: boolean
  isBookmarked: boolean
  likesCount: number
  bookmarksCount: number
}

export type PurchaseSeriesResponse = {
  success: boolean
  user: UserProfile | UserBalance | null
  series: ApiSeries | null
  purchase: unknown
  newBalance: number
}

export type EpisodeInfoResponse = {
  series: ApiSeries
  episode: ApiEpisode
  isPurchased: boolean
  isFree: boolean
}

export type RecordEpisodeViewResponse = {
  success: boolean
}

export type ReferralLink = {
  type: 'youtube' | 'telegram' | 'instagram' | 'x'
  code: string
  activatedCount: number
}

export type ReferrerInfo = {
  name: string
  image: string | null
  username: string | null
} | null

export type ReferralInfo = {
  name: string
  image: string | null
  username: string | null
  referredAt: string
}

export type ReferralsResponse = {
  referralLinks: ReferralLink[]
  referrer: ReferrerInfo
  referrals: ReferralInfo[]
}

export type ApiTask = {
  id: string
  title: string
  description: string
  reward: number
  type: 'manual' | 'automatic'
  link?: string | null
  canComplete: boolean
  nextAvailableAt?: string | null
  lastCompletedAt?: string | null
  status: string
}

export type ActiveTasksResponse = {
  tasks: ApiTask[]
}

export type CompleteTaskRequest = {
  link?: string
}

export type TaskCompletion = {
  id: string
  task: {
    id: string
    title: string
    reward: number
    type: 'manual' | 'automatic'
  }
  status: string
  completedAt: string
  rewardedAt?: string | null
}

export type CompleteTaskResponse = {
  success: boolean
  message: string
  completion: {
    id: string
    status: string
    completedAt: string
  }
}

export type TaskHistoryResponse = {
  completions: TaskCompletion[]
}

