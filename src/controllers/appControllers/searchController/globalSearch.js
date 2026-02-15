const Invoice = require('@/models/appModels/Invoice');
const Booking = require('@/models/appModels/Booking');
const Client = require('@/models/appModels/Client');

const globalSearch = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        result: {
          invoices: [],
          bookings: [],
          clients: [],
        },
        message: 'Search query too short',
      });
    }

    const searchRegex = new RegExp(query, 'i');

    // Search invoices
    const invoices = await Invoice.find({
      removed: false,
      $or: [
        { number: searchRegex },
        { 'client.name': searchRegex },
      ],
    })
      .populate('client', 'name')
      .limit(parseInt(limit))
      .exec();

    // Search bookings
    const bookings = await Booking.find({
      removed: false,
      $or: [
        { bookingNumber: searchRegex },
        { 'client.name': searchRegex },
        { packageName: searchRegex },
        { destination: searchRegex },
      ],
    })
      .populate('client', 'name')
      .populate('package', 'packageName')
      .limit(parseInt(limit))
      .exec();

    // Search clients
    const clients = await Client.find({
      removed: false,
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    })
      .limit(parseInt(limit))
      .exec();

    return res.status(200).json({
      success: true,
      result: {
        invoices: invoices.map((inv) => ({
          _id: inv._id,
          type: 'invoice',
          number: inv.number,
          client: inv.client?.name,
          total: inv.total,
        })),
        bookings: bookings.map((book) => ({
          _id: book._id,
          type: 'booking',
          bookingNumber: book.bookingNumber,
          client: book.client?.name,
          package: book.package?.packageName,
          total: book.total,
        })),
        clients: clients.map((client) => ({
          _id: client._id,
          type: 'client',
          name: client.name,
          email: client.email,
          phone: client.phone,
        })),
      },
      message: 'Search completed successfully',
    });
  } catch (error) {
    console.error('❌ Global Search Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error performing search',
    });
  }
};

module.exports = globalSearch;
