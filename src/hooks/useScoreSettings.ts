import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type ScoreSettings } from '../lib/survey'

const KEY = 'solarsense.survey.settings'

function load(): ScoreSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<ScoreSettings> | null
    if (!parsed) return DEFAULT_SETTINGS
    return {
      weights: { ...DEFAULT_SETTINGS.weights, ...parsed.weights },
      targetTiltDeg: typeof parsed.targetTiltDeg === 'number' ? parsed.targetTiltDeg : DEFAULT_SETTINGS.targetTiltDeg,
      targetHeadingDeg:
        typeof parsed.targetHeadingDeg === 'number' ? parsed.targetHeadingDeg : DEFAULT_SETTINGS.targetHeadingDeg,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Scoring weights and targets, remembered on this device between visits. */
export function useScoreSettings() {
  const [settings, setSettings] = useState<ScoreSettings>(load)
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
  }, [settings])
  return [settings, setSettings] as const
}
