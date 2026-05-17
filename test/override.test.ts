import { test } from 'node:test'
import { strictEqual, ok } from 'node:assert'

test('primary import pattern: import { z } from "zod-phonenumber"', async (t) => {
  const { z } = await import('../index.js')

  await t.test('z.phone() works as first-class zod schema', () => {
    const phone = z.phone().parse('+12133734253')
    strictEqual(phone.country, 'US')
    strictEqual(phone.number, '+12133734253')
  })

  await t.test('z keeps all original zod methods', () => {
    const str = z.string().parse('hello')
    strictEqual(str, 'hello')

    const num = z.number().parse(42)
    strictEqual(num, 42)

    const obj = z.object({ x: z.string() }).parse({ x: 'y' })
    strictEqual(obj.x, 'y')
  })

  await t.test('z.phone() chains country + ddd', () => {
    const phone = z.phone().country('BR').ddd('11').parse('+5511999988888')
    strictEqual(phone.country, 'BR')
  })

  await t.test('z.phone() works inside z.object()', () => {
    const schema = z.object({
      name: z.string(),
      phone: z.phone().country('BR'),
    })
    const result = schema.safeParse({ name: 'Joao', phone: '+5511999988888' })
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.phone.country, 'BR')
    }
  })

  await t.test('z.phone should reject invalid numbers', () => {
    const result = z.phone().safeParse('not-a-phone')
    strictEqual(result.success, false)
  })

  await t.test('z.phone should reject invalid short number', () => {
    const result = z.phone().safeParse('+12')
    strictEqual(result.success, false)
  })
})

test('named import pattern: import { phone } from "zod-phonenumber"', async (t) => {
  const { z } = await import('zod')
  const { phone } = await import('../index.js')

  await t.test('phone() returns a usable schema', () => {
    const schema = phone('BR')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('phone schema is compatible with z.object()', () => {
    const schema = z.object({
      name: z.string(),
      phone: phone().country('BR').ddd('11'),
    })
    const result = schema.safeParse({ name: 'Ana', phone: '+5511999988888' })
    strictEqual(result.success, true)
    if (result.success) {
      ok(typeof result.data.phone.number === 'string')
    }
  })
})
