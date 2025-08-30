import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import { User, Entry, PaymentLog } from '../../../../../lib/models'
import { userSchema, generateToken } from '../../../../../lib/validation'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate input
    const validatedData = userSchema.parse(body)
    
    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: validatedData.email },
        { phone: validatedData.phone }
      ]
    })
    
    // Create user if doesn't exist
    if (!user) {
      user = await User.create(validatedData)
    }
    
    // Generate unique token
    let token: string
    let tokenExists = true
    
    while (tokenExists) {
      token = generateToken()
      const existingEntry = await Entry.findOne({ token })
      tokenExists = !!existingEntry
    }
    
    // Create entry directly as confirmed (demo mode)
    const entry = await Entry.create({
      userId: user._id,
      token: token!,
      amount: 10000, // ₹100 in paise
      status: 'CONFIRMED',
      paymentId: `demo_${Date.now()}`,
      entryNumber: 1,
      totalEntries: 1
    })
    
    // Log demo payment
    await PaymentLog.create({
      entryId: entry._id,
      amount: entry.amount,
      status: 'SUCCESS',
      gatewayResponse: {
        mode: 'demo',
        timestamp: Date.now()
      }
    })
    
    return NextResponse.json({
      success: true,
      token: token!,
      entry: {
        id: entry._id.toString(),
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