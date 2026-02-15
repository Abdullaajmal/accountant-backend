const mongoose = require('mongoose');
const Model = mongoose.model('HotelBooking');
const Commission = mongoose.model('Commission');

const calculateCommission = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Model.findOne({ _id: id, removed: false });
    if (!booking) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Hotel booking not found',
      });
    }

    // Find applicable commissions
    const commissions = await Commission.find({
      enabled: true,
      isActive: true,
      'applicableOn.hotels': true,
      removed: false,
    });

    const commissionAmounts = {
      agent: 0,
      staff: 0,
    };

    for (const commission of commissions) {
      let amount = 0;
      const bookingTotal = booking.cost.total || 0;

      if (commission.commissionStructure.type === 'percentage') {
        amount = (bookingTotal * commission.commissionStructure.rate) / 100;
      } else if (commission.commissionStructure.type === 'fixed') {
        amount = commission.commissionStructure.rate;
      }

      if (commission.type === 'agent') {
        commissionAmounts.agent += amount;
      } else if (commission.type === 'staff' || commission.type === 'employee') {
        commissionAmounts.staff += amount;
      }
    }

    booking.commission = commissionAmounts;
    await booking.save();

    return res.status(200).json({
      success: true,
      result: booking,
      message: 'Commission calculated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to calculate commission',
    });
  }
};

module.exports = calculateCommission;
