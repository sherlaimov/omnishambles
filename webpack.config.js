const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.resolve(__dirname, 'dist'),
  data: path.join(__dirname, 'data'),
};

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  context: paths.src,
  entry: {
    main: './app.js',
  },
  output: {
    filename: 'bundle.js',
    path: paths.dist,
    publicPath: '/dist',
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: paths.data,
        to: `${paths.dist}/data`,
      },
    ]),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.s?[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false, sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ],
      },
    ],
  },
  devServer: {
    contentBase: path.resolve(__dirname, './'),
    // contentBase: path.resolve(__dirname, 'dist'),
    // contentBase: path.resolve(__dirname, './'),
    compress: true,
    stats: 'errors-only',
    // publicPath: paths.dist,
    port: 3000,
  },
};
