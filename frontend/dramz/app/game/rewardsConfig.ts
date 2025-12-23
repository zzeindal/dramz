export type GameRewardType = 'crowns' | 'free_series'

export type GameReward = {
  id: string
  /** Display title, e.g. "Малый приз" */
  title: string
  /** Probability in the 0–1 range. All probabilities should sum to 1. */
  probability: number
  /** Amount of crowns to award (if type === 'crowns') */
  crowns?: number
  /** Special type for super-rare prize that unlocks a series */
  type: GameRewardType
  /** Optional identifier of the series that should be unlocked for viewing */
  seriesId?: string
  /** Human-readable name of the series used in the popup text */
  seriesTitle?: string
}

export const GAME_REWARDS: GameReward[] = [
  {
    id: 'small',
    title: 'Малый приз',
    probability: 0.7,
    type: 'crowns',
    crowns: 20,
  },
  {
    id: 'medium',
    title: 'Средний приз',
    probability: 0.245,
    type: 'crowns',
    crowns: 35,
  },
  {
    id: 'large',
    title: 'Крупный приз',
    probability: 0.045,
    type: 'crowns',
    crowns: 45,
  },
  {
    id: 'super_rare',
    title: 'Супер-редкий приз',
    probability: 0.01,
    type: 'free_series',
    // TODO: укажите здесь ID сериала, который должен выдаваться как награда
    seriesId: 'FIRST_SERIES_ID',
    seriesTitle: 'Первый сериал',
  },
]

export function pickRandomReward(): GameReward {
  const totalProbability = GAME_REWARDS.reduce((sum, r) => sum + r.probability, 0)
  if (Math.abs(totalProbability - 1) > 0.0001) {
    // Fallback to normalized probabilities if someone changed the config
    const normalized = GAME_REWARDS.map((r) => ({
      ...r,
      probability: r.probability / totalProbability,
    }))
    return weightedPick(normalized)
  }
  return weightedPick(GAME_REWARDS)
}

function weightedPick(rewards: GameReward[]): GameReward {
  const r = Math.random()
  let acc = 0
  for (const reward of rewards) {
    acc += reward.probability
    if (r <= acc) {
      return reward
    }
  }
  return rewards[rewards.length - 1]
}


