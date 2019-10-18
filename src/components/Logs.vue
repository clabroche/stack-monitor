<template>
  <div class="hello">
    <div v-if="service" class="logs-container" ref="logsContainer">
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
import Socket from '../helpers/socket';
export default {
  name: 'Logs',
  props: {
    service: {default: null}
  },
  data() {
    return {
      Stack,
    }
  },
  async mounted() {
    await new Promise(resolve=> setTimeout(resolve, 10));
    var term = require('hypernal')();
    term.tail = true
    term.appendTo(this.$refs.logsContainer);
    const logs = await Stack.getLogs(this.service.label)
    term.reset()
    term.write(logs)
    Socket.on('logs:update', data => {
      if(data.label !== this.service.label) return 
      term.write(data.msg)
    })
    if(this.$refs.logsContainer) {
      this.$refs.logsContainer.scrollTo({
        'behavior': 'smooth',
        'left': 0,
        'top': this.$refs.logsContainer.offsetHeight + 1000000
      });
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.logs-container {
  padding: 10px;
  background-color: #000000;
  color: white;
  width: 100%;
  margin: auto;
  height: 400px;
  // height: 1000px;
  overflow: auto;
  box-sizing: border-box;
}

</style>
<style lang="scss">


.xterm {
    font-feature-settings: "liga" 0;
    position: relative;
    user-select: none;
    -ms-user-select: none;
    -webkit-user-select: none;
}

.xterm.focus,
.xterm:focus {
    outline: none;
}

.xterm .xterm-helpers {
    position: absolute;
    top: 0;
    /**
     * The z-index of the helpers must be higher than the canvases in order for
     * IMEs to appear on top.
     */
    z-index: 10;
}

.xterm .xterm-helper-textarea {
    /*
     * HACK: to fix IE's blinking cursor
     * Move textarea out of the screen to the far left, so that the cursor is not visible.
     */
    position: absolute;
    opacity: 0;
    left: -9999em;
    top: 0;
    width: 0;
    height: 0;
    z-index: -10;
    /** Prevent wrapping so the IME appears against the textarea at the correct position */
    white-space: nowrap;
    overflow: hidden;
    resize: none;
}

.xterm .composition-view {
    /* TODO: Composition position got messed up somewhere */
    background: #000;
    color: #FFF;
    display: none;
    position: absolute;
    white-space: nowrap;
    z-index: 1;
}

.xterm .composition-view.active {
    display: block;
}

.xterm .xterm-viewport {
    /* On OS X this is required in order for the scroll bar to appear fully opaque */
    background-color: #000;
    overflow-y: scroll;
    cursor: default;
    position: absolute;
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
}

.xterm .xterm-screen {
    position: relative;
}

.xterm .xterm-screen canvas {
    position: absolute;
    left: 0;
    top: 0;
}

.xterm .xterm-scroll-area {
    visibility: hidden;
}

.xterm-char-measure-element {
    display: inline-block;
    visibility: hidden;
    position: absolute;
    top: 0;
    left: -9999em;
    line-height: normal;
}

.xterm {
    cursor: text;
}

.xterm.enable-mouse-events {
    /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */
    cursor: default;
}

.xterm.xterm-cursor-pointer {
    cursor: pointer;
}

.xterm.column-select.focus {
    /* Column selection mode */
    cursor: crosshair;
}

.xterm .xterm-accessibility,
.xterm .xterm-message {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 100;
    color: transparent;
}

.xterm .live-region {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

.xterm-dim {
    opacity: 0.5;
}

.xterm-underline {
    text-decoration: underline;
}

</style>