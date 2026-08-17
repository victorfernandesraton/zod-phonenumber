import { test } from 'node:test'
import { ok, strictEqual } from 'node:assert'
import { renderTimezoneModule } from '../scripts/timezone-generator.js'

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
    const output = renderTimezoneModule({ 'Test/"Zone': 'X1' }, 'test-source')
    ok(output.includes('"Test/\\"Zone": "X1"'))
    ok(output.includes('from test-source'))
  })
})
