<template>
  <transition-group tag="div" class="root-notification" name="slide">
    <div v-for="notif of notifs" :key="notif.id" class="notif" :class="notif.type" @click="remove(notif)">
      {{notif.msg}}
      <label class="badge" v-if="notif.nb>1">{{notif.nb}}</label>
    </div>
  </transition-group>
</template>

<script>
import event from '../helpers/notification'
import { v4 as uuid } from 'uuid';
export default {
  data() {
    return {
      event,
      notifs: []
    }
  },
  mounted() {
    event.subscribe((type, msg) => {
      const existingNotif = this.notifs.find(n => n.msg === msg) 
      const notif = existingNotif || {
        id: uuid(),
        type, msg,
        nb: 0
      }
      clearTimeout(notif.timeout)
      notif.nb++
      if(!existingNotif) {
        this.notifs.unshift(notif)
      }
      notif.timeout = setTimeout(() => {
        this.remove(notif)
      }, 5000);
    })
  },
  methods: {
    remove(notif) {
      const index = this.notifs.indexOf(notif)
        if(index>-1) this.notifs.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.root-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100000;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  .notif {
    max-height: 100px;
    width: 80vw;
    max-width: 420px;
    text-align: center;
    color: white;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
    position: relative;
    &, label {
      background: #11998e;  /* fallback for old browsers */
      background: -webkit-linear-gradient(right, #38ef7d, #11998e);  /* Chrome 10-25, Safari 5.1-6 */
      background: linear-gradient(to right, #38ef7d, #11998e); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
      box-shadow: 0px 0px 10px 0px #11998e;
    }
    label {
      position: absolute;
      top: 0;
      right: 0;
      border: 1px solid rgba(0,0,0,0.2);
      padding: 5px;
      height: 20px;
      width: 20px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      transform-origin: top;
      transform: translateX(50%) translateY(-50%);
    }
    &.error, label{
      background: #CB356B;  /* fallback for old browsers */
      background: -webkit-linear-gradient(right, #BD3F32, #CB356B);  /* Chrome 10-25, Safari 5.1-6 */
      background: linear-gradient(to right, #BD3F32, #CB356B); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
      box-shadow: 0px 0px 10px 0px #BD3F32;
    }
  }
}
.slide-enter-active,
.slide-leave-active {
  transition: all 300ms ease !important;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0 !important; 
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  transform: translateY(-30px) !important;
}
</style>