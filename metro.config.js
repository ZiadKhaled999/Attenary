const { getDefaultConfig } = require('expo/node_modules/@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'wasm'],
    assetExts: [...defaultConfig.resolver.assetExts, 'wasm'],
  },
};
