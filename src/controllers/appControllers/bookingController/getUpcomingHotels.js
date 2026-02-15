const mongoose = require('mongoose');
const Model = mongoose.model('Booking');

/**
 * Get upcoming hotel check-ins
 */
const getUpcomingHotels = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const limit = parseInt(req.query.limit) || 5;
    
    // Get bookings with hotel packages (you may need to adjust this based on your package structure)
    const upcomingHotels = await Model.find({
      removed: false,
      enabled: true,
      travelDate: { $gte: today },
      package: { $exists: true, $ne: null },
    })
      .populate('client', 'name email phone')
      .populate('package', 'packageName destination')
      .sort({ travelDate: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      result: upcomingHotels,
      message: 'Successfully found upcoming hotel check-ins',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getUpcomingHotels;
