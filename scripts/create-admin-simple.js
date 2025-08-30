const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔧 Creating secure admin user...');

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
        const existingAdmin = await prisma.admin.findUnique({
            where: { username }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:', username);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const admin = await prisma.admin.create({
            data: {
                username,
                password: hashedPassword
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('Username:', username);
        console.log('Admin ID:', admin.id);
        console.log('⚠️  Store credentials securely - they are not saved in .env');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();