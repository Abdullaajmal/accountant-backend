const mongoose = require('mongoose');
const Commission = mongoose.model('Commission');
const CommissionRecord = mongoose.model('CommissionRecord');

const calculate = async (req, res) => {
  try {
    const { sourceType, sourceId, amount } = req.body;

    if (!sourceType || !sourceId || !amount) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Source type, source ID, and amount are required',
      });
    }

    // Find applicable commissions
    const commissions = await Commission.find({
      enabled: true,
      isActive: true,
      [`applicableOn.${sourceType}`]: true,
      $or: [
        { startDate: { $lte: new Date() } },
        { startDate: null },
      ],
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: null },
      ],
      removed: false,
    });

    const records = [];

    for (const commission of commissions) {
      let commissionAmount = 0;

      if (commission.commissionStructure.type === 'percentage') {
        commissionAmount = (amount * commission.commissionStructure.rate) / 100;
      } else if (commission.commissionStructure.type === 'fixed') {
        commissionAmount = commission.commissionStructure.rate;
      } else if (commission.commissionStructure.type === 'tiered') {
        // Find applicable tier
        const tier = commission.commissionStructure.tiers.find(
          (t) => amount >= t.minAmount && (!t.maxAmount || amount <= t.maxAmount)
        );
        if (tier) {
          commissionAmount = (amount * tier.rate) / 100;
        }
      }

      // Apply min/max limits
      if (commission.minAmount && commissionAmount < commission.minAmount) {
        commissionAmount = commission.minAmount;
      }
      if (commission.maxAmount && commissionAmount > commission.maxAmount) {
        commissionAmount = commission.maxAmount;
      }

      if (commissionAmount > 0) {
        const record = new CommissionRecord({
          commission: commission._id,
          recipient: commission.entity,
          recipientModel: commission.entityModel,
          source: {
            type: sourceType,
            reference: sourceId,
            referenceModel: getReferenceModel(sourceType),
          },
          amount: {
            base: amount,
            commission: commissionAmount,
            rate: commission.commissionStructure.rate,
          },
          status: 'pending',
          createdBy: req.admin._id,
        });

        await record.save();
        records.push(record);
      }
    }

    return res.status(200).json({
      success: true,
      result: records,
      message: 'Commission calculated and records created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to calculate commission',
    });
  }
};

function getReferenceModel(sourceType) {
  const mapping = {
    booking: 'Booking',
    package: 'Package',
    hotel: 'HotelBooking',
    visa: 'VisaPackage',
    invoice: 'Invoice',
  };
  return mapping[sourceType] || 'Other';
}

module.exports = calculate;
