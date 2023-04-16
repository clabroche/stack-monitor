const { existsSync } = require('fs-extra')
const fse = require('fs-extra')
const pathfs = require('path')
const indexPath = pathfs.resolve(__dirname, '..', 'public', 'index.html')
module.exports = {
  http: process.env.HTTP_PORT || 0,
  /** @param {number} port */
  setHttpPort(port) {
    if (!this.http) this.http = port
  },
  cleanHtml() {
    if (existsSync(indexPath)) {
      const index = fse.readFileSync(indexPath, 'utf-8')
      fse.writeFileSync(indexPath, index.split('\n').pop() || '', 'utf-8')
    }
  }
}
