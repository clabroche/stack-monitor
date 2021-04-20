const { exec } = require('child_process')

module.exports = {
  execAsync: function(cmd, options) {
    return new Promise((res, rej) => {
      exec(cmd, options, (err, stdout, stderr) => {
        if (err) return rej(stderr || err)
        res(stdout)
      })
    })
  },
  execAsyncWithoutErr: function (cmd, options) {
    return new Promise(res => {
      exec(cmd, options, (err, stdout) => {
        console.log(err)
        res(stdout)
      })
    })
  },
  execAsyncGetError: function (cmd, options) {
    return new Promise(res => {
      exec(cmd, options, (err, stdout, stderr) => {
        res(stderr)
      })
    })
  }
}