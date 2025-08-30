import mongoose from 'mongoose'

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

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema)
export const Entry = mongoose.models.Entry || mongoose.model('Entry', entrySchema)
export const Winner = mongoose.models.Winner || mongoose.model('Winner', winnerSchema)
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)
export const RaffleSettings = mongoose.models.RaffleSettings || mongoose.model('RaffleSettings', raffleSettingsSchema)
export const PaymentLog = mongoose.models.PaymentLog || mongoose.model('PaymentLog', paymentLogSchema)