import { RewardTask } from '../types'

export const rewardBalance = 24

export const tasks: RewardTask[] = [
  { id: 't1', title: 'Публикация эдита серии', description: 'Опубликуйте эдит по серии одного из сериалов в своей соц. сети', crowns: 20, action: 'Выполнить' },
  { id: 't2', title: 'Репост IG/TikTok с реф-ссылкой', description: 'Опубликуйте тизер сериала в сторис своего открытого аккаунта Instagram или TikTok', crowns: 10, action: 'Выполнить' },
  { id: 't3', title: 'Приглашение по реф-ссылке', description: 'Пригласите друга к просмотру сериалов по 1 из ваших реф-ссылок', crowns: 5, action: 'Выполнить' },
  { id: 't4', title: 'Просмотр 1 серии', description: 'Посмотрите полностью 1 серию сериала в приложении', crowns: 1, action: 'Выполнить' },
  { id: 't5', title: 'Лайк серии', description: 'Поставьте лайк одной из просматриваемых серий в приложении', crowns: 1, action: 'Выполнить' }
]


