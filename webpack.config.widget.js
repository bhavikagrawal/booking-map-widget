const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/widget/floor-plan.tsx',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'public/widget'),
    filename: 'studio-floorplan-widget.js',
    // Export the ES module default directly on the global name so StudioFloorPlan.init works
    library: { name: 'StudioFloorPlan', type: 'umd', export: 'default' },
    globalObject: 'this',
    publicPath: '/widget/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      'next/image': path.resolve(__dirname, 'src/widget/shims/next-image.tsx')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            // This is important to prevent ts-loader from trying to type check the whole project.
            transpileOnly: true,
            compilerOptions: {
                module: 'esnext',
                jsx: 'react-jsx'
            }
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
};
