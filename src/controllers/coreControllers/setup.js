require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { globSync } = require('glob');
const fs = require('fs');
const { generate: uniqueId } = require('shortid');
const Joi = require('joi');

const mongoose = require('mongoose');

const setup = async (req, res) => {
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');
  const Setting = mongoose.model('Setting');

  const PaymentMode = mongoose.model('PaymentMode');
  const Taxes = mongoose.model('Taxes');

  const newAdminPassword = new AdminPassword();

  const { name, email, password, language, timezone, country, config = {} } = req.body;

  const objectSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string()
      .email({ tlds: { allow: true } })
      .required(),
    password: Joi.string().required(),
  });

  const { error, value } = objectSchema.validate({ name, email, password });
  if (error) {
    return res.status(409).json({
      success: false,
      result: null,
      error: error,
      message: 'Invalid/Missing credentials.',
      errorMessage: error.message,
    });
  }

  const salt = uniqueId();

  const passwordHash = newAdminPassword.generateHash(salt, password);

  // Get or create Manager role for default admin
  const Role = mongoose.model('Role');
  let managerRole = await Role.findOne({ roleCode: 'MANAGER', removed: false });
  
  if (!managerRole) {
    // Create Manager role if it doesn't exist
    managerRole = new Role({
      roleName: 'Manager',
      roleCode: 'MANAGER',
      description: 'Full system access with all permissions',
      enabled: true,
      permissions: {
        dashboard: true,
        customers: true,
        suppliers: true,
        invoices: true,
        quotes: true,
        payments: true,
        expenses: true,
        packages: true,
        visaPackages: true,
        hotelBookings: true,
        accounts: true,
        journalEntries: true,
        bankAccounts: true,
        financialYear: true,
        ledgerPostingRules: true,
        employees: true,
        attendance: true,
        payroll: true,
        commission: true,
        company: true,
        branches: true,
        reports: true,
        financialReports: true,
        businessReports: true,
        documents: true,
        settings: true,
        roles: true,
        users: true,
        loginHistory: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canView: true,
        canExport: true,
        canApprove: true,
      },
    });
    await managerRole.save();
  }

  const accountOwnner = {
    email,
    name,
    role: managerRole._id,
  };
  const result = await new Admin(accountOwnner).save();

  const AdminPasswordData = {
    password: passwordHash,
    emailVerified: true,
    salt: salt,
    user: result._id,
  };
  await new AdminPassword(AdminPasswordData).save();

  const settingData = [];

  const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

  for (const filePath of settingsFiles) {
    const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const settingsToUpdate = {
      idurar_app_email: email,
      idurar_app_company_email: email,
      idurar_app_timezone: timezone,
      idurar_app_country: country,
      idurar_app_language: language || 'en_us',
    };

    const newSettings = file.map((x) => {
      const settingValue = settingsToUpdate[x.settingKey];
      return settingValue ? { ...x, settingValue } : { ...x };
    });

    settingData.push(...newSettings);
  }

  await Setting.insertMany(settingData);

  await Taxes.insertMany([{ taxName: 'Tax 0%', taxValue: '0', isDefault: true }]);

  await PaymentMode.insertMany([
    {
      name: 'Default Payment',
      description: 'Default Payment Mode (Cash , Wire Transfert)',
      isDefault: true,
    },
  ]);

  return res.status(200).json({
    success: true,
    result: {},
    message: 'Successfully IDURAR App Setup',
  });
};

module.exports = setup;
