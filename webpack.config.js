module.exports = {
    entry: './src/main.js',
    mode: 'development',
    optimization: {
        minimize: false
    },
    devServer: {
        contentBase: "./src/",
        compress: false,
        port: 9000
    },
    module: {
        rules: [
            {
              test: /\.js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                  plugins: [[
                    '@babel/plugin-transform-react-jsx',
                    {
                      pragma: 'ToyReact.createElement'
                    }
                  ]]
                }
              }
            }
        ]
    }
};
