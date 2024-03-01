<template>
  <section-cmp v-if="service" :key="service.label">
    <h2>Docker</h2>
    <ul>
      <li v-for="info of infos">
        <div class="label">{{labelTrad[info.label] || info.label}}</div>
        <div class="value">
          <JsonTreeView v-if="info.type === 'json'" class="json" :maxDepth="1" :json="stringifiedJSON(info.value)" :copyable="true"/>
          <div v-else>
            {{ info.value }}
          </div>
        </div>
      </li>
    </ul>
  </section-cmp>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { JsonTreeView } from 'json-tree-view-vue3';
import Service from '../../../../fronts/app/src/models/service';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import Socket from '../../../../fronts/app/src/helpers/Socket';

const labelTrad = {
  containerName: 'Name of container',
  isAlive: 'Is Alive',
  pid: 'PID',
  dockerInfos: 'More infos',
};

const props = defineProps({
  service: {
    default: null,
    required: true,
    type: Service,
  },
});
const infos = ref([]);

const stringifiedJSON = (json) => {
  try {
    return JSON.stringify(json);
  } catch (error) {
    return '{}';
  }
};

async function reload() {
  const { data: _infos } = await axios.get(`/docker/${props.service.label}`);
  infos.value = _infos;
}
onMounted(reload);

Socket.socket?.on('stack:selectConf', reload);
Socket.socket?.on('service:crash', reload);
Socket.socket?.on('service:start', reload);
Socket.socket?.on('service:exit', reload);
Socket.socket?.on('service:healthcheck:down', reload);
Socket.socket?.on('service:healthcheck:up', reload);

onUnmounted(() => {
  Socket.socket?.off('stack:selectConf', reload);
  Socket.socket?.off('service:crash', reload);
  Socket.socket?.off('service:start', reload);
  Socket.socket?.off('service:exit', reload);
  Socket.socket?.off('service:healthcheck:down', reload);
  Socket.socket?.off('service:healthcheck:up', reload);
});

</script>
<style lang="scss" scoped>
h2 {
  margin: 0;
}
li {
  display: flex;
  .label {
    width: 300px;
  }
  &:nth-child(odd) {
    background-color: rgba(0,0,0,0.05);
  }
  .json {
    margin: 0;
    padding: 0;
  }
}
</style>
