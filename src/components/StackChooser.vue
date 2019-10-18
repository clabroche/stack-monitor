<template>
  <div class="stack-chooser" v-if="Stack.stackConfiguration">
    <div class="header">Choose all services to launch: </div>
    <div class="content">
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
    </div>
  </div>
</template>

<script>
import Stack from '../models/stack'
export default {
  name: 'StackChooser',
  data() {
    return {
      Stack,
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
.stack-chooser {
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 20px;
  color: white;
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
</style>
