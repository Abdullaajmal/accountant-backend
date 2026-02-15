const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  bookingDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  issuanceDate: {
    type: Date,
  },
  travelDate: {
    type: Date,
    required: true,
  },
  travelDateTime: Date, // Date and time combined
  returnDate: Date,
  returnDateTime: Date, // Date and time combined
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  package: {
    type: mongoose.Schema.ObjectId,
    ref: 'Package',
    autopopulate: true,
  },
  packageName: String,
  destination: String,
  travelers: [
    {
      name: String,
      age: Number,
      passport: String,
      contact: String,
    },
  ],
  // Ticket-related fields
  paxName: String, // Passenger name
  pnr: String, // Passenger Name Record
  ticketNumber: String,
  requiredTicketNumber: {
    type: Boolean,
    default: false,
  },
  airline: String,
  gds: String, // Global Distribution System
  sector: String, // Flight route
  segments: String, // Flight segments
  sectorType: {
    type: String,
    enum: ['DOMESTIC', 'INTERNATIONAL'],
    default: 'INTERNATIONAL',
  },
  basicFare: {
    type: Number,
    default: 0,
  },
  otherTaxes: [
    {
      taxName: String,
      taxAmount: Number,
    },
  ],
  pkrTotalSelling: {
    type: Number,
    default: 0,
  },
  charges: [
    {
      chargeName: String,
      chargeAmount: Number,
    },
  ],
  anyReceivings: {
    type: Boolean,
    default: false,
  },
  // Supplier-related fields
  issueFrom: {
    type: String,
    enum: ['GDS (Airline Stock)', 'Supplier', 'Other'],
    default: 'GDS (Airline Stock)',
  },
  consultantName: String,
  commissions: [
    {
      consultantName: String,
      commissionAmount: Number,
      commissionPercent: Number,
    },
  ],
  psfPercent: {
    type: Number,
    default: 0,
  },
  psfPkr: {
    type: Number,
    default: 0,
  },
  totalBuying: {
    type: Number,
    default: 0,
  },
  profit: {
    type: Number,
    default: 0,
  },
  loss: {
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
  numberOfTravelers: {
    type: Number,
    default: 1,
  },
  items: [
    {
      itemName: {
        type: String,
        required: true,
      },
      description: String,
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  subTotal: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxTotal: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  paymentStatus: {
    type: String,
    default: 'unpaid',
    enum: ['unpaid', 'paid', 'partially', 'refunded'],
  },
  bookingStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  },
  payment: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Payment',
    },
  ],
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
    autopopulate: true,
  },
  commission: {
    type: Number,
    default: 0,
  },
  notes: String,
  // Unified booking structure - supports flights, hotels, and cars
  bookingType: {
    type: String,
    enum: ['flight', 'hotel', 'car', 'package', 'combined'], // combined = multiple types
    default: 'flight',
  },
  // Flight bookings array (multiple flights can be booked)
  flights: [
    {
      // Flight details
      airline: String,
      flightNumber: String,
      pnr: String,
      ticketNumber: String,
      sector: String, // Route (e.g., "ISB-DXB")
      sectorType: {
        type: String,
        enum: ['DOMESTIC', 'INTERNATIONAL'],
        default: 'INTERNATIONAL',
      },
      departureDate: Date,
      departureTime: String,
      departureAirport: String,
      arrivalDate: Date,
      arrivalTime: String,
      arrivalAirport: String,
      class: String, // Economy, Business, First
      gds: String, // Global Distribution System
      segments: String,
      
      // Passenger details
      paxName: String,
      numberOfTravelers: Number,
      
      // Pricing
      basicFare: Number,
      taxes: Number,
      charges: Number,
      totalSelling: Number,
      sellingCurrency: String,
      totalBuying: Number,
      buyingCurrency: String,
      profit: Number,
      loss: Number,
      
      // Supplier details
      supplier: {
        type: mongoose.Schema.ObjectId,
        ref: 'Supplier',
      },
      supplierConfirmationNumber: String,
      issueFrom: {
        type: String,
        enum: ['GDS (Airline Stock)', 'Supplier', 'Other'],
        default: 'GDS (Airline Stock)',
      },
      
      // Commission
      consultantName: String,
      commissionAmount: Number,
      commissionPercent: Number,
      
      remarks: String,
    },
  ],
  // Hotel bookings array (multiple hotels can be booked)
  hotels: [
    {
      hotelName: String,
      location: {
        city: String,
        country: String,
        address: String,
      },
      checkIn: Date,
      checkOut: Date,
      nights: Number,
      roomType: String,
      mealPlan: String,
      numberOfRooms: Number,
      numberOfGuests: Number,
      
      // Pricing
      salePerNight: Number,
      saleAmount: Number,
      saleCurrency: String,
      buyingPerNight: Number,
      buyingAmount: Number,
      buyingCurrency: String,
      taxes: Number,
      serviceCharge: Number,
      profit: Number,
      loss: Number,
      
      // Supplier details
      supplier: {
        type: mongoose.Schema.ObjectId,
        ref: 'Supplier',
      },
      supplierConfirmationNumber: String,
      hotelConfirmationNumber: String,
      
      // Commission
      consultantName: String,
      commissionAmount: Number,
      
      remarks: String,
    },
  ],
  // Car rental bookings array
  cars: [
    {
      carType: String, // Sedan, SUV, Luxury, etc.
      carModel: String,
      pickupLocation: String,
      dropoffLocation: String,
      pickupDate: Date,
      pickupTime: String,
      dropoffDate: Date,
      dropoffTime: String,
      numberOfDays: Number,
      
      // Pricing
      salePerDay: Number,
      saleAmount: Number,
      saleCurrency: String,
      buyingPerDay: Number,
      buyingAmount: Number,
      buyingCurrency: String,
      insurance: Number,
      taxes: Number,
      profit: Number,
      loss: Number,
      
      // Supplier details
      supplier: {
        type: mongoose.Schema.ObjectId,
        ref: 'Supplier',
      },
      supplierConfirmationNumber: String,
      rentalConfirmationNumber: String,
      
      // Commission
      consultantName: String,
      commissionAmount: Number,
      
      remarks: String,
    },
  ],
  documents: [
    {
      documentType: {
        type: String,
        enum: ['passport', 'visa', 'ticket', 'insurance', 'other'],
      },
      documentNumber: String,
      issueDate: Date,
      expiryDate: Date,
      file: {
        id: String,
        name: String,
        path: String,
        description: String,
      },
    },
  ],
  files: [
    {
      id: String,
      name: String,
      path: String,
      description: String,
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
  ],
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

bookingSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Booking', bookingSchema);
