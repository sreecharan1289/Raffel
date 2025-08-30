import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { isTokenBlacklisted } from './token-blacklist'

const JWT_SECRET = process.env.JWT_SECRET!

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export const verifyToken = (token: string): any => {
  try {
    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return null
    }
    
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}