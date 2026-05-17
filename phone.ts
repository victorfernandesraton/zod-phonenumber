import { z } from 'zod'
import parsePhoneNumber from 'libphonenumber-js'
import type { PhoneNumber, CountryCode } from 'libphonenumber-js'

export interface PhoneConstraints {
  defaultCountry?: string | undefined
  ddi?: string | undefined
  ddd?: string | undefined
}

function buildSchema(constraints: PhoneConstraints) {
  const { defaultCountry, ddi, ddd } = constraints

  return z.string().refine(
    (val: string) => {
      const phone = parsePhoneNumber(val, defaultCountry as CountryCode | undefined)
      if (!phone || !phone.isPossible()) return false

      if (defaultCountry && phone.country !== defaultCountry) return false

      if (ddi) {
        const expectedCallingCode = ddi.replace(/^\+/, '')
        if (phone.countryCallingCode !== expectedCallingCode) return false
      }

      if (ddd && phone.country === 'BR') {
        const areaCode = phone.nationalNumber.slice(0, 2)
        if (areaCode !== ddd) return false
      }

      return true
    },
    { message: 'Invalid phone number' },
  ).transform((val: string): PhoneNumber => {
    const phone = parsePhoneNumber(val, defaultCountry as CountryCode | undefined)
    if (!phone) throw new Error('Unexpected: parse failed after refine')
    return phone
  })
}

function createPhoneSchema(constraints: PhoneConstraints) {
  const schema = buildSchema(constraints)

  const phone: typeof schema & {
    country: (code: string) => ReturnType<typeof createPhoneSchema>
    ddi: (code: string) => ReturnType<typeof createPhoneSchema>
    ddd: (code: string) => ReturnType<typeof createPhoneSchema>
    '~standard': typeof schema['~standard']
    _zod: typeof schema['_zod']
  } = schema as typeof schema & {
    country: (code: string) => ReturnType<typeof createPhoneSchema>
    ddi: (code: string) => ReturnType<typeof createPhoneSchema>
    ddd: (code: string) => ReturnType<typeof createPhoneSchema>
  }

  phone.country = (code: string) => createPhoneSchema({ ...constraints, defaultCountry: code })
  phone.ddi = (code: string) => createPhoneSchema({ ...constraints, ddi: code })
  phone.ddd = (code: string) => {
    const next = { ...constraints, ddd: code }
    if (!next.defaultCountry && !next.ddi) {
      next.defaultCountry = 'BR'
    }
    return createPhoneSchema(next)
  }

  return phone
}

export function phone(country?: string) {
  return createPhoneSchema({ defaultCountry: country })
}
