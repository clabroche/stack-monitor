<template>
  <donut :radius="8" :arcWidth="3" remainColor='black' :yPadding="2" :data="systemData"
    border="line" label='System'
    :width="width" :height="height"
    :top="top" :left="left"/>
</template>

<script>
import os from 'os'
import pidusageTree from 'pidusage-tree'
export default {
  name: 'system',
  props: {
    width: {default: '10%'},
    height: {default: '10%'},
    left: {default: '10%'},
    top: {default: '10%'},
    project: {default: _ => ({})},
  },
  data() {
    return {
      systemData: []
    }
  },
  mounted() {
    this.watchSystem()
  },
  methods: {
    watchSystem() {
      setInterval(async() => {
        if(!this.project.pid) return 
        try {
          const system = await this.getCPU(this.project.pid)
          this.systemData = [
            {percent: system.cpu, label: 'CPU', color: 'green'},
            {percent: system.mem, label: 'MEM', color: 'green'}
          ]
        } catch (error) {
          console.error(this.project.pid, error)
        }
      }, 1000);
    },
    async getCPU(pid) {
      const tree = await pidusageTree(pid).catch(err => {
        return null
      })
      let cpus = []
      let mem = 0
      let cpuPerc = 0
      let totalMem = 0
      if(tree) {
        Object.keys(tree).map(key => {
          if(tree && tree[key] && tree[key].cpu) cpus.push(tree[key].cpu)
          if(tree && tree[key] && tree[key].memory) mem += tree[key].memory
        })
        cpuPerc = cpus.reduce((prev, curr) => {
          return prev  + curr
        }, 0) / cpus.length
        totalMem = os.totalmem()
      } 
      return {
        cpu: Number.isNaN(cpuPerc / 10) ? 0 : cpuPerc / 10,
        mem: mem / totalMem
      }
    }
  }
}
</script>
