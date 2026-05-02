// Expo + NativeWind + Reanimated babel config.
// Order matters:
// 1. babel-preset-expo with jsxImportSource: 'nativewind' (NativeWind v4 requirement)
// 2. nativewind/babel preset (compiles className → styles)
// 3. react-native-reanimated/plugin MUST be last (Reanimated requirement)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
