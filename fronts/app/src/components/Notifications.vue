<template>
  <div class="notifications-container">
    <div class="trash" v-if="notifs?.length" @click="trash">
      <i class="fas fa-trash"></i>
    </div>
    <transition-group tag="div" class="root-notification" name="slide">
      <notification v-for="notif of notifs" :key="notif.id"
        :notif="notif"
        @click="remove(notif, true)"
        @mouseenter="notif.hover = true"
        @mouseleave="notif.hover = false"/>
    </transition-group>
  </div>
</template>

<script>
import notification from '../helpers/notification'
import Notification from './Notification.vue'
import PromiseB from 'bluebird'
export default {
  components: { Notification },
  setup() {
    /**
     * @param {import('../helpers/notification').Notif} notif 
     * @param {boolean} hasClicked 
     */
    const remove = (notif, hasClicked) => notification.remove(notif, hasClicked)
    return {
      notifs: notification.notifs,
      remove,
      trash() {
        PromiseB.map(notification.notifs.value || [], async(n) => {
          await new Promise(resolve => setTimeout(resolve, 50))
          notification.notifs.value.map(n => remove(n, false))
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.notifications-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: max-content;
  z-index: 100000;
  margin: auto;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
}
.root-notification {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.trash {
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #d29423, #ead007); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
  box-shadow: 0px 0px 10px 0px #9d791c;
  transition: 300ms;
  cursor: pointer;
  &:hover {
    transform: scale(1.1);
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