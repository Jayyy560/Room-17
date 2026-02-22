const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable the "react-native" export condition so that packages like
// @firebase/auth resolve to their React-Native builds (which contain
// getReactNativePersistence) instead of the browser builds.
config.resolver.unstable_conditionNames = [
    'react-native',
    'browser',
    'require',
    'import',
];

module.exports = config;
