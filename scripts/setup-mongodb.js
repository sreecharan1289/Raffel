const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  process.exit(1)
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
}, { timestamps: true })

// Entry Schema
const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], default: 'PENDING' },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  entryNumber: { type: Number, default: 1 },
  totalEntries: { type: Number, default: 1 },
}, { timestamps: true })

// Winner Schema
const winnerSchema = new mongoose.Schema({
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry', required: true },
  announcedAt: { type: Date, default: Date.now },
}, { timestamps: true })

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Raffle Settings Schema
const raffleSettingsSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: true },
  entryPrice: { type: Number, default: 10000 }, // in paise (₹100)
  maxEntries: { type: Number, default: null },
  endDate: { type: Date, default: null },
}, { timestamps: true })

// Payment Log Schema
const paymentLogSchema = new mongoose.Schema({
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entry' },
  razorpayOrderId: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema)
const Entry = mongoose.models.Entry || mongoose.model('Entry', entrySchema)
const Winner = mongoose.models.Winner || mongoose.model('Winner', winnerSchema)
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)
const RaffleSettings = mongoose.models.RaffleSettings || mongoose.model('RaffleSettings', raffleSettingsSchema)
const PaymentLog = mongoose.models.PaymentLog || mongoose.model('PaymentLog', paymentLogSchema)

async function setupMongoDB() {
  try {
    console.log('🚀 Setting up MongoDB...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Create default admin user
    const hashedPassword = await bcrypt.hash('SecurePass123!', 12)
    
    const adminExists = await Admin.findOne({ username: 'admin' })
    if (!adminExists) {
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        isActive: true
      })
      console.log('✅ Admin user created: admin / SecurePass123!')
    } else {
      console.log('ℹ️  Admin user already exists')
    }

    // Create default raffle settings
    const settingsExist = await RaffleSettings.findOne()
    if (!settingsExist) {
      await RaffleSettings.create({
        isActive: true,
        entryPrice: 10000, // ₹100 in paise
        maxEntries: null,
        endDate: null
      })
      console.log('✅ Raffle settings created')
    } else {
      console.log('ℹ️  Raffle settings already exist')
    }

    console.log('\n🎉 MongoDB setup complete!')
    console.log('📊 Admin Login: admin / SecurePass123!')
    console.log('🌐 Access admin panel at: http://localhost:3000/admin')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

setupMongoDB()