# SoleDrop Raffle - Next.js Application

A modern raffle application built with Next.js, MongoDB, and Razorpay payment integration.

## Features

- 🎯 **Raffle Entry System**: Simple form-based entry with user information capture
- 💳 **Payment Integration**: Secure payment processing with Razorpay
- 🎫 **Token Generation**: Unique raffle tokens for each entry
- 👑 **Admin Dashboard**: Complete admin panel for managing raffles and selecting winners
- 📊 **Analytics**: Real-time statistics and participant tracking
- 🔐 **Authentication**: Secure admin login system
- 📱 **Responsive Design**: Mobile-first design with modern UI

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: MongoDB with Mongoose ODM
- **Payment**: Razorpay Integration
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schema validation

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin API endpoints
│   │   │   ├── raffle/        # Raffle API endpoints
│   │   │   └── winner/        # Winner API endpoints
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── login/             # Admin login page
│   │   └── success/           # Payment success page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── Header.tsx        # Site header
│   │   ├── Footer.tsx        # Site footer
│   │   ├── RaffleForm.tsx    # Main raffle entry form
│   │   └── AdminDashboard.tsx # Admin dashboard component
│   └── hooks/                # Custom React hooks
├── lib/                      # Utility libraries
│   ├── mongodb.ts           # MongoDB connection
│   ├── models.ts            # Mongoose schemas
│   ├── auth.ts              # Authentication utilities
│   ├── razorpay.ts          # Razorpay configuration
│   └── validation.ts        # Zod validation schemas
├── scripts/                 # Setup and utility scripts
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd raffle-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/raffle-app
   JWT_SECRET=your-super-secret-jwt-key-here
   RAZORPAY_KEY_ID=rzp_test_your_key_id_here
   RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
   ```

4. **Set up MongoDB**
   ```bash
   npm run setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main app: http://localhost:3000
   - Admin panel: http://localhost:3000/admin
   - Admin login: admin / SecurePass123!

## API Endpoints

### Raffle Endpoints
- `POST /api/raffle/create-order` - Create payment order
- `POST /api/raffle/verify-payment` - Verify payment
- `POST /api/raffle/demo-payment` - Demo payment (for testing)

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard` - Dashboard data
- `POST /api/admin/select-winner` - Select raffle winner
- `POST /api/admin/clear-winner` - Clear current winner
- `POST /api/admin/reconcile-payments` - Reconcile payments

### Public Endpoints
- `GET /api/winner` - Get current winner

## Database Models

- **User**: Participant information
- **Entry**: Raffle entries with tokens
- **Winner**: Selected winners
- **Admin**: Admin user accounts
- **RaffleSettings**: Raffle configuration
- **PaymentLog**: Payment transaction logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
