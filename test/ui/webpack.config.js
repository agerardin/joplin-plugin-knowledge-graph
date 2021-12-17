var webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './test-ui.tsx'),
  // entry: path.resolve(__dirname, './test-force-graph'),
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(css)$/,
        use: ['style-loader','css-loader']
      },
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.svg$/,
        use: [
            {
              loader: 'svg-url-loader',
              options: {
                limit: 10000,
              },
            }],
      },
    ],
  },
  resolve: {
    // * is necessary to properly import css files
    // TODO CHECK : maybe because css loader turn them into strings?
    extensions: ['*','.tsx', '.ts', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, './public'),
    filename: 'bundle.js',
  },
  devServer: {
    static: path.resolve(__dirname, './public'),
  },
  plugins: [
    new webpack.EnvironmentPlugin(
      {DEBUG: false
     }),
  ],
};

