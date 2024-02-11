<template>
<teleport to="body">
  <transition name="fade">
    <div  v-if="isOpen" class="modal-root" @click="close()" :class="{right: position==='right'}">
      <div :name="uuid" height="auto" :style="{width:width || '90%'}" :scrollable="noScroll ? !noScroll : true" class="modal" @closed="cancel()" @click.stop>
        <div id="modal-content" :style="{height: height || 'auto'}">
          <div class="close-cross" v-if="closeCross" @click="close()">
            <i class="fas fa-times" aria-hidden="true"></i>
          </div>
          <div class="title-modal" v-if="$slots.header" :style="{'font-size': headerFontSize}">
            <slot name="header" :data="data"></slot>
          </div>
          <div class="body">
            <slot name="body" :data="data"></slot>
          </div>
          <div class="button-box" v-if="!noActions">
            <div class="notif-button cancel" v-if="!noCancel" @click="cancel()">{{ cancelString || 'Annuler' }}</div>
            <div class="notif-button validate" :class="{colored}" v-if="!noValidate" @click="validate()">{{ validateString || 'Sauvegarder' }}</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</teleport>
</template>

<script>
import Subject from '../helpers/CustomObservable'
import { v4 as uuid } from 'uuid';
export default {
  props: [
    'value',
    'width',
    'height',
    'cancelString',
    'validateString',
    'noActions',
    'closeCross',
    'noScroll',
    'headerFontSize',
    'noCancel',
    'noValidate',
    'colored',
    'disabled',
    'position'
  ],
  data() {
    return {
      /** @type {((...args: any[]) => any) | null} */
      resolve: null,
      /** @type {Subject & {promise: Promise} | null} */
      result: null,
      uuid: uuid(),
      data: null,
      isOpen: false
    }
  },
  watch: {
    value(newVal) {
      this.data = newVal
    }
  },
  beforeUnmount() {
    this.close(null)
  },
  methods: {
    cancel() {
      this.close(null)
    },
    validate() {
      if(!this.disabled) {
        this.close(this.value || true)
      }
    },
    /** @param {*} data */
    close(data = null) {
      this.isOpen = false
      if (this.result) {
        this.result.next(data)
        // this.result.unsubscribe()
        this.result = null
      }
      if(this.resolve) {
        this.result = null
        this.resolve(data)
      }
    },
    /** 
     * @param {*} data
     * @return {Subject & {promise: Promise}}
     */
    open(data = null) {
      this.isOpen = true
      this.data = data
      // @ts-ignore
      this.result = new Subject()
      // @ts-ignore
      this.result.promise = new Promise((resolve) => {
        this.resolve = resolve
      });
      // @ts-ignore
      return this.result
    }
  }
}
</script>
<style scoped lang="scss">
.modal-root {
  color: #4A5361;
  z-index: 1299;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0,0,0,0.5);
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 300ms;
  #modal-content {
    background: white;
    height: auto;
    margin: auto;
    .close-cross {
      position: absolute;
      right: 20px;
      top: 10px;
      color: #8a8a8a;
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition-duration: 500ms;
      cursor: pointer;
      i {
        font-size: 15px;
      }
      &:hover {
        background-color: #959595;
        color: white;
        border-radius: 100%;
      }
    }

    .title-modal {
      font-size: 1.5rem;
      padding: 20px;
      padding-bottom: 0;
      font-weight: bold;
    }
    .body {
      padding: 20px;
      overflow: auto;
    }
    .subtitle {
      font-size: 24px;
      padding-left: 20px;
      font-weight: bold;
    }
  }
  &.right {
    justify-content: flex-end;
    #modal-content {
      height: 100vh !important;
      display: flex;
      flex-direction: column;
      .body {
        flex-grow: 1;
      }
    }
  }
}

.button-box {
  display: flex;
  .notif-button {
    color: #4a5361;
    font-size: 18px;
    padding: 12px 0px 12px 0px;
    background-color: #eaebed;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    cursor: pointer;
    transition: 300ms;
    &.colored {
      background-color: #26928e;
      color: white;
    }
    &:hover {
      background-color: #d1d1d1;
      &.colored {
        background-color: #267774;
        color: white;
      }
    }
  }
}

.fade-enter-active,.fade-leave-active {
  transition: all 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(10px);
}
.fade-enter-active {
  top: 0;
  width: 100%;
}
</style>
