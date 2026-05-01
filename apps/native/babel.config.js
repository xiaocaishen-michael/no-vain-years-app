// Expo + Tamagui + Reanimated babel config.
// Order matters:
// 1. babel-preset-expo (RN / Expo defaults)
// 2. @tamagui/babel-plugin (compiles Tamagui JSX → optimized output;
//    points to @nvy/ui's config so design tokens are picked up here)
// 3. react-native-reanimated/plugin MUST be last (Reanimated requirement)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: '../../packages/ui/src/tamagui.config.ts',
          logTimings: true,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
