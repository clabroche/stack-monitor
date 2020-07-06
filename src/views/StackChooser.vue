<template>
<div class="stack-chooser-root">
  <section-cmp class="stack-chooser" v-if="Stack.stackConfiguration" header="Choose all services to launch">
    <ul>
      <li v-for="service of Stack.stackConfiguration" :key="'services-'+service.label">
        <input :id="'input-' + service.label" type="checkbox" @input="selectService($event.target.checked, service)" :checked="Stack.stack.indexOf(service) !== -1 ? 'checked' : null">
        <label :for="'input-' + service.label">
          {{service.label}}
        </label>
      </li>
    </ul>
    <div class="actions">
      <button @click="Stack.stack = Stack.stackConfiguration">Select all</button>
      <button @click="validate" class="success">Validate</button>
    </div>
  </section-cmp>
  <div class="version">{{System.version}}</div>
</div>
</template>

<script>
import Stack from '../models/stack'
import System from '../models/system'
import SectionVue from '../components/Section.vue'
export default {
  name: 'StackChooser',
  components: {
    sectionCmp: SectionVue
  },
  data() {
    return {
      Stack,
      System
    }
  },
  async mounted() {
    await Stack.getConfiguration()
  },
  methods: {
    selectService(checked, service) {
      if(checked) {
        Stack.stack.push(service)
      } else {
        Stack.stack.splice(Stack.stack.indexOf(service), 1)
      }
    },
    async validate() {
      await Stack.setCurrentStack()
      this.$router.push({name: 'stack-single'})
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.stack-chooser-root {
  width: 100vw;
  height: 100vh;
  background-color: black;
  background-size: cover;
  background: url(../assets/background2.jpg) no-repeat center fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  .stack-chooser {
    display: flex;
    flex-direction: column;
    border-radius: 4px;
    background-color: #fff;
    border: 1px solid darkgrey;
    box-shadow: 0px 0px 12px 0px #000000;
    max-width: 400px;
    min-width: 200px;
    .header {
      font-size: 2em;
      margin-bottom: 20px;
    }
    .content {
      li {
        margin-bottom: 5px;
        font-size: 1.1em;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
  ul {
    list-style: none;
      margin: 0;
      padding: 0;
    li {
    }
  }
  .version {
    background-color: rgb(255, 255, 255);
    border-radius: 4px;
    padding: 0px 5px;
    border: 1px solid darkgrey;
    position: fixed;
    bottom: 10px;
    right: 10px;
  }
}
</style>
