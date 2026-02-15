const mongoose = require('mongoose');

const hotelBookingSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
  },
  hotelName: {
    type: String,
    required: true,
  },
  location: {
    city: String,
    country: String,
    address: String,
  },
  checkIn: {
    type: Date,
    required: true,
  },
  checkOut: {
    type: Date,
    required: true,
  },
  // Detailed hotel segments (multi‑hotel itineraries)
  stays: [
    {
      // Customer side
      hotelName: String,
      country: String,
      city: String,
      checkIn: Date,
      checkOut: Date,
      nights: Number,
      roomType: String,
      mealPlan: String,
      roomsBeds: Number,
      adults: Number,
      children: Number,

      // Selling side
      salePerNight: Number,
      saleAmount: Number, // total sale amount
      saleCurrency: String,
      saleRateOfExchange: Number,
      pkrTotalSelling: Number,

      // Buying side
      buyingPerNight: Number,
      buyingAmount: Number, // total buying amount
      buyingCurrency: String,
      buyingRateOfExchange: Number,
      pkrTotalBuying: Number,

      // Supplier side
      supplierConfirmationNumber: String,
      hotelConfirmationNumber: String,
      consultantName: String,

      // Result
      profit: Number,
      loss: Number,
      remarks: String,
    },
  ],
  rooms: [
    {
      roomType: String,
      numberOfRooms: {
        type: Number,
        default: 1,
      },
      numberOfGuests: {
        type: Number,
        default: 1,
      },
      pricePerNight: {
        type: Number,
        default: 0,
      },
      totalNights: {
        type: Number,
        default: 1,
      },
    },
  ],
  cost: {
    roomCharges: {
      type: Number,
      default: 0,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
  },
  supplierCost: {
    type: Number,
    default: 0,
  },
  totalDebit: {
    type: Number,
    default: 0,
  },
  totalCredit: {
    type: Number,
    default: 0,
  },
  anyReceivings: {
    type: Boolean,
    default: false,
  },
  profit: {
    type: Number,
    default: 0,
  },
  commission: {
    agent: {
      type: Number,
      default: 0,
    },
    staff: {
      type: Number,
      default: 0,
    },
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid',
  },
  cancellationPolicy: String,
  specialRequests: String,
  notes: String,
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

hotelBookingSchema.index({ bookingNumber: 1 });
hotelBookingSchema.index({ client: 1, checkIn: 1 });

module.exports = mongoose.model('HotelBooking', hotelBookingSchema);
