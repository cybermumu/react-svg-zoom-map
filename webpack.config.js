const webpack = require('webpack');
const path = require('path');


module.exports = {
  context: __dirname,
  entry: {
    main: './src/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'react-svg-zoom-map.min.js',
    sourceMapFilename: '[file].map',
    library: 'react-svg-zoom-map',
    libraryTarget: 'umd'
  },
  externals: {
    'react': {
      'commonjs': 'react',
      'commonjs2': 'react',
      'amd': 'react',
      'root': 'React'
    },
    'react-dom': {
      'commonjs': 'react-dom',
      'commonjs2': 'react-dom',
      'amd': 'react-dom',
      'root': 'ReactDOM'
    },
    d3: 'd3',
    topojson: 'topojson-client'
  },
  module: {
    rules: [
      { 
        test: /\.jsx?$/, 
        exclude: /node_modules/, 
        loader: 'babel-loader?cacheDirectory=true'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 3000,
    host: '0.0.0.0'
  },
  plugins: [
    // Scope hoisting
    new webpack.optimize.ModuleConcatenationPlugin(),
  ]
};