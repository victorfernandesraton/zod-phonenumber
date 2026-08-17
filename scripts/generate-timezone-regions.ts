import { writeFile } from 'node:fs/promises'
import { getTimeZones } from '@vvo/tzdb'
import { renderTimezoneModule } from './timezone-generator.js'
import {argv} from 'node:process'

const output = argv[2] ?? 'timezone-regions.generated.ts'
const regions: Record<string, string> = {}

for (const timezone of getTimeZones()) {
  if (!timezone.countryCode || timezone.name.startsWith('Etc/')) continue
  for (const name of [timezone.name, ...timezone.group]) {
    if (name.startsWith('Etc/')) continue
    const existing = regions[name]
    if (existing && existing !== timezone.countryCode) continue
    regions[name] = timezone.countryCode
  }
}

if (!Object.keys(regions).length) throw new Error('No timezone regions were extracted')
await writeFile(output, renderTimezoneModule(regions, '@vvo/tzdb'), 'utf8')
