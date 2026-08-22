import { writeFile } from 'node:fs/promises'
import { getTimeZones, timeZonesNames } from '@vvo/tzdb'
import { buildTimezoneRegions, renderTimezoneModule } from './timezone-generator.ts'
import { argv } from 'node:process'

const output = argv[2] ?? 'timezone-regions.generated.ts'
const regions = buildTimezoneRegions(getTimeZones(), new Set(timeZonesNames))

if (!Object.keys(regions).length) throw new Error('No timezone regions were extracted')
await writeFile(output, renderTimezoneModule(regions, '@vvo/tzdb'), 'utf8')
