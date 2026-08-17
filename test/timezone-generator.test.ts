import { test } from 'node:test'
import { ok, strictEqual } from 'node:assert'
import { renderTimezoneModule } from '../scripts/timezone-generator.js'

test('timezone generator', async (t) => {
  await t.test('renders deterministic TypeScript', () => {
    const output = renderTimezoneModule({
      'Europe/London': 'GB',
      'America/Bahia': 'BR',
    })
    ok(output.includes('@vvo/tzdb'))
    strictEqual(output.indexOf('America/Bahia') < output.indexOf('Europe/London'), true)
  })
})
