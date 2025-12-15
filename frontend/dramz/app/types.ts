export type Episode = {
  id: string
  title: string
  durationMin: number
  number: number
}

export type Season = {
  id: string
  number: number
  episodes: Episode[]
}

export type Show = {
  id: string
  slug: string
  title: string
  genres: string[]
  posterUrl: string
  backdropUrl: string
  totalSeasons: number
  totalEpisodes: number
}

export type RewardTask = {
  id: string
  title: string
  description: string
  crowns: number
  action?: string
  expiresIn?: string
}


