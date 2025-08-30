import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import { Winner } from '../../../../../lib/models'
import { verifyToken } from '../../../../../lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
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
    
    // Delete all winners
    await Winner.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: 'Winner cleared successfully'
    })
    
  } catch (error) {
    console.error('Clear winner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}