import { z } from '../index.js'
import { test } from 'node:test'
import { strictEqual, ok } from 'node:assert'
import{ PhoneNumber} from 'libphonenumber-js'

test('z.phone() basic validation', async (t) => {
  let schema: ReturnType<typeof z.phone>

  t.before(() => {
    schema = z.phone()
  })

  await t.test('should parse valid international number', () => {
    const result = schema.safeParse('+12133734253')
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.country, 'US')
      strictEqual(result.data.number, '+12133734253')
    }
  })

  await t.test('should parse valid Brazilian number', () => {
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.country, 'BR')
    }
  })

  await t.test('should return PhoneNumber object on parse', () => {
    const phone = schema.parse('+12133734253')
    strictEqual(phone.country, 'US')
    strictEqual(phone.countryCallingCode, '1')
    ok(typeof phone.nationalNumber === 'string')
    ok(phone.isPossible())
    ok(typeof phone.formatInternational() === 'string')
  })

  await t.test('should reject invalid phone string', () => {
    const result = schema.safeParse('not-a-phone')
    strictEqual(result.success, false)
  })

  await t.test('should reject empty string', () => {
    const result = schema.safeParse('')
    strictEqual(result.success, false)
  })

  await t.test('should reject short number', () => {
    const result = schema.safeParse('+12')
    strictEqual(result.success, false)
  })
})

test('z.phone().country(code)', async (t) => {
  await t.test('should accept valid number from specified country', () => {
    const schema = z.phone().country('BR')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.country, 'BR')
    }
  })

  await t.test('should reject number from different country', () => {
    const schema = z.phone().country('BR')
    const result = schema.safeParse('+12133734253')
    strictEqual(result.success, false)
  })

  await t.test('should accept US number with US country', () => {
    const schema = z.phone().country('US')
    const result = schema.safeParse('+12133734253')
    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.country, 'US')
    }
  })
})

test('z.phone().ddi(code)', async (t) => {
  await t.test('should accept number with matching DDI', () => {
    const schema = z.phone().ddi('+55')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('should reject number with different DDI', () => {
    const schema = z.phone().ddi('+55')
    const result = schema.safeParse('+12133734253')
    strictEqual(result.success, false)
  })

  await t.test('should accept DDI without + prefix', () => {
    const schema = z.phone().ddi('55')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })
})

test('z.phone().ddd(code)', async (t) => {
  await t.test('should accept Brazilian number with correct area code', () => {
    const schema = z.phone().ddd('11')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('should reject Brazilian number with wrong area code', () => {
    const schema = z.phone().ddd('11')
    const result = schema.safeParse('+5521999988888')
    strictEqual(result.success, false)
  })

  await t.test('should accept Brazilian number from SP capital', () => {
    const schema = z.phone().ddd('11')
    const result = schema.safeParse('+5511944445555')
    strictEqual(result.success, true)
  })

  await t.test('should accept Brazilian number from Rio', () => {
    const schema = z.phone().ddd('21')
    const result = schema.safeParse('+5521988887777')
    strictEqual(result.success, true)
  })

  await t.test('should implicitly set country to BR when using DDD', () => {
    const schema = z.phone().ddd('11')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })
})

test('z.phone().country().ddd() chaining', async (t) => {
  await t.test('should accept BR number from SP', () => {
    const schema = z.phone().country('BR').ddd('11')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('should reject BR number from wrong DDD', () => {
    const schema = z.phone().country('BR').ddd('11')
    const result = schema.safeParse('+5521999988888')
    strictEqual(result.success, false)
  })

  await t.test('should reject US number (wrong country for BR)', () => {
    const schema = z.phone().country('BR').ddd('11')
    const result = schema.safeParse('+12133734253')
    strictEqual(result.success, false)
  })
})

test('z.phone().ddi().ddd() chaining', async (t) => {
  await t.test('should accept BR SP number with DDI and DDD', () => {
    const schema = z.phone().ddi('+55').ddd('11')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('should reject BR number with wrong DDD', () => {
    const schema = z.phone().ddi('+55').ddd('11')
    const result = schema.safeParse('+552199994444')
    strictEqual(result.success, false)
  })
})

test('z.phone() with z.object()', async (t) => {
  await t.test('should work inside z.object()', () => {
    const schema = z.object({
      name: z.string(),
      phone: z.phone().country('BR').ddd('11'),
    })

    const result = schema.safeParse({
      name: 'João',
      phone: '+5511999988888',
    })

    strictEqual(result.success, true)
    if (result.success) {
      strictEqual(result.data.name, 'João')
      ok(result.data.phone instanceof PhoneNumber)
    }
  })

  await t.test('should fail object validation on invalid phone', () => {
    const schema = z.object({
      name: z.string(),
      phone: z.phone().country('BR'),
    })

    const result = schema.safeParse({
      name: 'João',
      phone: '+12133734253',
    })

    strictEqual(result.success, false)
  })
})

test('z.phone() output type', async (t) => {
  await t.test('parse returns PhoneNumber with correct properties', () => {
    const phone = z.phone().parse('+442076781234') // UK London
    strictEqual(phone.country, 'GB')
    strictEqual(phone.countryCallingCode, '44')
    ok(phone.nationalNumber.length > 0)
    ok(phone.isPossible())
  })

  await t.test('PhoneNumber format methods work', () => {
    const phone = z.phone().parse('+12133734253')
    strictEqual(phone.formatInternational(), '+1 213 373 4253')
    strictEqual(phone.formatNational(), '(213) 373-4253')
    strictEqual(phone.getURI(), 'tel:+12133734253')
  })
})

test('z.phone() constructor argument', async (t) => {
  await t.test('z.phone("BR") should validate as Brazilian', () => {
    const schema = z.phone('BR')
    const result = schema.safeParse('+5511999988888')
    strictEqual(result.success, true)
  })

  await t.test('z.phone("BR") should reject non-Brazilian', () => {
    const schema = z.phone('BR')
    const result = schema.safeParse('+12133734253')
    strictEqual(result.success, false)
  })
})

test('z.phone() edge cases', async (t) => {
  await t.test('should handle number with spaces', () => {
    const result = z.phone().safeParse('+55 11 99999 8888')
    strictEqual(result.success, true)
  })

  await t.test('should handle number with dashes', () => {
    const result = z.phone().safeParse('+1-213-373-4253')
    strictEqual(result.success, true)
  })

  await t.test('should handle number with parentheses', () => {
    const result = z.phone().safeParse('+1 (213) 373-4253')
    strictEqual(result.success, true)
  })

  await t.test('should handle number with dots', () => {
    const result = z.phone().safeParse('+1.213.373.4253')
    strictEqual(result.success, true)
  })

  await t.test('should reject non-string input gracefully', () => {
    const result = z.phone().safeParse(123 as unknown as string)
    strictEqual(result.success, false)
  })
})
