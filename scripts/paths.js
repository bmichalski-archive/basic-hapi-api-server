const fs = require('fs-extra')

const root = fs.realpathSync(__dirname + '/../')

module.exports = {
  root: root,
  built: root + '/built',
  src: root + '/src'
}
