const mongoose = require('mongoose');
const Model = mongoose.model('Booking');
const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');

const create = async (req, res) => {
  try {
    let body = req.body;
    
    console.log('📥 Received booking data (RAW):', JSON.stringify({
      hasClient: !!body.client,
      client: body.client,
      hasTravelDate: !!body.travelDate,
      travelDate: body.travelDate,
      travelDateType: typeof body.travelDate,
      hasTravelDateTime: !!body.travelDateTime,
      travelDateTime: body.travelDateTime,
      hasBookingDate: !!body.bookingDate,
      bookingDate: body.bookingDate,
      bookingDateType: typeof body.bookingDate,
      hasItems: !!body.items,
      itemsCount: body.items ? body.items.length : 0,
      allKeys: Object.keys(body),
    }, null, 2));

    // Generate booking number FIRST
    const year = new Date().getFullYear();
    let bookingNumber;
    try {
      const lastBooking = await Model.findOne({
        bookingNumber: new RegExp(`^BK-${year}-`),
      })
        .sort({ bookingNumber: -1 })
        .exec();

      if (lastBooking) {
        const lastNum = parseInt(lastBooking.bookingNumber.split('-')[2]) || 0;
        bookingNumber = `BK-${year}-${String(lastNum + 1).padStart(5, '0')}`;
      } else {
        bookingNumber = `BK-${year}-00001`;
      }
    } catch (error) {
      console.error('Error generating booking number:', error);
      bookingNumber = `BK-${year}-${Date.now().toString().slice(-5)}`;
    }
    
    console.log('✅ Generated bookingNumber:', bookingNumber);
    
    // Set bookingNumber - CRITICAL: Must be set before any other operations
    body.bookingNumber = String(bookingNumber).trim();
    body.createdBy = req.admin._id;
    
    // Verify bookingNumber is set
    if (!body.bookingNumber || body.bookingNumber.trim() === '') {
      console.error('❌ CRITICAL: bookingNumber is empty after setting!');
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Failed to generate booking number',
      });
    }
    
    console.log('✅ bookingNumber set in body:', body.bookingNumber);

    // Validate required fields
    if (!body.client) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Client is required',
      });
    }

    // Convert travelDate from travelDateTime if needed
    if (body.travelDateTime && !body.travelDate) {
      try {
        const travelDateTime = typeof body.travelDateTime === 'string' 
          ? new Date(body.travelDateTime) 
          : new Date(body.travelDateTime);
        body.travelDate = new Date(travelDateTime);
        body.travelDate.setHours(0, 0, 0, 0);
      } catch (error) {
        console.error('Error parsing travelDateTime:', error);
      }
    }

    // Auto-detect travelDate from flights/hotels/cars if not provided
    if (!body.travelDate) {
      const dates = [];
      
      // Check flights for departureDate
      if (body.flights && Array.isArray(body.flights) && body.flights.length > 0) {
        body.flights.forEach(flight => {
          if (flight.departureDate) {
            try {
              const date = new Date(flight.departureDate);
              if (!isNaN(date.getTime())) {
                dates.push(date);
              }
            } catch (e) {
              console.error('Error parsing flight departureDate:', e);
            }
          }
        });
      }
      
      // Check hotels for checkIn
      if (body.hotels && Array.isArray(body.hotels) && body.hotels.length > 0) {
        body.hotels.forEach(hotel => {
          if (hotel.checkIn) {
            try {
              const date = new Date(hotel.checkIn);
              if (!isNaN(date.getTime())) {
                dates.push(date);
              }
            } catch (e) {
              console.error('Error parsing hotel checkIn:', e);
            }
          }
        });
      }
      
      // Check cars for pickupDate
      if (body.cars && Array.isArray(body.cars) && body.cars.length > 0) {
        body.cars.forEach(car => {
          if (car.pickupDate) {
            try {
              const date = new Date(car.pickupDate);
              if (!isNaN(date.getTime())) {
                dates.push(date);
              }
            } catch (e) {
              console.error('Error parsing car pickupDate:', e);
            }
          }
        });
      }
      
      // Use earliest date found, or bookingDate, or current date
      if (dates.length > 0) {
        dates.sort((a, b) => a - b);
        body.travelDate = dates[0];
        console.log('✅ Auto-detected travelDate from bookings:', body.travelDate);
      } else if (body.bookingDate) {
        try {
          body.travelDate = new Date(body.bookingDate);
          console.log('✅ Using bookingDate as travelDate:', body.travelDate);
        } catch (e) {
          console.error('Error parsing bookingDate:', e);
        }
      } else {
        body.travelDate = new Date();
        console.log('✅ Using current date as travelDate:', body.travelDate);
      }
    }

    // Client validation moved below after date processing

    // Convert client to ObjectId if it's a string
    let clientId;
    if (typeof body.client === 'string') {
      if (!mongoose.Types.ObjectId.isValid(body.client)) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid client ID',
        });
      }
      clientId = new mongoose.Types.ObjectId(body.client);
    } else if (body.client && body.client._id) {
      clientId = new mongoose.Types.ObjectId(body.client._id);
    } else {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Client is required',
      });
    }

    // Convert travelDate to Date object - handle various formats
    let travelDateObj;
    if (body.travelDate) {
      try {
        // Handle ISO string, Date object, or other formats
        if (body.travelDate instanceof Date) {
          travelDateObj = new Date(body.travelDate);
        } else if (typeof body.travelDate === 'string') {
          travelDateObj = new Date(body.travelDate);
        } else if (body.travelDate && typeof body.travelDate === 'object' && body.travelDate.$d) {
          // Handle dayjs object if somehow it reaches backend
          travelDateObj = new Date(body.travelDate.$d);
        } else {
          travelDateObj = new Date(body.travelDate);
        }
        
        if (isNaN(travelDateObj.getTime())) {
          console.error('❌ Invalid travelDate value:', body.travelDate, 'Type:', typeof body.travelDate);
          return res.status(400).json({
            success: false,
            result: null,
            message: 'Invalid travel date format',
          });
        }
        console.log('✅ Parsed travelDate:', travelDateObj);
      } catch (error) {
        console.error('❌ Error parsing travelDate:', error, 'Value:', body.travelDate);
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Error processing travel date: ' + error.message,
        });
      }
    } else {
      console.error('❌ travelDate is missing from request body');
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Travel date is required',
      });
    }

    // Convert bookingDate to Date object
    let bookingDateObj;
    if (body.bookingDate) {
      try {
        if (typeof body.bookingDate === 'string') {
          bookingDateObj = new Date(body.bookingDate);
        } else if (body.bookingDate instanceof Date) {
          bookingDateObj = body.bookingDate;
        } else if (body.bookingDate && typeof body.bookingDate === 'object' && body.bookingDate.$d) {
          // Handle dayjs object if somehow it reaches backend
          bookingDateObj = new Date(body.bookingDate.$d);
        } else {
          bookingDateObj = new Date(body.bookingDate);
        }
        
        if (isNaN(bookingDateObj.getTime())) {
          console.error('❌ Invalid bookingDate, using current date');
          bookingDateObj = new Date();
        }
        console.log('✅ Parsed bookingDate:', bookingDateObj);
      } catch (error) {
        console.error('❌ Error parsing bookingDate:', error, 'Using current date');
        bookingDateObj = new Date();
      }
    } else {
      console.log('⚠️ bookingDate not provided, using current date');
      bookingDateObj = new Date();
    }

    // Process items and calculate totals
    const { items = [], taxRate = 0, discount = 0 } = body;
    let subTotal = 0;
    let taxTotal = 0;
    let total = 0;

    console.log('📦 Processing items:', {
      itemsType: typeof items,
      isArray: Array.isArray(items),
      itemsLength: items ? items.length : 0,
      items: items,
    });

    // Filter and process valid items
    const validItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      items.forEach((item, index) => {
        console.log(`📦 Processing item ${index}:`, item);
        if (item && item.itemName && item.itemName.trim() !== '' && 
            item.price !== undefined && item.price !== null && !isNaN(item.price) && item.price >= 0) {
          const quantity = item.quantity || 1;
          let itemTotal = calculate.multiply(quantity, item.price);
          subTotal = calculate.add(subTotal, itemTotal);
          validItems.push({
            itemName: item.itemName.trim(),
            description: item.description || '',
            quantity: quantity,
            price: Number(item.price),
            total: itemTotal,
          });
        } else {
          console.log(`⚠️ Skipping invalid item ${index}:`, item);
        }
      });
    } else {
      console.log('⚠️ No items provided or items array is empty');
    }

    console.log('💰 Totals calculation:', {
      validItemsCount: validItems.length,
      subTotal: subTotal,
      taxRate: taxRate,
      discount: discount,
    });

    taxTotal = calculate.multiply(subTotal, taxRate / 100);
    total = calculate.add(subTotal, taxTotal);
    total = calculate.sub(total, discount);

    if (total < 0) {
      total = 0;
    }

    // Ensure total is set (required field)
    if (total === undefined || total === null || isNaN(total)) {
      console.log('⚠️ Total is invalid, setting to 0');
      total = 0;
    }

    console.log('✅ Final totals:', {
      subTotal: subTotal,
      taxTotal: taxTotal,
      total: total,
    });

    console.log('✅ Final data before creating Model:', {
      bookingNumber: bookingNumber,
      bookingNumberType: typeof bookingNumber,
      bookingNumberLength: String(bookingNumber).length,
      client: clientId,
      travelDate: travelDateObj,
      bookingDate: bookingDateObj,
      total: total,
      itemsCount: validItems.length,
    });

    // Create Model instance with ALL required fields at once
    // This ensures Mongoose validation passes
    const bookingDoc = new Model({
      bookingNumber: String(bookingNumber).trim(), // REQUIRED - must be set here
      bookingDate: bookingDateObj, // REQUIRED
      travelDate: travelDateObj, // REQUIRED
      client: clientId, // REQUIRED
      total: total, // REQUIRED
      subTotal: subTotal,
      taxTotal: taxTotal,
      taxRate: taxRate || 0,
      discount: discount || 0,
      items: validItems,
      createdBy: req.admin._id,
    });

    // Determine booking type based on what's provided
    let bookingType = 'flight'; // default
    if (body.bookingType) {
      bookingType = body.bookingType;
    } else {
      // Auto-detect booking type
      if (body.flights && body.flights.length > 0) {
        if (body.hotels && body.hotels.length > 0 || body.cars && body.cars.length > 0) {
          bookingType = 'combined';
        } else {
          bookingType = 'flight';
        }
      } else if (body.hotels && body.hotels.length > 0) {
        if (body.cars && body.cars.length > 0) {
          bookingType = 'combined';
        } else {
          bookingType = 'hotel';
        }
      } else if (body.cars && body.cars.length > 0) {
        bookingType = 'car';
      }
    }
    bookingDoc.bookingType = bookingType;

    // Handle flights array
    if (body.flights && Array.isArray(body.flights) && body.flights.length > 0) {
      bookingDoc.flights = body.flights.map(flight => ({
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        pnr: flight.pnr,
        ticketNumber: flight.ticketNumber,
        sector: flight.sector,
        sectorType: flight.sectorType || 'INTERNATIONAL',
        departureDate: flight.departureDate ? new Date(flight.departureDate) : undefined,
        departureTime: flight.departureTime,
        departureAirport: flight.departureAirport,
        arrivalDate: flight.arrivalDate ? new Date(flight.arrivalDate) : undefined,
        arrivalTime: flight.arrivalTime,
        arrivalAirport: flight.arrivalAirport,
        class: flight.class,
        gds: flight.gds,
        segments: flight.segments,
        paxName: flight.paxName,
        numberOfTravelers: flight.numberOfTravelers || 1,
        basicFare: flight.basicFare || 0,
        taxes: flight.taxes || 0,
        charges: flight.charges || 0,
        totalSelling: flight.totalSelling || 0,
        sellingCurrency: flight.sellingCurrency || 'USD',
        totalBuying: flight.totalBuying || 0,
        buyingCurrency: flight.buyingCurrency || 'USD',
        profit: flight.profit || 0,
        loss: flight.loss || 0,
        supplier: flight.supplier,
        supplierConfirmationNumber: flight.supplierConfirmationNumber,
        issueFrom: flight.issueFrom || 'GDS (Airline Stock)',
        consultantName: flight.consultantName,
        commissionAmount: flight.commissionAmount || 0,
        commissionPercent: flight.commissionPercent || 0,
        remarks: flight.remarks,
      }));
      
      // Calculate totals from flights
      let flightsTotalSelling = 0;
      let flightsTotalBuying = 0;
      bookingDoc.flights.forEach(flight => {
        flightsTotalSelling += flight.totalSelling || 0;
        flightsTotalBuying += flight.totalBuying || 0;
      });
      total = calculate.add(total, flightsTotalSelling);
      bookingDoc.totalBuying = calculate.add(bookingDoc.totalBuying || 0, flightsTotalBuying);
    }

    // Handle hotels array
    if (body.hotels && Array.isArray(body.hotels) && body.hotels.length > 0) {
      bookingDoc.hotels = body.hotels.map(hotel => ({
        hotelName: hotel.hotelName,
        location: hotel.location || { city: hotel.city, country: hotel.country, address: hotel.address },
        checkIn: hotel.checkIn ? new Date(hotel.checkIn) : undefined,
        checkOut: hotel.checkOut ? new Date(hotel.checkOut) : undefined,
        nights: hotel.nights || 0,
        roomType: hotel.roomType,
        mealPlan: hotel.mealPlan,
        numberOfRooms: hotel.numberOfRooms || 1,
        numberOfGuests: hotel.numberOfGuests || 1,
        salePerNight: hotel.salePerNight || 0,
        saleAmount: hotel.saleAmount || 0,
        saleCurrency: hotel.saleCurrency || 'USD',
        buyingPerNight: hotel.buyingPerNight || 0,
        buyingAmount: hotel.buyingAmount || 0,
        buyingCurrency: hotel.buyingCurrency || 'USD',
        taxes: hotel.taxes || 0,
        serviceCharge: hotel.serviceCharge || 0,
        profit: hotel.profit || 0,
        loss: hotel.loss || 0,
        supplier: hotel.supplier,
        supplierConfirmationNumber: hotel.supplierConfirmationNumber,
        hotelConfirmationNumber: hotel.hotelConfirmationNumber,
        consultantName: hotel.consultantName,
        commissionAmount: hotel.commissionAmount || 0,
        remarks: hotel.remarks,
      }));
      
      // Hotels totals will be calculated later in final calculation
    }

    // Handle cars array
    if (body.cars && Array.isArray(body.cars) && body.cars.length > 0) {
      bookingDoc.cars = body.cars.map(car => ({
        carType: car.carType,
        carModel: car.carModel,
        pickupLocation: car.pickupLocation,
        dropoffLocation: car.dropoffLocation,
        pickupDate: car.pickupDate ? new Date(car.pickupDate) : undefined,
        pickupTime: car.pickupTime,
        dropoffDate: car.dropoffDate ? new Date(car.dropoffDate) : undefined,
        dropoffTime: car.dropoffTime,
        numberOfDays: car.numberOfDays || 1,
        salePerDay: car.salePerDay || 0,
        saleAmount: car.saleAmount || 0,
        saleCurrency: car.saleCurrency || 'USD',
        buyingPerDay: car.buyingPerDay || 0,
        buyingAmount: car.buyingAmount || 0,
        buyingCurrency: car.buyingCurrency || 'USD',
        insurance: car.insurance || 0,
        taxes: car.taxes || 0,
        profit: car.profit || 0,
        loss: car.loss || 0,
        supplier: car.supplier,
        supplierConfirmationNumber: car.supplierConfirmationNumber,
        rentalConfirmationNumber: car.rentalConfirmationNumber,
        consultantName: car.consultantName,
        commissionAmount: car.commissionAmount || 0,
        remarks: car.remarks,
      }));
      
      // Cars totals will be calculated later in final calculation
    }

    // Recalculate total profit/loss
    // Total should include items subtotal + flights + hotels + cars
    const finalTotal = calculate.add(subTotal, taxTotal);
    const finalTotalAfterDiscount = calculate.sub(finalTotal, discount || 0);
    
    // Add totals from flights, hotels, and cars
    let additionalTotal = 0;
    if (bookingDoc.flights && bookingDoc.flights.length > 0) {
      bookingDoc.flights.forEach(flight => {
        additionalTotal = calculate.add(additionalTotal, flight.totalSelling || 0);
      });
    }
    if (bookingDoc.hotels && bookingDoc.hotels.length > 0) {
      bookingDoc.hotels.forEach(hotel => {
        additionalTotal = calculate.add(additionalTotal, hotel.saleAmount || 0);
      });
    }
    if (bookingDoc.cars && bookingDoc.cars.length > 0) {
      bookingDoc.cars.forEach(car => {
        additionalTotal = calculate.add(additionalTotal, car.saleAmount || 0);
      });
    }
    
    bookingDoc.total = calculate.add(finalTotalAfterDiscount, additionalTotal);
    
    // Calculate total buying
    let totalBuyingAmount = bookingDoc.totalBuying || 0;
    if (bookingDoc.flights && bookingDoc.flights.length > 0) {
      bookingDoc.flights.forEach(flight => {
        totalBuyingAmount = calculate.add(totalBuyingAmount, flight.totalBuying || 0);
      });
    }
    if (bookingDoc.hotels && bookingDoc.hotels.length > 0) {
      bookingDoc.hotels.forEach(hotel => {
        totalBuyingAmount = calculate.add(totalBuyingAmount, hotel.buyingAmount || 0);
      });
    }
    if (bookingDoc.cars && bookingDoc.cars.length > 0) {
      bookingDoc.cars.forEach(car => {
        totalBuyingAmount = calculate.add(totalBuyingAmount, car.buyingAmount || 0);
      });
    }
    bookingDoc.totalBuying = totalBuyingAmount;
    
    // Calculate profit/loss
    bookingDoc.profit = calculate.sub(bookingDoc.total, bookingDoc.totalBuying);
    if (bookingDoc.profit < 0) {
      bookingDoc.loss = Math.abs(bookingDoc.profit);
      bookingDoc.profit = 0;
    } else {
      bookingDoc.loss = 0;
    }

    // Set optional fields (backward compatibility with old flight booking structure)
    if (body.travelDateTime) bookingDoc.travelDateTime = body.travelDateTime instanceof Date ? body.travelDateTime : new Date(body.travelDateTime);
    if (body.returnDate) bookingDoc.returnDate = body.returnDate instanceof Date ? body.returnDate : new Date(body.returnDate);
    if (body.returnDateTime) bookingDoc.returnDateTime = body.returnDateTime instanceof Date ? body.returnDateTime : new Date(body.returnDateTime);
    if (body.issuanceDate) bookingDoc.issuanceDate = body.issuanceDate instanceof Date ? body.issuanceDate : new Date(body.issuanceDate);
    if (body.paxName) bookingDoc.paxName = body.paxName;
    if (body.pnr) bookingDoc.pnr = body.pnr;
    if (body.ticketNumber) bookingDoc.ticketNumber = body.ticketNumber;
    if (body.requiredTicketNumber !== undefined) bookingDoc.requiredTicketNumber = body.requiredTicketNumber;
    if (body.airline) bookingDoc.airline = body.airline;
    if (body.gds) bookingDoc.gds = body.gds;
    if (body.sector) bookingDoc.sector = body.sector;
    if (body.segments) bookingDoc.segments = body.segments;
    if (body.sectorType) bookingDoc.sectorType = body.sectorType;
    if (body.basicFare !== undefined) bookingDoc.basicFare = body.basicFare;
    if (body.otherTaxes) bookingDoc.otherTaxes = body.otherTaxes;
    if (body.charges) bookingDoc.charges = body.charges;
    if (body.pkrTotalSelling !== undefined) bookingDoc.pkrTotalSelling = body.pkrTotalSelling;
    if (body.anyReceivings !== undefined) bookingDoc.anyReceivings = body.anyReceivings;
    if (body.issueFrom) bookingDoc.issueFrom = body.issueFrom;
    if (body.consultantName) bookingDoc.consultantName = body.consultantName;
    if (body.commissions) bookingDoc.commissions = body.commissions;
    if (body.psfPercent !== undefined) bookingDoc.psfPercent = body.psfPercent;
    if (body.psfPkr !== undefined) bookingDoc.psfPkr = body.psfPkr;
    if (body.remarks) bookingDoc.remarks = body.remarks;
    if (body.supplier) {
      if (typeof body.supplier === 'string' && mongoose.Types.ObjectId.isValid(body.supplier)) {
        bookingDoc.supplier = new mongoose.Types.ObjectId(body.supplier);
      } else if (body.supplier && body.supplier._id) {
        bookingDoc.supplier = new mongoose.Types.ObjectId(body.supplier._id);
      } else {
        bookingDoc.supplier = body.supplier;
      }
    }
    if (body.package) bookingDoc.package = body.package;
    if (body.currency) bookingDoc.currency = body.currency;
    if (body.paymentStatus) bookingDoc.paymentStatus = body.paymentStatus;
    if (body.bookingStatus) bookingDoc.bookingStatus = body.bookingStatus;
    if (body.notes) bookingDoc.notes = body.notes;
    if (body.numberOfTravelers !== undefined) bookingDoc.numberOfTravelers = body.numberOfTravelers;

    // Final check before save
    if (!bookingDoc.bookingNumber || String(bookingDoc.bookingNumber).trim() === '') {
      console.error('❌ CRITICAL: bookingNumber missing in bookingDoc!');
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Booking number is missing',
      });
    }

    console.log('✅ BookingDoc ready:', {
      bookingNumber: bookingDoc.bookingNumber,
      hasBookingNumber: 'bookingNumber' in bookingDoc,
    });

    // Save the booking
    const result = await bookingDoc.save();
    
    console.log('✅ Booking created successfully:', result._id);

    // Create audit log
    try {
      const { createAuditLog } = require('@/middlewares/auditLog');
      await createAuditLog(req, 'create', 'booking', result._id, { total: result.total });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // If it's a mongoose validation error, show detailed info
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
          console.error(`❌ Validation error for ${key}:`, error.errors[key].message);
        });
      }
      console.error('❌ All validation errors:', validationErrors);
      
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Required fields are not supplied',
        validationErrors: validationErrors,
        error: error.message,
      });
    }
    
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create booking',
      error: error.name,
    });
  }
};

module.exports = create;
