let path = require('path');

module.exports = {
    entry: {
        'index': './src/js/index.js',
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'public'),
    },
    devServer: {
        contentBase: path.join(__dirname, 'public')
    }
};