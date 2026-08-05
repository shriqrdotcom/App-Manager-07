/**
 * Keep the production/native configuration unchanged while allowing the
 * Expo Go preview workflow to use the compatible runtime configuration.
 */
module.exports = ({ config }) => ({
  ...config,
  newArchEnabled: process.env.EXPO_PUBLIC_PREVIEW_DEMO === 'true'
    ? false
    : true,
});