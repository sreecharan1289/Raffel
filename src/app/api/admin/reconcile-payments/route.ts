import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../../lib/auth'
import { reconcilePayments } from '../../../../../lib/payment-logger'

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    console.log('Starting payment reconciliation...')
    const reconciliationReport = await reconcilePayments()
    
    console.log('Reconciliation completed:', reconciliationReport)
    
    return NextResponse.json({
      success: true,
      report: reconciliationReport,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Payment reconciliation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}