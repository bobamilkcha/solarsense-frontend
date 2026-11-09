import { CRITERION_LABELS, DEFAULT_SETTINGS, type Criterion, type ScoreSettings } from '../../../lib/survey'
import { Button } from '../../../components/ui/Button'

type Props = { settings: ScoreSettings; onChange: (settings: ScoreSettings) => void }

const numberClass =
  'mt-1 block w-28 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none'

export function ScoreSettingsPanel({ settings, onChange }: Props) {
  function setWeight(criterion: Criterion, value: number) {
    onChange({ ...settings, weights: { ...settings.weights, [criterion]: value } })
  }
  function setTarget(key: 'targetTiltDeg' | 'targetHeadingDeg', text: string) {
    const value = Number(text)
    if (text.trim() !== '' && Number.isFinite(value)) onChange({ ...settings, [key]: value })
  }
  return (
    <details className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
      <summary className="min-h-11 cursor-pointer py-2 font-medium text-slate-900">Scoring settings</summary>
      <div className="mt-3 space-y-5">
        <p className="text-slate-600">
          How much each factor counts towards a spot&apos;s 0–100 score. Set a weight to 0 to ignore it. Irradiance is
          compared with the best spot in this survey.
        </p>
        <div className="space-y-4">
          {(Object.keys(CRITERION_LABELS) as Criterion[]).map((c) => (
            <label key={c} className="block">
              <span className="flex justify-between font-medium text-slate-700">
                {CRITERION_LABELS[c]}
                <span className="tabular-nums text-slate-500">{settings.weights[c]}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.weights[c]}
                onChange={(e) => setWeight(c, Number(e.target.value))}
                className="mt-1 h-8 w-full accent-amber-500"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="font-medium text-slate-700">
            Best tilt (°)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={90}
              value={settings.targetTiltDeg}
              onChange={(e) => setTarget('targetTiltDeg', e.target.value)}
              className={numberClass}
            />
          </label>
          <label className="font-medium text-slate-700">
            Best heading (°)
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={359}
              value={settings.targetHeadingDeg}
              onChange={(e) => setTarget('targetHeadingDeg', e.target.value)}
              className={numberClass}
            />
          </label>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onChange(DEFAULT_SETTINGS)}>
          Reset to defaults
        </Button>
      </div>
    </details>
  )
}
