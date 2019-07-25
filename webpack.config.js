const webpack = require('webpack');
const path = require('path');


module.exports = {
  output: {
    libraryTarget: 'umd',
    library: 'ReactSvgZoomMap'
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
    // 'prop-types': {
    //   'commonjs': 'prop-types',
    //   'commonjs2': 'prop-types',
    //   'amd': 'prop-types',
    //   'root': 'PropTypes'
    // },
    d3: 'd3',
    topojson: 'topojson-client',
    // animejs: 'animejs',
    // axios: 'axios',
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
    extensions: ['.js'],
    alias: {
      "react-svg-zoom-map": path.resolve(__dirname, "./src")
    }
  },
  devServer: {
    contentBase: path.join(__dirname, 'example'),
    port: 3000,
    host: '0.0.0.0'
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ]
};