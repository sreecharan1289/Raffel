import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import { Entry, Winner, User } from '../../../../../lib/models'
import { verifyToken } from '../../../../../lib/auth'

export async function GET(request: NextRequest) {
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
    
    // Get dashboard data
    const [
      totalEntries,
      confirmedEntries,
      pendingEntries,
      failedEntries,
      totalRevenue,
      currentWinner,
      recentEntries,
      eligibleEntries
    ] = await Promise.all([
      Entry.countDocuments(),
      Entry.countDocuments({ status: 'CONFIRMED' }),
      Entry.countDocuments({ status: 'PENDING' }),
      Entry.countDocuments({ status: 'FAILED' }),
      Entry.aggregate([
        { $match: { status: 'CONFIRMED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Winner.findOne()
        .populate({
          path: 'entryId',
          populate: { path: 'userId' }
        })
        .sort({ createdAt: -1 }),
      Entry.find()
        .populate('userId')
        .sort({ createdAt: -1 })
        .limit(50)
        .select('token status amount createdAt userId'),
      Entry.find({ status: 'CONFIRMED' })
        .populate('userId')
        .sort({ createdAt: -1 })
        .limit(20)
        .select('token createdAt userId')
    ])
    
    return NextResponse.json({
      stats: {
        totalEntries,
        confirmedEntries,
        pendingEntries,
        failedEntries,
        totalRevenue: totalRevenue[0]?.total || 0,
        eligibleForDraw: confirmedEntries
      },
      currentWinner,
      recentEntries,
      eligibleEntries
    })
    
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}