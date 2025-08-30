const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  process.exit(1)
}

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Create Admin model
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

async function createAdmin() {
    try {
        console.log('🔧 Creating secure admin user...');

        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get credentials from command line arguments
        const username = process.argv[2];
        const password = process.argv[3];

        if (!username || !password) {
            console.error('❌ Usage: node scripts/create-admin-simple.js <username> <password>');
            console.error('❌ Example: node scripts/create-admin-simple.js secure_admin SecurePass123!');
            process.exit(1);
        }

        if (username.length < 3) {
            console.error('❌ Username must be at least 3 characters');
            process.exit(1);
        }

        if (password.length < 8) {
            console.error('❌ Password must be at least 8 characters');
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', username);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const admin = await Admin.create({
            username,
            password: hashedPassword,
            isActive: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('Username:', username);
        console.log('Admin ID:', admin._id);
        console.log('⚠️  Store credentials securely - they are not saved in .env');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();