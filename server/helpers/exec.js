const { exec } = require('child_process')

module.exports = {
  /**
   * @param {string} cmd 
   * @param {import('child_process').ExecOptions} options 
   * @returns {Promise<string>}
   */
  execAsync: function(cmd, options) {
    return new Promise((res, rej) => {
      exec(cmd, options, (err, stdout, stderr) => {
        if (err) return rej(stderr || err)
        res(stdout)
      })
    })
  },
  /**
   * @param {string} cmd 
   * @param {import('child_process').ExecOptions} options 
   * @returns {Promise<string>}
   */
  execAsyncWithoutErr: function (cmd, options) {
    return new Promise(res => {
      exec(cmd, options, (err, stdout) => {
        res(stdout)
      })
    })
  },
  /**
   * @param {string} cmd 
   * @param {import('child_process').ExecOptions} options 
   * @returns {Promise<string>}
   */
  execAsyncGetError: function (cmd, options) {
    return new Promise(res => {
      exec(cmd, options, (err, stdout, stderr) => {
        res(stderr)
      })
    })
  }
}