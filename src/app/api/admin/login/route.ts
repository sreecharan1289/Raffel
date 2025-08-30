import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '../../../../../lib/mongodb'
import { Admin } from '../../../../../lib/models'
import { generateToken } from '../../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find admin user
    const admin = await Admin.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({ 
      adminId: admin._id.toString(), 
      username: admin.username 
    })

    return NextResponse.json({
      token,
      admin: {
        id: admin._id.toString(),
        username: admin.username
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}