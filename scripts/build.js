const paths = require(__dirname + '/paths')
const fs = require('fs-promise')
const babel = require('babel-core')
const globby = require('globby')
const path = require('path')

const babelPresets = ['es2015']
const babelQuery = {
  presets: babelPresets,
  babelrc: false,
  sourceMaps: true
}

fs
  .remove(paths.built)
  .then(function () {
    return fs.mkdir(paths.built)
  })
  .then(function () {
    return globby(paths.src + '/**/*')
      .then(function (files) {
        return Promise.all(files.map(function (file) {
          return fs.stat(file)
            .then(function (stats) {
              if (stats.isFile()) {
                return fs
                  .readFile(file)
                  .then(function (arg) {
                    return babel.transform(arg, babelQuery)
                  })
                  .then(function (result) {
                    const relativeFilePath = file.replace(paths.src, '')
                    const absoluteDestPath = paths.built + relativeFilePath
                    const absoluteDestMapPath = paths.built + relativeFilePath + '.map'

                    const dirname = path.dirname(absoluteDestPath)

                    result.map.file = relativeFilePath
                    result.map.sources = [ relativeFilePath ]

                    return fs.mkdirp(dirname)
                      .then(function () {
                        let code = ''

                        code += 'require(\'source-map-support\').install({ handleUncaughtExceptions: false })'
                        code += '\n'
                        code += '\n'
                        code += result.code
                        code += '\n'
                        code += '\n'
                        code += '//# sourceMappingURL=' + './' + path.basename(absoluteDestMapPath)

                        return Promise.all([
                          fs.writeFile(absoluteDestPath, code),
                          fs.writeJson(absoluteDestMapPath, result.map)
                        ])
                      })
                  })
              }
            })
        }))
      })
  })
