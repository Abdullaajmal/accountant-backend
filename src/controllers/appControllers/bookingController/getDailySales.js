const mongoose = require('mongoose');
const Booking = mongoose.model('Booking');
const Invoice = mongoose.model('Invoice');

/**
 * Get daily sales summary by category
 */
const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Get bookings for the date
    const bookings = await Booking.find({
      removed: false,
      bookingDate: { $gte: targetDate, $lt: nextDate },
    }).lean();

    // Get invoices for the date
    const invoices = await Invoice.find({
      removed: false,
      date: { $gte: targetDate, $lt: nextDate },
    }).lean();

    // Calculate sales by category
    // Ticket Sales: from flights array in bookings
    const ticketSales = bookings.reduce((sum, b) => {
      if (b.flights && Array.isArray(b.flights) && b.flights.length > 0) {
        return sum + b.flights.reduce((flightSum, flight) => {
          return flightSum + (flight.totalSelling || flight.basicFare || 0);
        }, 0);
      }
      // Fallback: old structure with top-level fields
      if (b.sectorType && (b.sectorType === 'DOMESTIC' || b.sectorType === 'INTERNATIONAL')) {
        return sum + (b.total || 0);
      }
      return sum;
    }, 0);

    // Hotel Sales: from hotels array in bookings
    const hotelSales = bookings.reduce((sum, b) => {
      if (b.hotels && Array.isArray(b.hotels) && b.hotels.length > 0) {
        return sum + b.hotels.reduce((hotelSum, hotel) => {
          return hotelSum + (hotel.saleAmount || hotel.salePerNight || 0);
        }, 0);
      }
      // Fallback: old structure
      if (b.package && b.package.toString()) {
        return sum + (b.total || 0);
      }
      return sum;
    }, 0);

    // Visa Sales: from invoices
    const visaSales = invoices
      .filter(inv => inv.items && inv.items.some(item => 
        item.itemName && item.itemName.toLowerCase().includes('visa')
      ))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Transport Sales: from cars array in bookings
    const transportSales = bookings.reduce((sum, b) => {
      if (b.cars && Array.isArray(b.cars) && b.cars.length > 0) {
        return sum + b.cars.reduce((carSum, car) => {
          return carSum + (car.saleAmount || car.salePerDay || 0);
        }, 0);
      }
      // Fallback: old structure
      if (b.items && b.items.some(item => 
        item.itemName && item.itemName.toLowerCase().includes('transport')
      )) {
        return sum + (b.total || 0);
      }
      return sum;
    }, 0);

    // Other Sales: from invoices (excluding visa)
    const otherSales = invoices
      .filter(inv => inv.items && inv.items.some(item => 
        !item.itemName.toLowerCase().includes('visa') &&
        !item.itemName.toLowerCase().includes('ticket') &&
        !item.itemName.toLowerCase().includes('hotel')
      ))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Package WOB Sales: bookings with package but not in hotels/flights/cars
    const packageWobSales = bookings
      .filter(b => {
        // Has package but no flights, hotels, or cars
        return b.package && 
               (!b.flights || b.flights.length === 0) &&
               (!b.hotels || b.hotels.length === 0) &&
               (!b.cars || b.cars.length === 0);
      })
      .reduce((sum, b) => sum + (b.total || 0), 0);

    const grandTotal = ticketSales + hotelSales + visaSales + transportSales + otherSales + packageWobSales;

    return res.status(200).json({
      success: true,
      result: {
        date: targetDate.toISOString().split('T')[0],
        ticketSales,
        hotelSales,
        visaSales,
        transportSales,
        otherSales,
        packageWobSales,
        grandTotal,
      },
      message: 'Successfully found daily sales',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getDailySales;
