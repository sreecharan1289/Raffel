import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import { Entry, PaymentLog } from '../../../../../lib/models'
import { verifyRazorpaySignature } from '../../../../../lib/razorpay'
import { paymentVerificationSchema } from '../../../../../lib/validation'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    
    // Validate input
    const validatedData = paymentVerificationSchema.parse(body)
    
    // Verify Razorpay signature
    const isValidSignature = verifyRazorpaySignature(
      validatedData.razorpay_order_id,
      validatedData.razorpay_payment_id,
      validatedData.razorpay_signature
    )
    
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }
    
    // Find all entries for this order (multiple entries support)
    const entries = await Entry.find({ razorpayOrderId: validatedData.razorpay_order_id })
      .populate('userId')
    
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries not found' },
        { status: 404 }
      )
    }
    
    // Update all entries status
    await Entry.updateMany(
      { razorpayOrderId: validatedData.razorpay_order_id },
      {
        status: 'CONFIRMED',
        paymentId: validatedData.razorpay_payment_id
      }
    )
    
    // Get the updated entries with user data
    const confirmedEntries = await Entry.find({ razorpayOrderId: validatedData.razorpay_order_id })
      .populate('userId')
    
    // Log payment verification for each entry
    for (const entry of confirmedEntries) {
      await PaymentLog.create({
        entryId: entry._id,
        razorpayOrderId: validatedData.razorpay_order_id,
        amount: entry.amount,
        status: 'SUCCESS',
        gatewayResponse: {
          razorpay_order_id: validatedData.razorpay_order_id,
          razorpay_payment_id: validatedData.razorpay_payment_id,
          razorpay_signature: validatedData.razorpay_signature,
          entryNumber: entry.entryNumber,
          totalEntries: entry.totalEntries
        }
      })
    }
    
    const tokens = confirmedEntries.map(entry => entry.token)
    const numberOfEntries = confirmedEntries.length
    
    return NextResponse.json({
      success: true,
      tokens: tokens,
      numberOfEntries: numberOfEntries,
      entries: confirmedEntries.map(entry => ({
        id: entry._id.toString(),
        token: entry.token,
        entryNumber: entry.entryNumber,
        user: {
          name: entry.userId.name,
          email: entry.userId.email
        }
      }))
    })
    
  } catch (error) {
    // Sanitized logging - no sensitive payment data
    console.error('Payment verification error:', {
      type: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message.substring(0, 100) : 'Unknown error',
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payment data' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}