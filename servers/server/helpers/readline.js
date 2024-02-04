const { Readable } = require('stream')

const EventEmitter = require('events').EventEmitter

module.exports = class extends EventEmitter {
  /**
   * 
   * @param {{input?: Readable, emitAfterNoDataMs?: number}} options 
   */
  constructor(options = {}) {
    super()
    this.options = options
    if(options.input) this.linkToInput(options.input)
    /** @type {string[]} */
    this.all = []
    /** @type {NodeJS.Timeout|undefined}*/
    this.timeout = undefined
  }
  /**
   * 
   * @param {Readable} readStream 
   */
  linkToInput(readStream) {
    readStream.on('data', (data) => {
      clearTimeout(this.timeout)
      data = data.toString('utf-8') 
      var dataLen = data.length;
      for (var i = 0; i < dataLen; i++) {
        const char = data[i]
        if(char === '\n' || char === '\r\n') {
          this.#emit()
        } else {
          this.all.push(char)
        }
        if(this.options.emitAfterNoDataMs) {
          this.timeout = setTimeout(() => {
            this.#emit()
          }, this.options.emitAfterNoDataMs);
        }
      }
    })
  }
  #emit(){
    if(!this.all.length) return
    const line  = this.all.splice(0, this.all.length).join('')
    this.emit('line', line)
  }
}