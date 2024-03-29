<template>
  <section-cmp
    class="configs-root"
    v-if="service" :key="service.label">
    <div class="header">
      <h2>Configuration</h2>
    </div>
    <div class="configs">
      <div class="header-configs">
        <div class="header">
          <i class="fas fa-home" aria-hidden="true"></i>
          <h3>General</h3>
        </div>
      </div>
      <div class="section-configs">
        <div class="key-value" v-if="service.description">
          <div class="key">Description</div>
          <div class="value">{{service.description}}</div>
        </div>
        <div class="key-value" v-if="service.url">
          <div class="key">Url</div>
          <div class="value">{{service.url}}</div>
        </div>
      </div>
      <div class="header-configs">
        <div class="header">
          <i class="fab fa-git-alt" aria-hidden="true"></i>
          <h3>Git</h3>
        </div>
      </div>
      <div class="section-configs">
        <div class="key-value" v-if="service.git.home">
          <div class="key">Home</div>
          <div class="value">{{service.git.home}}</div>
        </div>
        <div class="key-value" v-if="service.git.remote">
          <div class="key">Remote</div>
          <div class="value">{{service.git.remote}}</div>
        </div>
      </div>
      <div class="header-configs">
        <div class="header">
          <i class="fas fa-terminal" aria-hidden="true"></i>
          <h3>Command</h3>
        </div>
      </div>
      <template v-if="service.spawnCmd">
      <div class="section-configs">
        <div class="key-value">
          <div class="key">Executable</div>
          <div class="value">{{service.spawnCmd}}</div>
        </div>
        <div class="key-value">
          <div class="key">Command args</div>
          <div class="value" v-for="(arg, i ) of service.spawnArgs" :key="arg">{{service.spawnArgs[i]}}</div>
        </div>
        <div class="key-value">
          <div class="key">Path</div>
          <div class="value">{{service.spawnOptions.cwd}}</div>
        </div>
      </div>
      </template>
      <template v-if="service.commands?.length">
      <div class="section-configs" v-for="command of service.commands" :key="command.spawCmd">
        <div class="key-value">
          <div class="key">Executable</div>
          <div class="value">{{command?.spawnCmd}}</div>
        </div>
        <div class="key-value">
          <div class="key">Command args</div>
          <div class="value" v-for="(arg, i ) of command.spawnArgs" :key="arg">{{command?.spawnArgs?.[i]}}</div>
        </div>
        <div class="key-value">
          <div class="key">Path</div>
          <div class="value">{{command?.spawnOptions?.cwd}}</div>
        </div>
      </div>
      </template>
      <div class="header-configs">
        <div class="header">
          <i class="fas fa-cog" aria-hidden="true"></i>
          <h3>Envs</h3>
          <input type="text" v-model="searchEnv" placeholder="Search...">
        </div>
        <button @click="exportEnv">Export</button>
      </div>
      <div class="section-configs">
        <div class="key-value" v-for="env of envs" :key="env.key">
          <div class="key" :class="{overrided: env.overrided}">
            {{env.key}}
            <template v-if="env.overrided">
              (<i class="fas fa-exclamation-triangle"></i> Overrided by .env)
            </template>
          </div>
          <div class="value" v-if="!env.overrided">{{env.value || 'ㅤ' }}</div>
          <div class="value" v-else>
            <ul>
              <li>Current: {{env.value}}</li>
              <li style="color:#aaa">Original: {{env.originalValue}}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section-cmp>
</template>

<script>
import { sort } from 'fast-sort';
import { computed, ref } from 'vue';
import Service from '../../../../fronts/app/src/models/service';
import SectionVue from '../../../../fronts/app/src/components/Section.vue';

export default {
  components: {
    sectionCmp: SectionVue,
  },
  props: {
    service: {
      /** @type {import('../../../../fronts/app/src/models/service').default | null} */
      default: null,
      required: true,
      type: Service,
    },
  },
  setup(props) {
    const searchEnv = ref('');
    return {
      searchEnv,
      envs: computed(() => {
        const options = props.service?.spawnOptions || {};
        const overrideEnvs = Object.keys(options.overrideEnvs || {})
          .map((key) => ({
            key,
            value: (options.overrideEnvs || {})[key],
            overrided: (options.env || {})[key] != null,
            originalValue: (options.env || {})[key],
          }));
        const envs = Object.keys(options.env || {})
          .filter((f) => !options.overrideEnvs?.[f])
          .map((key) => ({
            key,
            value: (options.env || {})[key],
            overrided: false,
            originalValue: (options.env || {})[key],
          }));
        return sort([
          ...envs,
          ...overrideEnvs,
        ]).asc([
          (u) => !u.overrided,
          (u) => u.key,
        ]).filter((a) => a.key.toUpperCase().includes(searchEnv.value.toUpperCase()));
      }),
      exportEnv() {
        const envObject = props.service.spawnOptions?.env || {};
        const envString = Object.keys(envObject).map((key) => `${key}=${envObject[key]}`).join('\n');
        const element = document.createElement('a');
        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(envString)}`);
        element.setAttribute('download', '.env');

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      },
    };
  },
};
</script>
<style lang="scss" scoped>
$grey: var(--system-border-borderColor);
.key-value {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  &:last-child {
    margin-bottom: 0;
  }
  .key {
    font-weight: bold;
  }
}
.section-configs {
  margin-left: 20px;
  position: relative;
  padding-bottom: 40px;
  &:last-child {
    padding-bottom: 0;
  }
  &::after {
    content: "";
    top: 0;
    width: 2px;
    height: 100%;
    background: $grey;
    position: absolute;
    left: 0;
  }
  .key {
    margin-left: 40px;
    width: max-content;
    padding: 0 10px;
    border-radius: 4px;
    position: relative;
    background-color: var(--system-accent-backgroundColor3);
    color: white;
    z-index: 1;
    &.overrided {
      background-color: red;
    }
    &::before {
      content: "";
      top: 50%;
      width: 40px;
      height: 0px;
      padding-top: 2px;
      background: linear-gradient(
        90deg, $grey 0%, $grey 100%
      );
      position: absolute;
      left: 0;
      transform: translateX(-100%);
    }
  }
  .value {
    margin-left: 90px;
    position: relative;
    padding: 0 10px;
    border-radius: 4px;
    width: max-content;
    border: 1px solid var(--system-accent-backgroundColor2);
    margin-top: 10px;
    &::before {
      content: "";
      top: 50%;
      width: 40px;
      height: 2px;
      background: linear-gradient(
        90deg, $grey 0%, $grey 100%
      );
      position: absolute;
      left: 0;
      transform: translateX(calc(-100% - 1px));
    }
    &::after {
      content: "";
      bottom: 50%;
      width: 2px;
      height: 31px;
      background: linear-gradient(
        90deg, $grey 0%, $grey 100%
      );
      background: $grey;
      position: absolute;
      left: 0;
      transform: translateX(-41px);
    }
    ul {
      margin: 0;
      padding: 0 10px;
    }
  }
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h2 {
    margin: 0;
    margin-bottom: 20px;
  }
  input {
    height: max-content;
  }
}
.header-configs {
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  i {
    margin-left: 7px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--system-accent-backgroundColor1);
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }
  h3 {
    margin: 0;
  }
  display: flex;
  align-items: center;
  justify-content: space-between;
  &>div{
    display: flex;
    align-items: center;
  }
}
button {
  width: max-content;
}
</style>
