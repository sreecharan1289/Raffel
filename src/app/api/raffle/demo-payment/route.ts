import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { userSchema, generateToken } from '../../../../../lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = userSchema.parse(body)
    
    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { phone: validatedData.phone }
        ]
      }
    })
    
    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: validatedData
      })
    }
    
    // Generate unique token
    let token: string
    let tokenExists = true
    
    while (tokenExists) {
      token = generateToken()
      const existingEntry = await prisma.entry.findUnique({
        where: { token }
      })
      tokenExists = !!existingEntry
    }
    
    // Create entry directly as confirmed (demo mode)
    const entry = await prisma.entry.create({
      data: {
        userId: user.id,
        token: token!,
        amount: 10000, // ₹100 in paise
        status: 'CONFIRMED',
        paymentId: `demo_${Date.now()}`,
        entryNumber: 1,
        totalEntries: 1
      }
    })
    
    return NextResponse.json({
      success: true,
      token: token!,
      entry: {
        id: entry.id,
        token: entry.token,
        user: {
          name: user.name,
          email: user.email
        }
      }
    })
    
  } catch (error) {
    console.error('Demo payment error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}