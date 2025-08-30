const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Import models
const connectDB = require('../lib/mongodb.ts').default
const { Admin, RaffleSettings } = require('../lib/models.ts')

async function setupMongoDB() {
  try {
    console.log('🚀 Setting up MongoDB...')
    
    // Connect to MongoDB
    await connectDB()
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
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

setupMongoDB()