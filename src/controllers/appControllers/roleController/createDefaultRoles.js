const mongoose = require('mongoose');
const Role = mongoose.model('Role');

const createDefaultRoles = async (req, res) => {
  try {
    const defaultRoles = [
      {
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
      },
      {
        roleName: 'Accountant',
        roleCode: 'ACCOUNTANT',
        description: 'Financial management and accounting operations only',
        enabled: true,
        permissions: {
          dashboard: true,
          customers: false,
          suppliers: false,
          invoices: true,
          quotes: false,
          payments: true,
          expenses: true,
          packages: false,
          visaPackages: false,
          hotelBookings: false,
          accounts: true,
          journalEntries: true,
          bankAccounts: true,
          financialYear: true,
          ledgerPostingRules: true,
          employees: false,
          attendance: false,
          payroll: true,
          commission: false,
          company: false,
          branches: false,
          reports: true,
          financialReports: true,
          businessReports: false,
          documents: true,
          settings: false,
          roles: false,
          users: false,
          loginHistory: false,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canView: true,
          canExport: true,
          canApprove: false,
        },
      },
      {
        roleName: 'Staff',
        roleCode: 'STAFF',
        description: 'Staff operations and basic access',
        enabled: true,
        permissions: {
          dashboard: true,
          customers: true,
          suppliers: true,
          invoices: false,
          quotes: true,
          payments: false,
          expenses: false,
          packages: true,
          visaPackages: true,
          hotelBookings: true,
          accounts: false,
          journalEntries: false,
          bankAccounts: false,
          financialYear: false,
          ledgerPostingRules: false,
          employees: false,
          attendance: true,
          payroll: false,
          commission: false,
          company: false,
          branches: false,
          reports: false,
          financialReports: false,
          businessReports: false,
          documents: true,
          settings: false,
          roles: false,
          users: false,
          loginHistory: false,
          canCreate: true,
          canUpdate: true,
          canDelete: false,
          canView: true,
          canExport: false,
          canApprove: false,
        },
      },
    ];

    const createdRoles = [];
    const existingRoles = [];

    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ roleCode: roleData.roleCode, removed: false });
      if (existing) {
        // Update existing role with new permissions structure
        existing.permissions = roleData.permissions;
        existing.description = roleData.description;
        existing.enabled = roleData.enabled;
        await existing.save();
        existingRoles.push(existing);
      } else {
        const role = new Role(roleData);
        await role.save();
        createdRoles.push(role);
      }
    }

    return res.status(200).json({
      success: true,
      result: {
        created: createdRoles,
        updated: existingRoles,
      },
      message: `Created ${createdRoles.length} roles and updated ${existingRoles.length} existing roles`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create default roles',
    });
  }
};

module.exports = createDefaultRoles;
