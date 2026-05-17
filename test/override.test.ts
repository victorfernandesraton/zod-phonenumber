import { z } from 'zod'
import '../index.js'
import { test } from 'node:test'
import { strictEqual, ok } from 'node:assert'
import type { PhoneSchema } from '../phone.js'

const zPhone = z as typeof z & { phone: (country?: string) => PhoneSchema }

test('side-effect override pattern: import { z } from "zod" + import "zod-phonenumber"', async (t) => {
  await t.test('z.phone() should be available after side-effect import', () => {
    const phone = zPhone.phone().parse('+12133734253')
    strictEqual(phone.country, 'US')
    strictEqual(phone.number, '+12133734253')
  })

  await t.test('z.phone().country() should filter', () => {
    const schema = zPhone.phone().country('BR')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.country, 'BR')
    }
  })

  await t.test('z.phone().ddi().ddd() chaining should work', () => {
    const schema = zPhone.phone().ddi('+55').ddd('11')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('z.phone should reject invalid numbers', () => {
    const result = zPhone.phone().safeParse('not-a-phone')
    strictEqual(result.success, false)
  })

  await t.test('z.phone should work with z.object()', () => {
    const schema = z.object({
      name: z.string(),
      phone: zPhone.phone().country('BR').ddd('11'),
    })

    const result = schema.safeParse({
      name: 'Maria',
      phone: '+5511999988888',
    })

    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.name, 'Maria')
      ok(typeof result.data.phone.number === 'string')
    }
  })
})

test('edge cases with override pattern', async (t) => {
  await t.test('should reject invalid short number', () => {
    const result = zPhone.phone().safeParse('+12')
    strictEqual(result.success, false)
  })

  await t.test('override z object still works with original zod methods', () => {
    const result = z.string().safeParse('hello')
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data, 'hello')
    }
  })
})
