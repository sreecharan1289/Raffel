import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { Winner } from '../../../../lib/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get current winner
    const winner = await Winner.findOne()
      .populate({
        path: 'entryId',
        populate: { path: 'userId' }
      })
      .sort({ createdAt: -1 })
    
    if (!winner) {
      return NextResponse.json({ winner: null })
    }
    
    return NextResponse.json({
      winner: {
        name: winner.entryId.userId.name,
        token: winner.entryId.token
      }
    })
    
  } catch (error) {
    console.error('Get winner error:', error)
    return NextResponse.json({ winner: null })
  }
}