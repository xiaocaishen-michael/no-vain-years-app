// Metro config wrapped with NativeWind v4.
// `withNativeWind(config, { input: './global.css' })` injects Tailwind CSS
// processing into Metro's transform pipeline.

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
