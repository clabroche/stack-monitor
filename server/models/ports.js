const { existsSync } = require('fs-extra')
const fse = require('fs-extra')
const pathfs = require('path')
const indexPath = pathfs.resolve(__dirname, '..', 'public', 'index.html')
module.exports = {
  http: process.env.HTTP_PORT || 0,
  socket: process.env.SOCKET_PORT || 0,
  setHttpPort(port) {
    if (!this.http) this.http = port
    inject(`<script>httpPort = ${port}</script>`)
  },
  setSocketPort(port) {
    if (!this.socket) this.socket = port
    inject(`<script>socketPort = ${port}</script>`)
  },
  cleanHtml() {
    if (existsSync(indexPath)) {
      const index = fse.readFileSync(indexPath, 'utf-8')
      fse.writeFileSync(indexPath, index.split('\n').pop() || '', 'utf-8')
    }
  }
}

function inject(html) {
  console.log(indexPath)
  if (existsSync(indexPath)) {
    const index = fse.readFileSync(indexPath, 'utf-8')
    fse.writeFileSync(indexPath, html + '\n' + index, 'utf-8')
  }
}