const Booking = require('@/models/appModels/Booking');
const Supplier = require('@/models/appModels/Supplier');
const mongoose = require('mongoose');

const getCommissionReport = async (req, res) => {
  try {
    const { supplierId, startDate, endDate, groupBy = 'supplier' } = req.query;
    
    console.log('📊 Commission Report Request:', { supplierId, startDate, endDate, groupBy });

    const query = {
      removed: false,
    };

    if (supplierId) {
      // Convert to ObjectId if valid
      if (mongoose.Types.ObjectId.isValid(supplierId)) {
        query.supplier = new mongoose.Types.ObjectId(supplierId);
      } else {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid supplier ID',
        });
      }
    }

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('supplier', 'name supplierCode commissionRate')
      .populate('package', 'packageName packageCode')
      .populate('client', 'name')
      .exec();

    let reportData = {
      groupBy: groupBy || 'supplier',
      summary: [],
      bookings: [],
    };

    if (groupBy === 'supplier') {
      // Group by supplier
      const supplierMap = {};

      bookings.forEach((booking) => {
        if (!booking.supplier) return;

        const supplierId = booking.supplier._id.toString();
        if (!supplierMap[supplierId]) {
          supplierMap[supplierId] = {
            supplier: booking.supplier,
            totalBookings: 0,
            totalRevenue: 0,
            totalCommission: 0,
            bookings: [],
          };
        }

        const commission = booking.commission || 0;
        supplierMap[supplierId].totalBookings += 1;
        supplierMap[supplierId].totalRevenue += booking.total || 0;
        supplierMap[supplierId].totalCommission += commission;
        supplierMap[supplierId].bookings.push({
          bookingNumber: booking.bookingNumber,
          bookingDate: booking.bookingDate,
          client: booking.client?.name,
          package: booking.package?.packageName,
          total: booking.total,
          commission,
        });
      });

      reportData = {
        groupBy: 'supplier',
        summary: Object.values(supplierMap).map((item) => ({
          supplierId: item.supplier?._id || item.supplier?.id,
          supplierName: item.supplier?.name || 'Unknown',
          supplierCode: item.supplier?.supplierCode || 'N/A',
          commissionRate: item.supplier?.commissionRate || 0,
          totalBookings: item.totalBookings,
          totalRevenue: item.totalRevenue,
          totalCommission: item.totalCommission,
          averageCommission: item.totalBookings > 0 ? item.totalCommission / item.totalBookings : 0,
        })),
        details: supplierMap,
      };
    } else if (groupBy === 'booking') {
      // Individual booking commissions
      reportData = {
        groupBy: 'booking',
        summary: {
          totalBookings: bookings.length,
          totalRevenue: bookings.reduce((sum, b) => sum + (b.total || 0), 0),
          totalCommission: bookings.reduce((sum, b) => sum + (b.commission || 0), 0),
        },
        bookings: bookings.map((booking) => ({
          bookingNumber: booking.bookingNumber || 'N/A',
          bookingDate: booking.bookingDate,
          client: booking.client?.name || 'N/A',
          supplier: booking.supplier?.name || 'N/A',
          package: booking.package?.packageName || 'N/A',
          total: booking.total || 0,
          commission: booking.commission || 0,
          commissionRate: booking.supplier?.commissionRate || 0,
        })),
      };
    }

    return res.status(200).json({
      success: true,
      result: reportData,
      message: 'Commission report fetched successfully',
    });
  } catch (error) {
    console.error('❌ Commission Report Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error fetching commission report',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

module.exports = getCommissionReport;
