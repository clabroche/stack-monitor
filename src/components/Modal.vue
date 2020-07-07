<template>
  <modal :name="uuid" height="auto" :width="width || '60%'" :scrollable="noScroll ? !noScroll : true" class="modal" @closed="cancel()">
    <div id="modal-content" :style="{height: height || 'auto'}">
      <div class="close-cross" v-if="closeCross" @click="close()">
        <i class="fas fa-times"></i>
      </div>
      <div class="title-modal" v-if="$slots.header" :style="{'font-size': headerFontSize}">
        <slot name="header"></slot>
      </div>
      <div class="body">
        <slot name="body" :data="data"></slot>
      </div>
      <div class="button-box" v-if="!noActions">
        <div class="notif-button validate" :class="{colored}" v-if="!noValidate" @click="validate()">{{ validateString || 'Sauvegarder' }}</div>
        <div class="notif-button cancel" v-if="!noCancel" @click="cancel()">{{ cancelString || 'Annuler' }}</div>
      </div>
    </div>
  </modal>
</template>

<script>
import {Subject} from 'rxjs'
import uuid from 'uuid/dist/v4'
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
    'colored'
  ],
  data() {
    return {
      result: null,
      uuid: uuid(),
      data: null,
      isOpen: false,
      resolve: (data) => data
    }
  },
  watch: {
    value(newVal) {
      this.data = newVal
    }
  },
  methods: {
    cancel() {
      this.close(null)
    },
    validate() {
      this.close(this.value || true)
    },
    close(data) {
      this.isOpen = false
      if (this.result) {
        this.result.next(data)
        this.$modal.hide(this.uuid)
        this.result.unsubscribe()
        this.result = null
      }
      if(this.resolve) {
        this.result = null
        this.resolve(data)
      }
    },
    open(data) {
      this.isOpen = true
      this.data = data
      this.result = new Subject()
      this.result.promise = new Promise((resolve) => {
        this.resolve = resolve
      });
      this.$modal.show(this.uuid)
      return this.result
    }
  }
}
</script>
<style scoped lang="scss">
.modal {
  color: #4A5361;
  #modal-content {
    height: auto;
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

    @media screen and (max-width: 1200px) {
      overflow-y: auto;
    }
    @media screen and (max-height: 900px) {
      overflow-y: auto;
    }

    .title-modal {
      font-size: 1.5rem;
      padding: 20px;
      font-weight: bold;
    }
    .body {
      padding: 20px;
    }
    .subtitle {
      font-size: 24px;
      padding-left: 20px;
      font-weight: bold;
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
      &:hover{
        background-color: #d1d1d1;
        &.colored {
          background-color: #267774;
          color: white;
        }
      }
    }
  }
}
</style>
