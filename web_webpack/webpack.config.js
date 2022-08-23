const webpack = require("webpack");
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const friendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    app: "./src/main.jsx",
  },
  output: {
    publicPath: "/",
    path: path.join(__dirname, "/dist"),
    filename: "[name].bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./dist/index.html"),
      filename: "index.html",
    }),
    // new CleanWebpackPlugin(),
    new friendlyErrorsWebpackPlugin(),
  ],
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.js|jsx$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  devServer: {
    open: true,
    port: 3001,
    hot: true,
    static: "./dist",
  },
};
