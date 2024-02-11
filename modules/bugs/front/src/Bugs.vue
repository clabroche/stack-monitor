<template>
  <section-cmp
    v-if="service" :key="service.label"
    :header="'Bugs(' + (bugs?.length || 0) + ')'"
    class="bug-root"
    :style="{maxHeight: isInMultiMode ? '400px' : 'inherit' }"
    :actions="[{label: 'Reload', icon: 'fas fa-sync', click: () => reload(), hidden: loading}]"
    >
    <div v-if="loading" class="loading">
      <spinner  :size="40"></spinner>
      Analyse en cours
    </div>
    <div v-else class="bugs">
      <div class="bug" :class="bug.category" v-for="bug of bugs" :key="bug">
        <div class="path" @click="openInVsCode(bug)">{{bug.fileName}}({{bug.line}},{{bug.column}})</div>
        <div class="message">{{bug.messageText}}</div>
      </div>
    </div>
  </section-cmp>
</template>

<script>
import { onMounted, ref, watch } from 'vue';
import Service from '../../../../fronts/app/src/models/service';
import SectionVue from '../../../../fronts/app/src/components/Section.vue';
import SpinnerVue from '../../../../fronts/app/src/components/Spinner.vue';
import notification from '../../../../fronts/app/src/helpers/notification';

export default {
  components: {
    sectionCmp: SectionVue,
    spinner: SpinnerVue,
  },
  props: {
    service: {
      /** @type {import('../../../../fronts/app/src/models/service').default | null} */
      default: null,
      required: true,
      type: Service,
    },
    isInMultiMode: {
      type: Boolean,
    },
  },
  setup(props) {
    const bugs = ref([]);
    const loading = ref(true);
    const reload = (() => (async () => {
      bugs.value = [];
      loading.value = true;
      bugs.value = await props.service.getBugs()
        .catch((err) => {
          if (err?.response?.data?.code === 'TSC_NOT_FOUND') {
            notification.next('error', 'Please "npm i -g typescript"');
          }
          if (err?.response?.data?.code === 'JSCONFIG_NOT_FOUND') {
            notification.next('error', 'Please create a jsconfig.json in project');
          }
          return [];
        });
    })()
      .then(() => { loading.value = false; })
      .catch(() => { loading.value = false; }));
    onMounted(reload);
    watch(() => props.service, reload);

    return {
      reload,
      loading,
      bugs,
      /**
       *
       * @param {{
       *  code: string,
       *  category: string,
       *  fileName: string,
       *  line: string,
       *  path: string,
       *  messageText: string,
       * }} bug
       */
      openInVsCode(bug) {
        props.service.openLinkInVsCode(bug.path);
      },
    };
  },
};
</script>
<style lang="scss" scoped>
.loading {
  display: flex;
  align-items: center;
  .spinner {
    margin-right: 10px;
  }
}
.bug-root {
  width: 100%;
  margin: auto;
  height: calc(100vh - 300px - 40px);

  @media (max-width: 1300px) {
    height: calc(100vh - 400px - 40px);
  }
  @media (max-width: 900px) {
    height: calc(100vh - 500px - 40px);
  }
  box-sizing: border-box;
}
.bug {
  margin-top: 10px;
  padding: 5px 10px;
  box-sizing: border-box;
  color: #555;
  &.error {
    border-left: 2px solid #d62b2b;
    .path {color: #d62b2b }
  }
  &.info {
    border-left: 2px solid #1d93d9;
    .path {color: #1d93d9 }
  }
  &.warning {
    border-left: 2px solid #f27601;
    .path {color: #f27601 }
  }
  .path {
    font-size: 0.8em;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
