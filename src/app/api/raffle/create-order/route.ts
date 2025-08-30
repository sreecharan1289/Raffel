import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '../../../../../lib/mongodb'
import { User, Entry, RaffleSettings, PaymentLog } from '../../../../../lib/models'
import { razorpay } from '../../../../../lib/razorpay'
import { userSchema, generateToken } from '../../../../../lib/validation'

const multipleEntrySchema = userSchema.extend({
    numberOfEntries: z.number().min(1).max(60).default(1)
})

export async function POST(request: NextRequest) {
    try {
        await connectDB()
        
        const body = await request.json()
        const validatedData = multipleEntrySchema.parse(body)
        const numberOfEntries = validatedData.numberOfEntries || 1

        const userData = {
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
            state: validatedData.state,
            pincode: validatedData.pincode
        }

        // Check if we're in demo mode
        const razorpayKey = process.env.RAZORPAY_KEY_ID
        const isDemoMode = !razorpayKey || razorpayKey === 'rzp_test_your_key_id_here'

        // Find or create user
        let user = await User.findOne({
            $or: [
                { email: userData.email },
                { phone: userData.phone }
            ]
        })

        if (!user) {
            user = await User.create(userData)
        } else {
            // Update existing user
            await User.findByIdAndUpdate(user._id, {
                name: userData.name,
                address: userData.address,
                state: userData.state,
                pincode: userData.pincode
            })
        }

        // Check raffle settings
        const settings = await RaffleSettings.findOne().sort({ createdAt: -1 })
        
        if (!settings?.isActive) {
            return NextResponse.json(
                { error: 'Raffle is not currently active' },
                { status: 400 }
            )
        }

        if (settings.endDate && new Date() > settings.endDate) {
            return NextResponse.json(
                { error: 'Raffle has ended' },
                { status: 400 }
            )
        }

        // Check max entries limit
        if (settings.maxEntries) {
            const entryCount = await Entry.countDocuments({ status: 'CONFIRMED' })
            if (entryCount >= settings.maxEntries) {
                return NextResponse.json(
                    { error: 'Maximum entries reached' },
                    { status: 400 }
                )
            }
        }

        const totalAmount = settings.entryPrice * numberOfEntries

        // Generate unique tokens
        const tokens: string[] = []
        for (let i = 1; i <= numberOfEntries; i++) {
            let token: string
            let tokenExists = true

            while (tokenExists) {
                token = generateToken(i)
                const existingEntry = await Entry.findOne({ token })
                tokenExists = !!existingEntry
            }
            tokens.push(token!)
        }

        if (isDemoMode) {
            // Demo mode - create entries directly as CONFIRMED
            const entries = []
            const demoPaymentId = `demo_${Date.now()}`

            for (let i = 0; i < numberOfEntries; i++) {
                const entry = await Entry.create({
                    userId: user._id,
                    token: tokens[i],
                    amount: settings.entryPrice,
                    status: 'CONFIRMED',
                    paymentId: `${demoPaymentId}_${i + 1}`,
                    entryNumber: i + 1,
                    totalEntries: numberOfEntries
                })
                entries.push(entry)

                // Log payment event
                await PaymentLog.create({
                    entryId: entry._id,
                    amount: settings.entryPrice,
                    status: 'SUCCESS',
                    gatewayResponse: {
                        mode: 'demo',
                        timestamp: Date.now(),
                        entryNumber: i + 1,
                        totalEntries: numberOfEntries
                    }
                })
            }

            return NextResponse.json({
                orderId: demoPaymentId,
                amount: totalAmount,
                currency: 'INR',
                tokens: tokens,
                entries: entries.map(e => ({ 
                    id: e._id.toString(), 
                    token: e.token, 
                    entryNumber: e.entryNumber 
                })),
                numberOfEntries: numberOfEntries,
                demoMode: true
            })
        }

        // Production mode - create Razorpay order
        const order = await razorpay.orders.create({
            amount: totalAmount,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: user._id.toString(),
                numberOfEntries: numberOfEntries,
                tokens: tokens.join(',')
            }
        })

        // Create entries in database
        const entries = []
        for (let i = 0; i < numberOfEntries; i++) {
            const entry = await Entry.create({
                userId: user._id,
                token: tokens[i],
                razorpayOrderId: order.id,
                amount: settings.entryPrice,
                status: 'PENDING',
                entryNumber: i + 1,
                totalEntries: numberOfEntries
            })
            entries.push(entry)

            // Log payment initiation
            await PaymentLog.create({
                entryId: entry._id,
                razorpayOrderId: order.id,
                amount: settings.entryPrice,
                status: 'INITIATED',
                gatewayResponse: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    entryNumber: i + 1,
                    totalEntries: numberOfEntries
                }
            })
        }

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            tokens: tokens,
            entries: entries.map(e => ({ 
                id: e._id.toString(), 
                token: e.token, 
                entryNumber: e.entryNumber 
            })),
            numberOfEntries: numberOfEntries
        })

    } catch (error) {
        console.error('Create order error:', {
            type: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message.substring(0, 100) : 'Unknown error',
            timestamp: new Date().toISOString()
        })

        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid input data' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Order creation failed' },
            { status: 500 }
        )
    }
}