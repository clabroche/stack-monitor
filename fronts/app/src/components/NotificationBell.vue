<template>
  <div class="notification-bell-root" @click="open">
    <i class="fas fa-bell" aria-hidden="true"></i>
  </div>
</template>

<script setup>
import notification from '../helpers/notification'
const open = () => notification.openHistory.next()
</script>

<style lang="scss" scoped>
.notification-bell-root {
  font-size: 1.4em;
  margin-bottom: 10px;
  margin-right: 5px;
  cursor: pointer;
  transition: 300ms;
  &:hover {
    transform: scale(1.1);
  }
}
</style>