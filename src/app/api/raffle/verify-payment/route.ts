import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { verifyRazorpaySignature } from '../../../../../lib/razorpay'
import { paymentVerificationSchema } from '../../../../../lib/validation'
import { logPaymentEvent } from '../../../../../lib/payment-logger'

export async function POST(request: NextRequest) {
  try {
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
    const entries = await prisma.entry.findMany({
      where: { razorpayOrderId: validatedData.razorpay_order_id },
      include: { user: true }
    })
    
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries not found' },
        { status: 404 }
      )
    }
    
    // Update all entries status
    const updatedEntries = await prisma.entry.updateMany({
      where: { razorpayOrderId: validatedData.razorpay_order_id },
      data: {
        status: 'CONFIRMED',
        paymentId: validatedData.razorpay_payment_id
      }
    })
    
    // Get the updated entries with user data
    const confirmedEntries = await prisma.entry.findMany({
      where: { razorpayOrderId: validatedData.razorpay_order_id },
      include: { user: true }
    })
    
    // Log payment verification for each entry
    for (const entry of confirmedEntries) {
      await logPaymentEvent({
        entryId: entry.id,
        razorpayOrderId: validatedData.razorpay_order_id,
        razorpayPaymentId: validatedData.razorpay_payment_id,
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
        id: entry.id,
        token: entry.token,
        entryNumber: entry.entryNumber,
        user: {
          name: entry.user.name,
          email: entry.user.email
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