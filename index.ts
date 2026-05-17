import { z as zod } from 'zod'
import { phone } from './phone.js'

const z: typeof zod & { phone: typeof phone } = {
  ...zod,
  phone,
}

export { z }
export default z
export { phone } from './phone.js'
export type { PhoneConstraints, PhoneSchema } from './phone.js'
