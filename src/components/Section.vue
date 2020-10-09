<template>
  <div class="section">
    <div class="title" v-if="header || actions">
      {{header}}
      <div class="actions">
        <button
          @click="action.click()"
          v-for="action of actions"
          :key="action.label"
          class="action small">
          <i :class="action.icon" v-if="action.icon"  aria-hidden="true"></i>
          <span class="text">{{action.label}}</span>
        </button>
      </div>
    </div>
    <div class="content" :style="{maxHeight}">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    header: {default: ''},
    actions: {default:() => ([])},
    maxHeight: {default: 'auto'}
  }
}
</script>

<style lang="scss" scoped>
.section {
  width: calc(100%);
  margin: 5px 0;
  box-sizing: border-box;
  border: 1px solid #dfdfdf;
  border-radius: 4px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 1px 1px 2px 0px rgba(0, 0, 0, 0.2);
  .title {
    border-bottom: 1px solid #dfdfdf;
    font-size: 1.2em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    box-sizing: border-box;
    position: relative;
    text-align: left;
  }
  .actions {
    display: flex;
  }
  .content {
    overflow: auto;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
  }
}
</style>