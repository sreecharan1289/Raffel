import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import { Winner, Entry } from '../../../../../lib/models'
import { verifyToken } from '../../../../../lib/auth'

export async function POST(request: NextRequest) {
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
    
    // Check if winner already exists
    const existingWinner = await Winner.findOne()
    if (existingWinner) {
      return NextResponse.json(
        { error: 'Winner already selected' },
        { status: 400 }
      )
    }
    
    // Get all confirmed entries
    const confirmedEntries = await Entry.find({ status: 'CONFIRMED' })
      .populate('userId')
    
    console.log(`Found ${confirmedEntries.length} confirmed entries eligible for winner selection`)
    
    if (confirmedEntries.length === 0) {
      return NextResponse.json(
        { 
          error: 'No eligible entries found for winner selection.',
          details: 'Only entries with CONFIRMED payment status are eligible. Check that users have completed their payments successfully.'
        },
        { status: 400 }
      )
    }
    
    // Select random winner
    const randomIndex = Math.floor(Math.random() * confirmedEntries.length)
    const winningEntry = confirmedEntries[randomIndex]
    
    // Create winner record
    const winner = await Winner.create({
      entryId: winningEntry._id
    })
    
    await winner.populate({
      path: 'entryId',
      populate: { path: 'userId' }
    })
    
    return NextResponse.json({
      success: true,
      winner: {
        name: winner.entryId.userId.name,
        token: winner.entryId.token,
        email: winner.entryId.userId.email,
        phone: winner.entryId.userId.phone,
        address: winner.entryId.userId.address,
        state: winner.entryId.userId.state,
        pincode: winner.entryId.userId.pincode
      }
    })
    
  } catch (error) {
    console.error('Select winner error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}