/**
 * expo-task-manager is auto-applied by prebuild and adds UIBackgroundModes "fetch" on iOS.
 * The mascot background task is Android-only (iOS forbids changing the app icon from the
 * background), so the iOS app must not declare a background mode it never uses.
 */
const { withInfoPlist } = require('expo/config-plugins');

module.exports = (config) =>
  withInfoPlist(config, (config) => {
    const modes = (config.modResults.UIBackgroundModes ?? []).filter((m) => m !== 'fetch');
    if (modes.length) config.modResults.UIBackgroundModes = modes;
    else delete config.modResults.UIBackgroundModes;
    return config;
  });
