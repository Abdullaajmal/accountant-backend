const mongoose = require('mongoose');
const Model = mongoose.model('HotelBooking');

const create = async (req, res) => {
  try {
    let body = req.body;

    // Generate booking number if not provided
    if (!body.bookingNumber) {
      const year = new Date().getFullYear();
      const lastBooking = await Model.findOne({
        bookingNumber: new RegExp(`^HTL-${year}-`),
      })
        .sort({ bookingNumber: -1 })
        .exec();

      if (lastBooking) {
        const lastNum = parseInt(lastBooking.bookingNumber.split('-')[2]) || 0;
        body.bookingNumber = `HTL-${year}-${String(lastNum + 1).padStart(5, '0')}`;
      } else {
        body.bookingNumber = `HTL-${year}-00001`;
      }
    }

    // If multi‑hotel stays are provided, derive summary fields from them
    if (body.stays && Array.isArray(body.stays) && body.stays.length > 0) {
      // Overall check‑in / check‑out
      const validDates = body.stays
        .filter((s) => s && s.checkIn && s.checkOut)
        .map((s) => ({
          checkIn: new Date(s.checkIn),
          checkOut: new Date(s.checkOut),
        }));

      if (validDates.length > 0) {
        const minCheckIn = new Date(
          Math.min.apply(
            null,
            validDates.map((d) => d.checkIn)
          )
        );
        const maxCheckOut = new Date(
          Math.max.apply(
            null,
            validDates.map((d) => d.checkOut)
          )
        );
        body.checkIn = body.checkIn || minCheckIn;
        body.checkOut = body.checkOut || maxCheckOut;
      }

      // Default top‑level hotel info from first stay
      const firstStay = body.stays[0];
      if (firstStay) {
        body.hotelName = body.hotelName || firstStay.hotelName;
        body.location = body.location || {
          city: firstStay.city,
          country: firstStay.country,
        };
      }

      // Aggregate financials from stays
      let totalSale = 0;
      let totalBuying = 0;
      body.stays.forEach((s) => {
        totalSale += s.saleAmount || 0;
        totalBuying += s.buyingAmount || 0;
      });

      body.cost = body.cost || {};
      body.cost.roomCharges = totalSale;
      body.cost.taxes = body.cost.taxes || 0;
      body.cost.serviceCharge = body.cost.serviceCharge || 0;
      body.cost.total = (body.cost.roomCharges || 0) + body.cost.taxes + body.cost.serviceCharge;

      body.supplierCost = body.supplierCost || totalBuying;
      body.profit = body.cost.total - (body.supplierCost || 0);
    } else {
      // Legacy single‑hotel calculation based on rooms array
      let roomCharges = 0;
      if (body.rooms && Array.isArray(body.rooms)) {
        body.rooms.forEach((room) => {
          const nights = Math.ceil((new Date(body.checkOut) - new Date(body.checkIn)) / (1000 * 60 * 60 * 24));
          room.totalNights = nights;
          roomCharges += (room.pricePerNight || 0) * nights * (room.numberOfRooms || 1);
        });
      }

      // Calculate totals
      if (body.cost) {
        const { taxes = 0, serviceCharge = 0 } = body.cost;
        body.cost.roomCharges = roomCharges;
        body.cost.total = roomCharges + taxes + serviceCharge;

        // Calculate profit if supplier cost is provided
        if (body.supplierCost) {
          body.profit = body.cost.total - body.supplierCost;
        }
      }
    }

    body.createdBy = req.admin._id;

    const result = await new Model(body).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Hotel booking created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create hotel booking',
    });
  }
};

module.exports = create;
