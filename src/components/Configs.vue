<template>
  <section-cmp
    v-if="service" :key="service.label"
    maxHeight="400px">
    <div class="header">
      <h2>Configuration</h2>
    </div>
    <div class="configs">
      <div class="header-configs">
        <i class="fas fa-home" aria-hidden="true"></i>
        <h3>General</h3>
      </div>
      <div class="section-configs">
        <div class="key-value">
          <div class="key">Description</div>
          <div class="value">{{service.description}}</div>
        </div>
        <div class="key-value">
          <div class="key">Url</div>
          <div class="value">{{service.url}}</div>
        </div>
      </div>
      <div class="header-configs">
        <i class="fab fa-git-alt" aria-hidden="true"></i>
        <h3>Git</h3>
      </div>
      <div class="section-configs">
        <div class="key-value">
          <div class="key">Home</div>
          <div class="value">{{service.git.home}}</div>
        </div>
        <div class="key-value">
          <div class="key">Remote</div>
          <div class="value">{{service.git.remote}}</div>
        </div>
      </div>
      <div class="header-configs">
        <i class="fas fa-terminal" aria-hidden="true"></i>
        <h3>Command</h3>
      </div>
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
      <div class="header-configs">
        <i class="fas fa-cog" aria-hidden="true"></i>
        <h3>Envs</h3>
      </div>
      <div class="section-configs">
        <div class="key-value" v-for="(value, key) of service.spawnOptions.env" :key="key">
          <div class="key">{{key}}</div>
          <div class="value">{{service.spawnOptions.env[key]}}</div>
        </div>
      </div>
    </div>
  </section-cmp>
</template>

<script>
import Service from '../models/service'
import SectionVue from './Section.vue'
export default {
  components: {
    sectionCmp: SectionVue,
  },
  props: {
    service: {
      /** @type {import('../models/service').default}*/
      default: null,
      required: true,
      type: Service
    },
  },
}
</script>
<style lang="scss" scoped>
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
  .value {
    height: calc(1em + 7px);
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
    background: #1d94d9;
    position: absolute;
    left: 0;
  }
  .key {
    margin-left: 40px;
    width: max-content;
    padding: 0 10px;
    border-radius: 4px;
    position: relative;
    background-color: #084b74;
    color: white;
    z-index: 1;
    &::before {
      content: "";
      top: 50%;
      width: 40px;
      height: 0px;
      padding-top: 2px;
      background: rgb(19,37,89);
      background: linear-gradient(90deg, #1d94d9 0%, rgba(19,37,89,1) 100%);
      position: absolute;
      left: 0;
      transform: translateX(calc(-100% + 1px));
    }
  }
  .value {
    margin-left: 90px;
    position: relative;
    padding: 0 10px;
    border-radius: 4px;
    width: max-content;
    border: 1px solid rgba(111,185,154,1);
    margin-top: 10px;
    &::before {
      content: "";
      top: 50%;
      width: 40px;
      height: 2px;
      background: rgb(19,37,89);
      background: linear-gradient(90deg, rgba(19,37,89,1) 0%, rgba(111,185,154,1) 100%);
      position: absolute;
      left: 0;
      transform: translateX(calc(-100% - 1px));
    }
    &::after {
      content: "";
      bottom: 50%;
      width: 2px;
      height: 31px;
      background: rgb(19,37,89);
      background: linear-gradient(90deg, rgba(19,37,89,1) 0%, rgba(111,185,154,1) 100%);
      position: absolute;
      left: 0;
      transform: translateX(-41px);
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
  i {
    margin-left: 7px;
    margin-right: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #1d94d9;
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
}
</style>