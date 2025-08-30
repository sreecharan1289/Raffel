# Setup Guide - SoleDrop Raffle

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
MONGODB_URI=mongodb://localhost:27017/raffle-app
JWT_SECRET=your-super-secret-jwt-key-here
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup MongoDB

```bash
npm run setup
```

This will:
- Connect to MongoDB
- Create default admin user (admin / SecurePass123!)
- Create default raffle settings

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access the Application

- **Main App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Admin Login**: admin / SecurePass123!

## MongoDB Setup Options

### Option 1: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/raffle-app`

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/raffle-app`

### Option 3: Docker MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Razorpay Setup

1. Create account at [Razorpay](https://razorpay.com)
2. Get test API keys from dashboard
3. Update environment variables

## Features

- ✅ Raffle entry with payment
- ✅ Admin dashboard
- ✅ Winner selection
- ✅ Payment verification
- ✅ Demo mode for testing
- ✅ Multiple entries support
- ✅ Responsive design

## Troubleshooting

### MongoDB Connection Issues

- Check if MongoDB is running
- Verify connection string in `.env.local`
- Ensure network access (for cloud MongoDB)

### Payment Issues

- Verify Razorpay credentials
- Check if in demo mode (no real payments)
- Review payment logs in admin dashboard

### Admin Access Issues

- Default credentials: admin / SecurePass123!
- Create new admin: `npm run create-admin <username> <password>`
