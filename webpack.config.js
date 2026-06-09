const createExpoWebpackConfig = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfig(env, argv);
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'asset/resource',
  });
  return config;
};
