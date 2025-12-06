// Application configuration from environment variables
export const config = {
  // Application URL - used for email links, redirects, etc.
  appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
};

// Log configuration in development (helps with debugging)
if (import.meta.env.DEV) {
  console.log('App Configuration:', {
    appUrl: config.appUrl,
  });
}

