<template>
  <transition-group tag="div" class="root-notification" name="slide">
    <notification v-for="notif of notifs" :key="notif.id" :notif="notif" @click="remove(notif, true)" @mouseenter="notif.hover = true" @mouseleave="notif.hover = false">
      
    </notification>
  </transition-group>
</template>

<script>
import notification from '../helpers/notification'
import Notification from './Notification.vue'
export default {
  components: { Notification },
  setup() {
    return {
      notifs: notification.notifs,
      remove(notif, hasClicked) {
        notification.remove(notif, hasClicked)
      }
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