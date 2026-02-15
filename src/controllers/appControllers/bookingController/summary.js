const mongoose = require('mongoose');
const Model = mongoose.model('Booking');

const summary = async (req, res) => {
  const response = await Model.aggregate([
    {
      $match: {
        removed: false,
      },
    },
    {
      $facet: {
        totalBookings: [
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              count: { $sum: 1 },
            },
          },
        ],
        statusCounts: [
          {
            $group: {
              _id: '$bookingStatus',
              count: { $sum: 1 },
            },
          },
        ],
        paymentStatusCounts: [
          {
            $group: {
              _id: '$paymentStatus',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const totalBookings = response[0].totalBookings[0] || { total: 0, count: 0 };
  const statusCounts = response[0].statusCounts || [];
  const paymentStatusCounts = response[0].paymentStatusCounts || [];

  return res.status(200).json({
    success: true,
    result: {
      total: totalBookings.total,
      count: totalBookings.count,
      statusCounts,
      paymentStatusCounts,
    },
    message: 'Booking summary fetched successfully',
  });
};

module.exports = summary;
