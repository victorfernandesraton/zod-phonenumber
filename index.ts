import { z as zod } from 'zod'
import { phone } from './phone.ts'

const z: typeof zod & { phone: typeof phone } = {
  ...zod,
  phone,
}

export { z }
export default z
export { phone } from './phone.ts'
export type { PhoneConstraints, PhoneSchema } from './phone.ts'
