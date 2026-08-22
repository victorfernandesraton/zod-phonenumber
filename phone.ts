import { z } from 'zod'
import parsePhoneNumber from 'libphonenumber-js'
import type { PhoneNumber, CountryCode } from 'libphonenumber-js'
import { timezoneRegions } from './timezone-regions.generated.ts'

export interface PhoneConstraints {
  defaultCountry?: string | undefined
  ddi?: string | undefined
  ddd?: string | undefined
  timezone?: string | undefined
}

function resolveTimezone(timezone: string): CountryCode {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone })
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`)
  }

  const region = timezoneRegions[timezone as keyof typeof timezoneRegions]
  if (!region || timezone.startsWith('Etc/')) {
    throw new Error(`Timezone does not identify a phone country: ${timezone}`)
  }

  return region as CountryCode
}

type ParsePhone = typeof parsePhoneNumber

export function toPhoneNumber(
  value: string,
  country: CountryCode | undefined,
  parse: ParsePhone = parsePhoneNumber,
): PhoneNumber {
  const phone = parse(value, country)
  if (!phone) throw new Error('Unexpected: parse failed after refine')
  return phone
}

function buildSchema(constraints: PhoneConstraints) {
  const { defaultCountry, ddi, ddd, timezone } = constraints
  const resolvedCountry = timezone ? resolveTimezone(timezone) : defaultCountry

  return z.string().refine(
    (val: string) => {
      const phone = parsePhoneNumber(val, resolvedCountry as CountryCode | undefined)
      if (!phone || !phone.isPossible()) return false

      if (resolvedCountry && phone.country !== resolvedCountry) return false

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
  ).transform((val: string): PhoneNumber => toPhoneNumber(val, resolvedCountry as CountryCode | undefined))
}

function createPhoneSchema(constraints: PhoneConstraints) {
  const schema = buildSchema(constraints)

  const phone: typeof schema & {
    country: (code: string) => ReturnType<typeof createPhoneSchema>
    ddi: (code: string) => ReturnType<typeof createPhoneSchema>
    ddd: (code: string) => ReturnType<typeof createPhoneSchema>
    timezone: (zone: string) => ReturnType<typeof createPhoneSchema>
    '~standard': typeof schema['~standard']
    _zod: typeof schema['_zod']
  } = schema as typeof schema & {
    country: (code: string) => ReturnType<typeof createPhoneSchema>
    ddi: (code: string) => ReturnType<typeof createPhoneSchema>
    ddd: (code: string) => ReturnType<typeof createPhoneSchema>
    timezone: (zone: string) => ReturnType<typeof createPhoneSchema>
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
  phone.timezone = (zone: string) => createPhoneSchema({ ...constraints, timezone: zone })

  return phone
}

export function phone(countryOrTimezone?: string) {
  if (countryOrTimezone?.includes('/')) return createPhoneSchema({ timezone: countryOrTimezone })
  return createPhoneSchema({ defaultCountry: countryOrTimezone })
}

export type PhoneSchema = ReturnType<typeof phone>
