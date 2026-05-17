# @victorfernandesraton/zod-phonenumber

[![npm](https://img.shields.io/npm/v/@victorfernandesraton/zod-phonenumber)](https://www.npmjs.com/package/@victorfernandesraton/zod-phonenumber)
[![CI](https://github.com/victorfernandesraton/zod-phonenumber/actions/workflows/ci.yml/badge.svg)](https://github.com/victorfernandesraton/zod-phonenumber/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-BSD--3--Clause-blue)](https://github.com/victorfernandesraton/zod-phonenumber/blob/main/LICENSE)

[Zod](https://zod.dev) extension for phone number validation using [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js).

### Why this library?

Most phone validation libraries treat phone numbers as plain strings — you validate them, maybe format them, and move on. They don't leverage zod's composable, chainable API.

`z.phone()` is **native to zod's ecosystem**. You chain constraints directly on the schema — `.country()`, `.ddi()`, `.ddd()` — the same way you chain `.min()`, `.max()`, `.email()` on `z.string()`. And because it uses zod's `refine` + `transform`, the output is a fully typed `PhoneNumber` object from `libphonenumber-js`, ready to use.

- **Chainable zod schema** — `.country('BR').ddd('11')` feels like zod, not a wrapper
- **Returns `PhoneNumber`** — not a boolean, not a reformatted string. Full object with `.country`, `.nationalNumber`, `.formatInternational()`, etc.
- **DDD support** — Brazilian area code filtering, auto-sets country to `BR`
- **More chainables coming** — `.type()`, national-only validation, and other constraints planned
- **Strict TypeScript** — zero `any`, zero `@ts-ignore`, fully type-safe
- **Zero config** — `npm install @victorfernandesraton/zod-phonenumber` installs everything

```ts
import { z } from '@victorfernandesraton/zod-phonenumber'

const schema = z.object({
  name: z.string(),
  phone: z.phone().country('BR').ddd('11'),
})

const result = schema.parse({ name: 'Joao', phone: '+5511999988888' })
result.phone.country  // 'BR'
result.phone.number   // '+5511999988888'
```

## Install

```bash
npm install @victorfernandesraton/zod-phonenumber
```

## Usage

### Import patterns

**Pattern A — Re-export (recommended):**

```ts
import { z } from '@victorfernandesraton/zod-phonenumber'

const phone = z.phone().country('BR').parse('+5511999988888')
```

**Pattern B — Named import:**

```ts
import { z } from 'zod'
import { phone } from '@victorfernandesraton/zod-phonenumber'

const schema = z.object({
  phone: phone().country('BR').ddd('11'),
})
```

### Basic validation

`z.phone()` validates any international phone number and returns a `PhoneNumber` object:

```ts
const phone = z.phone().parse('+12133734253')
phone.country              // 'US'
phone.number               // '+12133734253'
phone.nationalNumber       // '2133734253'
phone.countryCallingCode   // '1'
phone.isPossible()         // true
phone.formatInternational() // '+1 213 373 4253'
phone.formatNational()     // '(213) 373-4253'
```

Invalid numbers throw `ZodError`:

```ts
z.phone().parse('not-a-phone')  // throws ZodError
```

### Country filtering

Restrict to a specific country:

```ts
z.phone().country('BR').parse('+5511999988888')  // ok
z.phone().country('BR').parse('+12133734253')    // throws
```

Or pass as constructor argument:

```ts
z.phone('BR').parse('+5511999988888')  // ok
z.phone('BR').parse('+12133734253')    // throws
```

### DDI (international calling code)

Filter by country calling code:

```ts
z.phone().ddi('+55').parse('+5511999988888')   // ok
z.phone().ddi('55').parse('+5511999988888')    // ok (without +)
z.phone().ddi('+55').parse('+12133734253')     // throws
```

### DDD (Brazilian area code)

Filter by Brazilian DDD (2-digit area code). Automatically sets country to `'BR'`:

```ts
z.phone().ddd('11')   // Sao Paulo
z.phone().ddd('21')   // Rio de Janeiro
z.phone().ddd('31')   // Belo Horizonte

z.phone().ddd('11').parse('+5511999988888')  // ok
z.phone().ddd('11').parse('+5521999988888')  // throws (wrong area code)
```

### Chaining

Methods are chainable:

```ts
z.phone().country('BR').ddd('11')
z.phone().ddi('+55').ddd('11')
z.phone('BR').ddd('11')
```

### Integration with z.object()

```ts
const userSchema = z.object({
  name: z.string(),
  phone: z.phone().country('BR').ddd('11'),
})

const user = userSchema.parse({
  name: 'Maria',
  phone: '+5511999988888',
})
// user.phone is a PhoneNumber object
```

## API

### `z.phone(country?)`

Creates a phone number schema. Returns a schema with methods:

| Method | Description |
|--------|-------------|
| `.parse(data)` | Validates and returns `PhoneNumber`. Throws on invalid |
| `.safeParse(data)` | Returns `{ success, data }` or `{ success, error }` |
| `.country(code)` | Filters by country ISO code |
| `.ddi(code)` | Filters by international calling code |
| `.ddd(code)` | Filters by Brazilian area code (auto-sets BR) |

### Output: PhoneNumber

`schema.parse()` returns a `PhoneNumber` instance from `libphonenumber-js`:

| Property/Method | Description |
|-----------------|-------------|
| `.country` | ISO country code |
| `.number` | E.164 format |
| `.nationalNumber` | National significant number |
| `.countryCallingCode` | Country calling code |
| `.isPossible()` | Validates length |
| `.isValid()` | Full validation (needs max metadata) |
| `.getType()` | Phone type (needs max metadata) |
| `.formatInternational()` | e.g. `'+55 11 99999 8888'` |
| `.formatNational()` | e.g. `'(11) 99999-8888'` |
| `.getURI()` | e.g. `'tel:+5511999988888'` |

## License

BSD-3-Clause
