<template>
  <div class="notif-history-root">
    <modal position="right" ref="modal" width="300px" :noActions="true">
      <template #header>
        Mes notifications
      </template>
      <template #body>
        <notification v-for="notif of notifs" :key="notif.id" :notif="notif" @click="remove(notif)">
        </notification>
      </template>
    </modal>
  </div>
</template>

<script>
import { ref } from '@vue/reactivity'
import Modal from './Modal.vue'
import { onMounted } from '@vue/runtime-core'
import notification from '../helpers/notification'
import Notification from './Notification.vue'
export default {
  components: { Modal, Notification },
  setup() {
    const modal = ref(null) 
    onMounted(() => {
      notification.openHistory.subscribe(() => {
        modal.value.open()
      })
    })
    const notifs = ref(notification.notifsHistory.value)
    return {
      notifs,
      remove(notif) {
        notification.removeHistory(notif)
      },
      modal
    }
  }
}
</script>

<style lang="scss" scoped>
.notif-history-root {

}
</style>