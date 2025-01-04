<template>
  <div class="notif-history-root">
    <modal position="right" ref="modal" width="600px" :noActions="true">
      <template #header>
        Notifications
      </template>
      <template #body>
        <div class="notifications">
          <notification v-for="notif of notifs" :key="notif.id" width="100%" :notif="notif" @click="remove(notif)" :nolimit="true">
          </notification>
        </div>
      </template>
    </modal>
  </div>
</template>

<script>
import Modal from './Modal.vue'
import { onMounted, ref } from 'vue'
import notification from '../helpers/notification'
import Notification from './Notification.vue'
export default {
  components: { Modal, Notification },
  setup() {
    const modal = ref(null) 
    onMounted(() => {
      notification.openHistory.subscribe(() => {
        // @ts-ignore
        modal.value?.open()
      })
    })
    const notifs = ref(notification.notifsHistory.value)
    return {
      notifs,
      /**
       * 
       * @param {import('../helpers/notification').Notif} notif 
       */
      remove(notif) {
        notification.removeHistory(notif, true)
      },
      modal
    }
  }
}
</script>

<style lang="scss" scoped>

.notifications {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>