const mongoose = require('mongoose');
const Model = mongoose.model('HotelBooking');

const update = async (req, res) => {
  try {
    // Recalculate if dates or rooms are updated
    if (req.body.checkIn || req.body.checkOut || req.body.rooms) {
      const booking = await Model.findOne({ _id: req.params.id });
      const checkIn = req.body.checkIn ? new Date(req.body.checkIn) : booking.checkIn;
      const checkOut = req.body.checkOut ? new Date(req.body.checkOut) : booking.checkOut;
      const rooms = req.body.rooms || booking.rooms;

      let roomCharges = 0;
      if (rooms && Array.isArray(rooms)) {
        rooms.forEach((room) => {
          const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
          room.totalNights = nights;
          roomCharges += (room.pricePerNight || 0) * nights * (room.numberOfRooms || 1);
        });
      }

      if (req.body.cost) {
        const { taxes = 0, serviceCharge = 0 } = req.body.cost;
        req.body.cost.roomCharges = roomCharges;
        req.body.cost.total = roomCharges + taxes + serviceCharge;
      }
    }

    // Recalculate profit
    if (req.body.cost && req.body.supplierCost !== undefined) {
      req.body.profit = req.body.cost.total - req.body.supplierCost;
    }

    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Hotel booking not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Hotel booking updated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to update hotel booking',
    });
  }
};

module.exports = update;
