<template>
  <div class="root" :class="{ column, reorder }" @click.stop :style="{ width }">
    <div ref="input" class="input" :class="{ open: isOpen }" @click.stop="open()">
      <div v-if="!value.length && !isOpen" class="placeholder">
        {{ placeholder }}
      </div>
      <div v-if="!value.length && isOpen" class="placeholder">
        Choisir une entrée ci-dessous...
      </div>
      <spinner class="spinner" :size="20" v-if="opening"></spinner>
      <div class="labels">
        <div v-for="itemValue in value" :key="getKey(itemValue)" class="item-container" @dragstart="drag(itemValue)"
          @dragenter="drop(itemValue)" :draggable="reorder">
          <div class="label">
            {{ getLabel(itemValue) }}
          </div>
          <div class="delete" @click.stop="deleteTag(itemValue)">
            <i class="fas fa-trash"></i>
          </div>
        </div>
        <div class="random" v-if="random" @click.stop="selectRandom">
          <i class="fas fa-sync"></i>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div class="container" v-if="isOpen">
        <div class="search-actions">
          <input type="text" ref="filterRef" placeholder="Rechercher..." @input="filter()"
            @keypress.enter="select($event.target.value)" />
          <button v-if="dynamic" class="add-button">
            <em class="fas fa-plus"></em>
          </button>
        </div>
        <div class="categories" v-if="categories && option.values && option.values.length">
          <div @click="changeCategory(option)" class="category" :class="{
              active:
                option.name === currentCateg.name && option.name !== undefined,
            }" v-for="option of options" :key="option.name">
            {{ option.name }}
          </div>
        </div>
        <div class="options-container">
          <div v-for="option in filteredOptions" :key="getKey(option)" class="item"
            :id="'multiselect-item-' + getLabel(option)" @click="select(option)">
            <span>{{ getLabel(option) }}</span>
            <span v-if="option.additionnal">{{ option.additionnal }}</span>
          </div>
        </div>
        <div class="count" v-if="filteredOptions && filteredOptions.length">
          {{ filteredOptions.length }} entrée
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { some } from "lodash-es";
import Spinner from "./Spinner.vue";
import { ref, onMounted, nextTick, watch, getCurrentInstance } from 'vue';
export default {
  name: "multiselect",
  $_veeValidate: {
    // fetch the current value from the innerValue defined in the component data.
    value() {
      return this.value;
    },
    name() {
      return this.name;
    }
  },
  props: {
    options: { default: () => [] },
    value: { default: () => [] },
    initialValue: { default: () => [] },
    customLabel: { default: null },
    customKey: { default: null },
    width: { default: "auto" },
    single: { default: false },
    categories: { default: false },
    name: { default: 'name' },
    reorder: { default: false },
    placeholder: { default: "Cliquez pour choisir..." },
    max: { default: Infinity },
    dynamic: { default: false },
    column: { default: false },
    oninput: { default: () => { } },
    random: { default: false }
  },
  components: {
    spinner: Spinner,
  },
  setup(props, comp) {
    const instance = getCurrentInstance()?.proxy;
    const isOpen = ref(false)
    const filteredOptions = ref([])
    const currentCateg = ref(null)
    const count = ref(0)
    const opening = ref(false)
    const filterRef = ref(null)
    const localValue = ref(props.value)
    localValue.value.push(...props.initialValue)
    watch(() => props.value, () => localValue.value = props.value, { deep: true })
    function emit() {
      comp.emit('update:value', props.value)
      if (props.oninput) props.oninput(localValue.value)
    }
    const getLabel = (option) => {
      return currentCateg.value?.customLabel
        ? option[currentCateg.value.customLabel]
        : option[props.customLabel] || option
    }
    const getKey = (option) => {
      return currentCateg.value?.customKey
        ? option[currentCateg.value.customKey]
        : option[props.customKey] || option
    }
    const filter = () => {
      const value = filterRef.value?.value
        ? filterRef.value.value.toUpperCase()
        : ''
      let options = props.options
      if (props.categories && currentCateg.value) {
        options = props.options
          .filter((opt) => opt.name === currentCateg.value.name)
          .pop().values
      }
      filteredOptions.value = options.filter((option) => {
        // @ts-ignore
        if (some(props.value, option) || props.value.includes(option)) {
          return false
        }
        const label = getLabel(option)
        const key = getKey(option)
        return (
          (label && typeof label === 'string' && label.toUpperCase().includes(value)) ||
          (key && typeof key === 'string' && key.toUpperCase().includes(value))
        )
      })
    }
    onMounted(() => {
      filteredOptions.value = props.options
      if (props.categories) {
        currentCateg.value = props.options[0]
      }
      filter()
    })
    const select = value => {
      if (localValue.value.length >= props.max) return
      const index = filteredOptions.value.indexOf(value)
      let valueToPush
      if (index !== -1) {
        filteredOptions.value.splice(index, 1)
        valueToPush = value
      } else if (props.dynamic && !localValue.value.includes(value)) {
        valueToPush = value
      }
      if (props.single) {
        localValue.value.pop()
        isOpen.value = false
      }
      if (valueToPush) {
        localValue.value.push(valueToPush)
        if (filterRef.value) {
          filterRef.value.value = ''
          filter()
        }
        filter()
        instance.$forceUpdate()
      }
      emit()
    }
    const selectRandom = () => {
      const random = filteredOptions.value[Math.floor(Math.random() * filteredOptions.value.length)]
      select(random)
    }
    let currentDrag = null
    return {
      isOpen,
      filteredOptions,
      currentCateg,
      count,
      opening,
      filterRef,
      getKey,
      getLabel,
      filter,
      selectRandom,
      drag(item) {
        currentDrag = item
      },
      drop(destination) {
        const indexDestination = localValue.value.indexOf(destination)
        const indexSource = props.value.indexOf(currentDrag)
        if (indexDestination > -1 && indexSource > -1 && destination !== currentDrag) {
          const temp = localValue.value[indexSource];
          localValue.value[indexSource] = localValue.value[indexDestination];
          localValue.value[indexDestination] = temp;
        }
        emit()
      },
      changeCategory(category) {
        currentCateg.value = category
        filter()
      },
      async open() {
        opening.value = true
        await nextTick()
        isOpen.value = true
        filter()
        await nextTick()
        await nextTick()
        if (filterRef.value) {
          filterRef.value.focus()
        }
        const cb = () => {
          isOpen.value = false
          document.removeEventListener("click", cb)
        }
        document.addEventListener("click", cb, false)
        opening.value = false
      },
      select,
      deleteTag(value) {
        const index = props.value.indexOf(value)
        localValue.value.splice(index, 1)
        filteredOptions.value.push(value)
        filter()
        instance.$forceUpdate()
        emit()
      },
    };
  },
};
</script>
<style scoped lang="scss" >
.input {
  background-color: #fff;
  width: auto;
  cursor: pointer;
  min-height: 30px;
  border: 1px solid lightgrey;
  padding: 5px 10px;
  position: relative;
  border-radius: 15px;
  display: flex;
  align-items: center;
  transition: 300ms;

  &.open {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .spinner {
    position: absolute;
    top: -10px;
    right: -10px;
    height: 100%;
  }

  .placeholder {
    color: #a1a1a1;
    padding-top: 4px;
  }

  .random {
    position: absolute;
    top: 50%;
    transform: translateY(-45%);
    right: 10px;
    font-size: 1.4em;
  }

  .item-container {
    border: 1px solid lightgrey;
    display: inline-block;
    border-radius: 15px;
    overflow: hidden;
    $gradient: 50deg, #1d95db 0%, #074971 100%;
    background: -webkit-linear-gradient($gradient);
    background: linear-gradient($gradient);
    max-width: 100%;
    padding: 5px;
    box-sizing: border-box;
    position: relative;
    opacity: 1;
    transition: 200ms;
    transition-property: opacity, transform;

    &>div {
      color: white;
      // height 1.2em
      padding: 5px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      opacity: 1;
    }

    .delete {
      transition: 200ms;
      transition-property: opacity;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      opacity: 0;
      color: white;
    }

    &:hover {
      transform: scale(1.05);

      .delete {
        background-color: rgba(0, 0, 0, 0.3);
        opacity: 1;
      }

      &>div {
        opacity: 0;
      }
    }
  }
}

.container {
  width: 100%;
  position: absolute;
  z-index: 1;
  max-height: 300px;
  opacity: 1;
  overflow: hidden;
  box-sizing: border-box;
  background-color: #fff;
  border: 1px solid lightgrey;
  border-top: none;
  display: flex;
  flex-direction: column;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;

  .search-actions {
    width: auto;
    margin: 10px;
    margin-bottom: 10px;
    display: flex;

    input {
      flex-grow: 1;
    }

    .add-button {
      width: 20px;
      padding: 0;
      background-color: transparent;
      border-color: transparent;
      color: #717171;
    }
  }

  .categories {
    display: flex;
    align-items: flex-end;
    padding-left: 10px;
    border-bottom: 1px solid #c8c8c8;
    flex-shrink: 0;

    &>div {
      padding-left: 10px;
      padding-right: 10px;
      padding-top: 2px;
      padding-bottom: 2px;
      bottom: -1px;
      position: relative;
      font-size: 0.9em;
      cursor: pointer;
      color: #777;

      &:hover {
        color: black;
      }

      &.active {
        border-top: 1px solid #c8c8c8;
        border-left: 1px solid #c8c8c8;
        border-right: 1px solid #c8c8c8;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        background-color: white;
        color: black;
      }
    }
  }

  .item {
    cursor: pointer;
    padding: 7px;
    padding-left: 10px;
    padding-right: 10px;
    font-size: 0.9em;
    display: flex;
    justify-content: space-between;

    &:hover,
    &.selected {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  .options-container {
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #fff;
  }
}

.count {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  border-top: 1px solid #c8c8c8;
  color: #717171;
  padding-right: 5px;
  font-size: 0.7em;
}

.root {
  position: relative;

  &.column {
    .labels {
      flex-direction: column;
    }
  }

  .labels {
    flex-wrap: wrap;
    display: flex;
  }

  &.reorder {
    .labels {
      .label {
        opacity: 1;
      }

      .delete {
        width: 50px;
        right: 0;
        left: auto;
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: max-height 0.2s, opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>