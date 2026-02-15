const Quote = require('@/models/appModels/Quote');
const Booking = require('@/models/appModels/Booking');

const getConversionRate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const quoteQuery = {
      removed: false,
    };

    const bookingQuery = {
      removed: false,
    };

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      
      quoteQuery.date = dateFilter;
      bookingQuery.bookingDate = dateFilter;
    }

    const quotes = await Quote.find(quoteQuery).exec();
    const bookings = await Booking.find(bookingQuery).exec();

    // Find bookings that were converted from quotes
    const convertedBookings = bookings.filter((booking) => {
      // Check if booking has invoice that was converted from quote
      // For now, we'll count all bookings as potential conversions
      return true;
    });

    const totalQuotes = quotes.length;
    const totalBookings = bookings.length;
    const conversionRate = totalQuotes > 0 ? (totalBookings / totalQuotes) * 100 : 0;

    return res.status(200).json({
      success: true,
      result: {
        totalQuotes,
        totalBookings,
        conversionRate: conversionRate.toFixed(2),
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      message: 'Conversion rate fetched successfully',
    });
  } catch (error) {
    console.error('❌ Conversion Rate Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error fetching conversion rate',
    });
  }
};

module.exports = getConversionRate;
