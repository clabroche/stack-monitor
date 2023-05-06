<template>
  <div>
    <table>
      <tr v-for="line of computedGraph" class="line" :class="{active: line.active}" @click="mouseenter(line, $event)">
        <td class="states">
          <div v-for="state of line.states" class="state" :class="{active: state.active}">
            <div v-if="state.label === '|'" class="vertical"></div>
            <div v-if="state.label === '*'" class="current"></div>
            <div v-if="state.label === '\\'" class="backward"></div>
            <div v-if="state.label === '/'" class="forward"></div>
            <div v-if="state.label === '_'" class="neutral"></div>
            <div v-if="state.label === ' '" class="empty"></div>
          </div>
        </td>
        <td>
          <div class="commitMsg">
            {{ line.commitMsg }}
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { cloneDeep } from 'lodash';
import { computed, onMounted, ref, watchEffect } from 'vue';


function getNextCommit(line) {
  return computedGraph.value[computedGraph.value.indexOf(line) + 1]
}

function mouseenter(line, $event, index = null, noClean = false) {
  if(!noClean) {
    console.log('fzfzefezf')
    computedGraph.value.forEach(el => {
      el.active = false
      el.states.map(s => s.active = false)
    })
  }
  const stateIndex = index == null ? line.states.findIndex(s => ['*',  '\\', '/'].includes(s.label)) : index 
  const nextCommit = getNextCommit(line)
  const nextStateIndex = []
  const currentState = line.states[stateIndex]
  if (!currentState) return
  if (currentState?.label === ' ') return
  currentState.active = true
  line.active = true
  const nextIsBackward = (currentState?.label === '*' || (currentState?.label === '|'&& nextCommit.states[stateIndex]?.label === ' ')) && nextCommit.states[stateIndex - 1]?.label === '/'
    || currentState?.label === '/'
  const nextIsSameCommit = currentState?.label === '/' && line.states[stateIndex - 2]?.label === '_' || currentState?.label === '_'
  if(currentState?.label === '_') {
    if(line.states[stateIndex - 2]?.label === '_') nextStateIndex.push({ line, index: stateIndex - 2 })
    else nextStateIndex.push({ line: nextCommit, index: stateIndex - 2 })
  } else if(nextIsSameCommit) {
    nextStateIndex.push({line,index: stateIndex - 2})
  } else {
    const nextIsDoubleBackward = currentState?.label === '/' && nextCommit.states[stateIndex - 2]?.label === '/'
    const nextIsForward = nextCommit.states[stateIndex]?.label === ' ' && nextCommit.states[stateIndex + 1]?.label === '\\'
      || currentState?.label === '\\'
    const nextIsContinue = nextCommit.states[stateIndex]?.label === '|' || nextCommit.states[stateIndex]?.label === '*'
    if (nextIsBackward && !nextIsDoubleBackward) nextStateIndex.push({line: nextCommit,index: stateIndex - 1})
    if (nextIsDoubleBackward) nextStateIndex.push({line: nextCommit,index: stateIndex - 2})
    if (nextIsForward) nextStateIndex.push({line: nextCommit,index: stateIndex + 1})
    if (nextIsContinue) nextStateIndex.push({line: nextCommit,index: stateIndex})
  }
  if(nextCommit) {
    nextStateIndex.forEach(a => {
      mouseenter(a.line, $event, a.index, true)
    })
  }
} 
function mouseleave(line, $event) {
  computedGraph.value.forEach(el => {
    el.active = false
    // el.states.map(s => s.active = false)
  })
}

const props = defineProps({
  graph: {
    type: String,
    default: ''
  }
})
const computedGraph = ref([])

watchEffect(() => {
  if(!props.graph) return []
  computedGraph.value = props.graph.split('\n').map(a => {
    const splitted = a.split('')
    let i = 0
    while(splitted[i] && !splitted[i].match(/[a-zA-Z0-9]/gi)) {
      i++
    }
    const states = splitted.slice(0, i).map(s => ({label: s, active:false}))
    const commitMsg = splitted.slice(i).join('')
    return {
      active: false,
      states,
      commitMsg
    }
  })
})
</script>

<style lang="scss" scoped>
$height: 20px;
table {
  width: 100%;
  table-layout:fixed;
  border-collapse: collapse;
  border: none;
  td {
    border: none;
    padding: 0;
  }
}
.line {
  width: 100%;
  height: $height;
  &:hover {
    // background-color: rgba(0,0,0,0.2);
  }
  &.active {
    background-color: rgba(0,0,0,0.1);
  }
}
.states {
  display: flex;
  height: $height ;
}
.state {
  position: relative;
  &>div {
    width: $height / 2;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    flex-grow: 0;
    flex:1;
  }
  &.active  {
    transform: scale(1.2);
    .current {
      &::before{
        background-color: green !important;
      }
      &::after{
        border-color: green !important;
      }
    }
    .vertical, .forward, .backward, .neutral {
      &::before {
        border-color: green !important;
      }
    }
  }
  .current {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    &::before {
      position: absolute;
      content: '';
      height: $height / 2;
      width: $height / 2;
      border-radius: 50%;
      background-color: grey;
    }
    &::after {
      position: absolute;
      content: '';
      height:  $height;
      border-left: 1px solid grey;
    }
  }
  .vertical, .forward, .backward, .neutral {
    &::before {
      content: '';
      position: absolute;
      height: $height;
      border-left: 1px solid grey;
      position: relative;
      transform-origin: center center;
    }
    &.neutral{

      &::before {
        height: $height;
        width: $height;
        border-bottom: 1px solid grey;
        border-left: none;
      }
    }
    &.backward::before {
      transform:  rotate(-45deg);
      height: calc($height);
    }
    &.forward::before {
      transform: rotate(45deg);
      height: calc($height);
    }
  }
}
.commitMsg {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>