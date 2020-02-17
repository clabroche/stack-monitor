<template>
  <div class="hello">
    <!-- <vue-term v-if="service" ></vue-term> -->
    <div v-if="service" class="logs-container" ref="logsContainer" id="terminal">
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
import Socket from '../helpers/socket';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

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
    const terminal = new Terminal({
      experimentalCharAtlas: 'static',
      columns: 12600,
      theme: '',
      convertEol: true,
      disableStdin: true,
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    this.terminal = terminal
    terminal.open(this.$refs.logsContainer);
    terminal.resize(100, terminal.rows)
    const logs = await Stack.getLogs(this.service.label)
    logs.split('\n').map(line => terminal.writeln(line))
    Socket.on('logs:update', data => {
      if(data.label !== this.service.label || !data.msg) return 
      data.msg.trim().split('\n').filter(a => a).map(line => {
        terminal.writeln(line)
      })
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

#terminal {
  width: 100%;
}
.logs-container {
  background-color: #000000;
  color: white;
  width: 100%;
  margin: auto;
  height: 400px;
  // height: 1000px;
  box-sizing: border-box;
}

</style>
<style lang="scss">
@import '~xterm/dist/xterm.css';


</style>