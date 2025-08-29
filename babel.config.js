module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // garde ce plugin seulement si tu utilises Reanimated :
    plugins: ['react-native-reanimated/plugin'],
  };
};
