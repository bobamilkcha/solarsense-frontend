import { DEFAULT_NOCT_C } from '../../lib/cellTemp'
import { formatNumber } from '../../lib/format'
import { InfoFootnote, InfoItem, InfoList } from '../ui/InfoPopover'

/** Explanations shown from the (i) button on each sensor chart (Live and History tabs). */

export function IrradianceInfo() {
  return (
    <>
      <InfoList>
        <InfoItem label="What it is">How strong the sunlight is on the device, in W/m². 0 is night.</InfoItem>
        <InfoItem label="Yellow line">Full sun, 1000 W/m² (the standard test level panels are rated at).</InfoItem>
        <InfoItem label="Dashed red line">200 W/m². A site that stays below this in daytime is doubtful.</InfoItem>
        <InfoItem label="Line colour">Red when weak, green when strong, grey at night (no verdict).</InfoItem>
        <InfoItem label="Why it matters">Panel output rises almost in step with irradiance, so this is the main number for a site.</InfoItem>
      </InfoList>
      <InfoFootnote>Values are approximate until the sensor is calibrated. Bands are a rule of thumb, not a standard.</InfoFootnote>
    </>
  )
}

export function CellTempInfo() {
  return (
    <>
      <InfoList>
        <InfoItem label="What it is">
          An estimate of how hot the solar cells inside a panel would get here. In sun they run 20–30 °C above the air.
        </InfoItem>
        <InfoItem label="How">
          Air temperature + ({DEFAULT_NOCT_C} − 20) / 800 × irradiance (NOCT model, NOCT {DEFAULT_NOCT_C} °C is a
          typical datasheet value).
        </InfoItem>
        <InfoItem label="Yellow line">25 °C, the cell temperature panels are rated at (STC).</InfoItem>
        <InfoItem label="Line colour">Green near 25 °C, orange around 45 °C, red from 60 °C.</InfoItem>
        <InfoItem label="Why it matters">
          Each °C above 25 costs roughly 0.3–0.4% output: about 7% at 45 °C and 12% at 60 °C.
        </InfoItem>
      </InfoList>
      <InfoFootnote>
        Ignores wind and mounting, and uses the uncalibrated irradiance, so treat it as a guide.
      </InfoFootnote>
    </>
  )
}

export function AirTempInfo() {
  return (
    <>
      <InfoList>
        <InfoItem label="What it is">Air temperature measured by the device.</InfoItem>
        <InfoItem label="No rating line">
          The 25 °C panel rating is a cell temperature, not air temperature, so it isn't drawn here. See the cell
          temperature chart for the comparison.
        </InfoItem>
        <InfoItem label="Why it matters">Hotter air means hotter cells and less output.</InfoItem>
      </InfoList>
    </>
  )
}

/** Rule-of-thumb bands, not a standard. */
function humidityLevel(percent: number): { label: string; className: string } {
  if (percent < 60) return { label: 'low to moderate', className: 'text-green-700' }
  if (percent <= 80) return { label: 'moderate to high', className: 'text-orange-600' }
  return { label: 'high', className: 'text-red-600' }
}

/** Colored "45% now (low to moderate)" style summary for a chart subtitle. */
export function HumidityLevelText({ value, suffix }: { value: number | null | undefined; suffix: string }) {
  if (value === null || value === undefined) return <span>No reading</span>
  const level = humidityLevel(value)
  return (
    <span className={level.className}>
      {formatNumber(value, 0)}% {suffix} ({level.label})
    </span>
  )
}

export function HumidityInfo() {
  return (
    <>
      <InfoList>
        <InfoItem label="Less sunlight">Humid air and haze scatter some sunlight, so irradiance is a little lower.</InfoItem>
        <InfoItem label="Dew">Overnight moisture rinses some dust off but can leave films that block light.</InfoItem>
        <InfoItem label="Corrosion">
          Long periods above about 80% speed up corrosion of connectors and frames and can add to potential-induced
          degradation (PID). Choose sealed connectors and check the module's humidity rating.
        </InfoItem>
        <InfoItem label="Cooling">Damp air and rain keep panels cooler, which helps efficiency.</InfoItem>
      </InfoList>
      <InfoFootnote>
        Rule of thumb: under 60% low concern, 60–80% moderate, over 80% high. Malaysia is often humid, so look at
        the average and how long it stays high, not a single reading.
      </InfoFootnote>
    </>
  )
}
