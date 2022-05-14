# file-move-webpack-plugin

A webpack plugin to move file,such as move sourcemap from outfile path to another path

## Installation

`npm install --save-dev file-move-webpack-plugin`

## Usage

```

const { FileMoveWebpackPlugin } = require('file-move-webpack-plugin')

const webpackConfig = {
  plugins: [
    new MoveFileWebpackPlugin({
      sourcePath: resolve("dist/static/js"),
      targetPath: resolve("dist/sourcemap"),
      filter: ".map",
    })
  ],
};
module.exports = webpackConfig;

```
