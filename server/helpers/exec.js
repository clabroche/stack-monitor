const { exec, spawn } = require('child_process')

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
   * @param {string} spawnCmd 
   * @param {string[]} spawnArgs 
   * @param {import('child_process').SpawnOptions} spawnOptions 
   * @returns {Promise<string>}
   */
  spawnAsync: function (spawnCmd, spawnArgs = [], spawnOptions = {}) {
    return new Promise((res, rej) => {
      const spawnProcess = spawn(spawnCmd, spawnArgs, spawnOptions)
      /**
       * @type {Buffer[]}
       */
      let stdout = []
      spawnProcess.stdout?.on('data', (data) => {
        stdout.push(data)
      })
      spawnProcess.stderr?.on('data', (message) => {
        rej(message?.toString())
      })
      spawnProcess.on('exit', () => res(Buffer.concat(stdout).toString()))
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