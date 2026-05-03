// Expo + NativeWind + Reanimated babel config.
// Order matters:
// 1. babel-preset-expo with jsxImportSource: 'nativewind' (NativeWind v4 requirement)
// 2. nativewind/babel preset (compiles className → styles)
// 3. react-native-worklets/plugin MUST be last (Reanimated v4 requirement —
//    worklets moved out of reanimated into a standalone package since v4;
//    using the old `react-native-reanimated/plugin` breaks Metro web bundle
//    with "Cannot use 'import.meta' outside a module")
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
