<template>
  <div class="npm-root" v-if="isNpm && packageJson">
    <section-cmp class="scripts-container" :key="service.label" header="Scripts">
      <div class="command-container">
        <div class=button-container>
          <button @click="run('install')">
            <i class="fas fa-play" aria-hidden="true"></i>
          </button>
          install
        </div>
      </div>
      <div class="command-container">
        <div class=button-container>
          <button @click="run('rebuild')">
            <i class="fas fa-play" aria-hidden="true"></i>
          </button>
          rebuild
        </div>
      </div>
      <div v-for="(script, command) of packageJson.scripts" :key="command" :title="script">
        <div>
          <button @click="run(command)">
            <i class="fas fa-play" aria-hidden="true"></i>
          </button>
          {{command}}
        </div>
      </div>
    </section-cmp>
    <section-cmp class="dependencies-container" :key="service.label" v-if="!isInMultiMode">
      <div class="categ"
      v-for="categ of ['dependencies','devDependencies'].filter(categ => packageJson[categ])"
      :key="categ">
        <h2 class="dep-header">{{categ.charAt(0).toUpperCase() + categ.slice(1)}}</h2>
        <div class="dependecies">
          <table>
            <caption>{{categ}} Table</caption>
            <tr>
              <th scope="name">name</th>
              <th class="version" scope="version">version</th>
              <th class="version" scope="wanted">wanted</th>
              <th class="version" scope="latest">latest</th>
            </tr>
            <tr v-for="(version, name) of packageJson[categ]" :key="name">
              <td>{{name}}</td>
              <td>{{version}}</td>
              <td :class="{
                success: outdated && !outdated?.[name]?.wanted,
                error: outdated?.[name]?.wanted && outdated?.[name]?.current !== outdated?.[name]?.wanted
              }">
                <spinner :size="20" v-if="!outdated"/>
                <div v-else-if="!outdated?.[name]">
                  <i class="fas fa-check" aria-hidden="true"/>
                </div>
                <div v-else>
                  <i class="fas fa-times" aria-hidden="true"/>
                  {{outdated?.[name]?.wanted}}
                </div>
              </td>
              <td :class="{
                success: outdated && !outdated?.[name]?.wanted,
                error: outdated?.[name]?.latest && outdated?.[name]?.current !== outdated?.[name]?.latest
              }">
                <spinner :size="20" v-if="!outdated"/>
                <div v-else-if="!outdated?.[name]">
                  <i class="fas fa-check" aria-hidden="true"/>
                </div>
                <div v-else>
                  <i class="fas fa-times" aria-hidden="true"/>
                  {{outdated?.[name]?.latest}}
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </section-cmp>
  </div>

</template>

<script>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Service from '../../../../fronts/app/src/models/service';
import SectionVue from '../../../../fronts/app/src/components/Section.vue';
import Spinner from '../../../../fronts/app/src/components/Spinner.vue';

export default {
  components: {
    sectionCmp: SectionVue,
    Spinner,
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
    const router = useRouter();
    const isNpm = ref(false);
    /** @type {import('vue').Ref<Record<string, any> | null>} */
    const packageJson = ref(null);
    /** @type {import('vue').Ref<import('../../backend/index').Outdated | null>} */
    const outdated = ref(null);
    const reload = async () => {
      if (props.service) {
        isNpm.value = await props.service.isNpm();
        packageJson.value = await props.service.getPackageJSON();
        outdated.value = await props.service.outdatedNpm();
      }
    };
    onMounted(reload);
    watch(() => props.service, reload);
    return {
      isNpm,
      packageJson,
      outdated,
      /** @param {string} command */
      async run(command) {
        if (props.service) {
          if (['install', 'build', 'rebuild'].includes(command)) {
            await props.service.sendTerminalPrompt({
              message: `npm ${command}`,
            });
          } else {
            await props.service.sendTerminalPrompt({
              message: `npm run ${command}`,
            });
          }
          router.push({ path: router.currentRoute.value.fullPath, query: { ...router.currentRoute.value.query || {}, tab: 'Logs' } });
        }
      },
    };
  },
};
</script>
<style lang="scss" scoped>
.npm-root {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.scripts-container {
  flex-grow: 1;
  width: auto;
  height: max-content;
  min-width: 300px;
}
.dependencies-container {
  flex-grow: 4;
  width: auto;
}
button {
  width: 20px;
  height: 20px;
  font-size: 0.7em;
  padding: 0;
}
.fa-spinner {
  animation-name: spin;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  &, ::before {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 12px;
    height: 12px;
  }
}
@keyframes spin {
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
}
.categ {
  &:first-of-type{
    .dep-header {
      margin-top: 0;
    }
  }
  .dep-header {
    margin-top: 40px;
    margin-bottom: 0;
  }
  tr {
    &.success td {
      color: green;
    }
  }
}
table caption {
  display: none;
}
table {
  width: 100%;
  th {
    text-align: left;
    &.version {
      width: 150px;
    }
  }
  tr {
    transition: 300ms;
    td.error{
      color: red;
    }
    td.success{
      color: green;
    }
    &:hover {
      background-color: rgba(0,0,0,0.05);
    }
  }
}
</style>
