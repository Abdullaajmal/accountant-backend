const Booking = require('@/models/appModels/Booking');
const Package = require('@/models/appModels/Package');

const getBusinessInsights = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      removed: false,
    };

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('package', 'packageName packageCode')
      .populate('supplier', 'name commissionRate')
      .exec();

    // Top packages by revenue
    const packageRevenue = {};
    bookings.forEach((booking) => {
      if (booking.package) {
        const packageId = booking.package._id.toString();
        if (!packageRevenue[packageId]) {
          packageRevenue[packageId] = {
            package: booking.package,
            totalRevenue: 0,
            bookingCount: 0,
          };
        }
        packageRevenue[packageId].totalRevenue += booking.total || 0;
        packageRevenue[packageId].bookingCount += 1;
      }
    });

    const topPackages = Object.values(packageRevenue)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map((item) => ({
        packageName: item.package.packageName,
        packageCode: item.package.packageCode,
        totalRevenue: item.totalRevenue,
        bookingCount: item.bookingCount,
      }));

    // Low profit bookings
    const lowProfitBookings = bookings
      .map((booking) => {
        const revenue = booking.total || 0;
        const commission = booking.commission || 0;
        const profit = revenue - commission;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return {
          bookingNumber: booking.bookingNumber,
          bookingDate: booking.bookingDate,
          package: booking.package?.packageName || 'N/A',
          revenue,
          commission,
          profit,
          profitMargin,
        };
      })
      .filter((b) => b.profitMargin < 10) // Less than 10% profit margin
      .sort((a, b) => a.profitMargin - b.profitMargin)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      result: {
        topPackages,
        lowProfitBookings,
        summary: {
          totalBookings: bookings.length,
          totalRevenue: bookings.reduce((sum, b) => sum + (b.total || 0), 0),
          averageProfitMargin:
            bookings.length > 0
              ? bookings.reduce((sum, b) => {
                  const revenue = b.total || 0;
                  const commission = b.commission || 0;
                  const profit = revenue - commission;
                  return sum + (revenue > 0 ? (profit / revenue) * 100 : 0);
                }, 0) / bookings.length
              : 0,
        },
      },
      message: 'Business insights fetched successfully',
    });
  } catch (error) {
    console.error('❌ Business Insights Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error fetching business insights',
    });
  }
};

module.exports = getBusinessInsights;
