const fs = require('fs')
const express = require('express')
const webpack = require('webpack')
const path = require('path')
const union = require('lodash/union')
const cors = require('cors')
const compression = require('compression')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const createConfigsFromLolla = require('./createConfigsFromLolla')

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true'


const packages = createConfigsFromLolla()

const app = express()

app.use(cors())
app.use(compression())

packages.forEach(target => {
  Object.keys(target.entry, (key) => {
    target.entry[key].push(hotMiddlewareScript)
  })
  target.devtool = 'inline-source-map'
  if (target.hot) target.plugins.push(new webpack.HotModuleReplacementPlugin())
  target.plugins.push(new webpack.NoEmitOnErrorsPlugin())

  target.devServer = {
    hot: true,
    inline: true
  }

  console.log(target.output.publicPath)

  const compiler = webpack(target)
  app.use(webpackDevMiddleware(compiler, {
    publicPath: target.output.publicPath,
    stats: {
      colors: true
    }
  }))
  if (target.hot) app.use(webpackHotMiddleware(compiler))
})

app.route('*').all((req, res, next) => {
  try {
    res.sendFile(`${process.cwd()}/${req.path}`)
  } catch (e) {
    res.sendStatus(404)
  }
})

app.listen(process.env.PORT, (err) => {
  if (err) return console.log(err)
  console.log(`webpack:  Listening at http://localhost:${process.env.PORT}`)
})

console.warn('lolla: you should install loaders in this project directory')