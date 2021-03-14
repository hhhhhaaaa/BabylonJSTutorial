/* eslint-disable no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */
const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {
    CleanWebpackPlugin
} = require("clean-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

const jay = /(?<javascript>.js|jsx)/u;
const babe = /(?<models>.glb)/u;
const textures = /(?<textures>.png)/u;
const sprites = /(?<sprites>.jpeg)/u;

module.exports = {
    entry: path.resolve(appDirectory, "src/app.js"), //path to the main .ts file
    output: {
        publicPath: '/',
        path: __dirname + "/dist",
        filename: "js/bundleName.js", //name for the js file that is created/compiled in memory
    },
    resolve: {
        extensions: [".js", ".jsx"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080, //port that we're using for local host (localhost:8080)
        disableHostCheck: true,
        contentBase: path.resolve(appDirectory, "public"), //tells webpack to serve from the public folder
        publicPath: "/",
        hot: true,
    },
    module: {
        rules: [{
                exclude: [
                    path.resolve(__dirname, 'node_modules'),
                    path.resolve(__dirname, '/src/server'),
                    babe,
                    textures,
                    sprites
                ],
                test: jay,
                use: [
                    'babel-loader', 'astroturf/loader',
                ],
            },
            {
                exclude: [
                    path.resolve(__dirname, 'node_modules'),
                    path.resolve(__dirname, '/src/server'),
                    jay,
                    textures,
                    sprites
                ],
                test: babe,
                use: [
                    'babylon-file-loader'
                ],
            },
            {
                exclude: [
                    path.resolve(__dirname, 'node_modules'),
                    path.resolve(__dirname, '/src/server'),
                    jay,
                    babe
                ],
                test: [textures, sprites],
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                }
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "./index.html"),
        }),
        new CleanWebpackPlugin(),
    ],
    mode: "development",
};