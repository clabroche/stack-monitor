<template>
  <div>
    <table>
      {{ grid }}
      <tr v-for="line of computedGraph" class="line" :class="{active: line.active}" @click="mouseenter(line, $event)">
        <td class="states">
          {{ line.parent }}
        </td>
        <td>
          <div class="commitMsg">
            {{ line.abbreviated_commit }} {{ line.subject }}
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { cloneDeep } from 'lodash';
import { computed, onMounted, ref, watchEffect } from 'vue';


const props = defineProps({
  graph: {
    /** @type {never[]} */
    default: []
  }
})
const computedGraph = ref([])

const grid = computed(() => {
  computedGraph.value.forEach(line => {
    console.log(line)
  })
})

watchEffect(() => {
  if(!props.graph) return []
  computedGraph.value = props.graph
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