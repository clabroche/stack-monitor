<template>
  <transition-group tag="div" class="root-notification" name="slide">
    <div v-for="notif of notifs" :key="notif.id" class="notif" :class="notif.type" @click="remove(notif)">
      {{notif.msg}}
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
      const notif = {
        id: uuid(),
        type, msg
      }
      this.notifs.unshift(notif)
      setTimeout(() => {
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
    background: #11998e;  /* fallback for old browsers */
    background: -webkit-linear-gradient(right, #38ef7d, #11998e);  /* Chrome 10-25, Safari 5.1-6 */
    background: linear-gradient(to right, #38ef7d, #11998e); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
    box-shadow: 0px 0px 10px 0px #11998e;
    border-radius: 10px;
    margin-bottom: 20px;
    &.error {
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