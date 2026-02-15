const mongoose = require('mongoose');
const Model = mongoose.model('Booking');

/**
 * Get upcoming departure and return flights
 */
const getUpcomingFlights = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const limit = parseInt(req.query.limit) || 5;
    
    // Get upcoming departure flights (travelDateTime >= today)
    const departureFlights = await Model.find({
      removed: false,
      enabled: true,
      travelDateTime: { $gte: today },
      sectorType: { $in: ['DOMESTIC', 'INTERNATIONAL'] },
    })
      .populate('client', 'name email phone')
      .populate('supplier', 'name')
      .sort({ travelDateTime: 1 })
      .limit(limit)
      .lean();

    // Get upcoming return flights (returnDateTime >= today)
    const returnFlights = await Model.find({
      removed: false,
      enabled: true,
      returnDateTime: { $gte: today },
      sectorType: { $in: ['DOMESTIC', 'INTERNATIONAL'] },
    })
      .populate('client', 'name email phone')
      .populate('supplier', 'name')
      .sort({ returnDateTime: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      result: {
        departureFlights,
        returnFlights,
      },
      message: 'Successfully found upcoming flights',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getUpcomingFlights;
