import { z } from 'zod'

export const userSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain alphabets and spaces'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6-9'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must not exceed 200 characters'),
  state: z.string().min(1, 'Please select a state'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
})

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const paymentVerificationSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

export const generateToken = (entryNumber?: number): string => {
  const prefix = 'SD'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  
  if (entryNumber) {
    // Format: SD-123456-ABC1-E01 (E01 = Entry 1, E02 = Entry 2, etc.)
    const entryPart = `E${entryNumber.toString().padStart(2, '0')}`
    return `${prefix}-${timestamp}-${random}-${entryPart}`
  }
  
  // Single entry format: SD-123456-ABCD
  return `${prefix}-${timestamp}-${random}`
}