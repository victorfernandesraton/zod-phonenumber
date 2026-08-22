import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { buildTimezoneRegions, renderTimezoneModule } from '../scripts/timezone-generator.ts'

const canonical = new Set([
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Bamako',
  'America/Bahia',
  'America/Sao_Paulo',
  'America/New_York',
  'Pacific/Pohnpei',
  'Pacific/Kosrae',
  'Pacific/Guadalcanal',
])

test('buildTimezoneRegions', async (t) => {
  await t.test('maps canonical top-level names to their country', () => {
    const regions = buildTimezoneRegions(
      [
        { name: 'Africa/Abidjan', countryCode: 'CI', group: ['Africa/Abidjan'] },
        { name: 'Africa/Accra', countryCode: 'GH', group: ['Africa/Accra'] },
      ],
      canonical,
    )
    deepStrictEqual(regions, {
      'Africa/Abidjan': 'CI',
      'Africa/Accra': 'GH',
    })
  })

  await t.test('maps folded canonical zones via an unambiguous group', () => {
    const regions = buildTimezoneRegions(
      [
        { name: 'America/Sao_Paulo', countryCode: 'BR', group: ['America/Sao_Paulo', 'America/Bahia'] },
      ],
      canonical,
    )
    strictEqual(regions['America/Bahia'], 'BR')
  })

  await t.test('does not leak cross-country offset groups', () => {
    const regions = buildTimezoneRegions(
      [
        { name: 'Africa/Abidjan', countryCode: 'CI', group: ['Africa/Abidjan', 'Africa/Accra', 'Africa/Bamako'] },
        { name: 'Africa/Accra', countryCode: 'GH', group: ['Africa/Accra'] },
        { name: 'Africa/Bamako', countryCode: 'ML', group: ['Africa/Bamako'] },
      ],
      canonical,
    )
    strictEqual(regions['Africa/Accra'], 'GH')
    strictEqual(regions['Africa/Bamako'], 'ML')
    strictEqual(regions['Africa/Abidjan'], 'CI')
  })

  await t.test('excludes ambiguous zones present in multiple countries', () => {
    const regions = buildTimezoneRegions(
      [
        { name: 'Pacific/Kosrae', countryCode: 'FM', group: ['Pacific/Kosrae', 'Pacific/Pohnpei'] },
        { name: 'Pacific/Guadalcanal', countryCode: 'SB', group: ['Pacific/Guadalcanal', 'Pacific/Pohnpei'] },
      ],
      canonical,
    )
    strictEqual(regions['Pacific/Pohnpei'], undefined)
  })

  await t.test('excludes non-canonical backward links', () => {
    const regions = buildTimezoneRegions(
      [{ name: 'Africa/Abidjan', countryCode: 'CI', group: ['Africa/Abidjan', 'Iceland'] }],
      canonical,
    )
    strictEqual(regions['Iceland'], undefined)
  })

  await t.test('excludes Etc/ technical zones', () => {
    const regions = buildTimezoneRegions(
      [{ name: 'Etc/UTC', countryCode: '001', group: ['Etc/UTC'] }],
      new Set(['Etc/UTC']),
    )
    deepStrictEqual(regions, {})
  })
})

test('timezone generator', async (t) => {
  await t.test('renders an empty map', () => {
    const output = renderTimezoneModule({})
    strictEqual(output.includes('export const timezoneRegions = {\n\n} as const'), true)
  })

  await t.test('renders deterministic TypeScript', () => {
    const output = renderTimezoneModule({
      'Europe/London': 'GB',
      'America/Bahia': 'BR',
    })
    ok(output.includes('@vvo/tzdb'))
    strictEqual(output.indexOf('America/Bahia') < output.indexOf('Europe/London'), true)
  })

  await t.test('serializes special characters safely', () => {
    const key = 'Test/"Zone'
    const output = renderTimezoneModule({ [key]: 'X1' }, 'test-source')
    ok(output.includes(`${JSON.stringify(key)}: "X1"`))
    ok(output.includes('from test-source'))
  })
})
