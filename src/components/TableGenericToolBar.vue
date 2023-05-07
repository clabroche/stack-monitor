<template>
  <div class="toolbar">
    <h2 v-if="headerSize == 'h2'">
      <span v-if="!$slots.headerTitle">{{headerTitle}}</span>
      <slot v-else name="headerTitle"></slot>
      <span class="row-count" v-if="rowCount > 0">{{rowCount}}</span>
    </h2>
    <h3 v-else>
      {{headerTitle}}
    </h3>
    <div class="actions">
      <div class="input-container" v-if="filterActive">
        <label for="search" class="icon"><i class="fas fa-search"></i></label>
        <input type="text" id="search" class="search" placeholder="Rechercher..." @input="updateList" :value="filterValue">
      </div>
      <slot/>
    </div>
  </div>
</template>

<script>
import debounce from 'debounce';

export default {
  props: {
    headerTitle: {default: 'Ma table', type: String},
    headerSize: {default: 'h2', type: String},
    rowCount: {default: 0, type:Number},
    filterActive: {default: false, type: Boolean},
    filterValue: {default: '', type: String},
  },
  setup(props, comp) {
    const updateList = debounce(async ($event) => {
      if ($event.target.value.length > 2) {
        comp.emit('update:filterValue', $event.target.value)
      } else {
        comp.emit('update:filterValue', '')
      }
    }, 400, null)
    return {
      updateList,
    }
  }
}
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  margin: auto;
  margin-bottom: 20px;
  h2, h3 {
    margin: auto;
    flex-grow: 1;
    width: max-content;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    &>* {
      margin-left: 10px;
      &:first-child {
        margin-left: 0;
      }
    }
  }
}
span.row-count {
  margin-left:15px;
  font-weight: normal;
  color:#757575;
}
</style>