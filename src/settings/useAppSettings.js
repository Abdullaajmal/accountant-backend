const useAppSettings = () => {
  let settings = {};
  // Default email/base URL for self‑hosted usage; override via your own settings if needed
  settings['idurar_app_email'] = 'noreply@example.com';
  settings['idurar_base_url'] = process.env.APP_BASE_URL || 'http://localhost:3000';
  return settings;
};

module.exports = useAppSettings;
