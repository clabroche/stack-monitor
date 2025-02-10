<template>
<div :class="notif.type" class="notif" v-if="notif" :style="{maxWidth: width}">
  <template v-if="!notif.hover">
    <h2 v-if="notif.serviceLabel">{{notif.serviceLabel}}</h2>
  </template>
  <h2 v-else-if="notif.serviceLabel">
    <i class="fas fa-chevron-right"></i>
  </h2>
  <div class="messages">
    <div class="message" v-for="msg of notif?.msgs" :key="msg.label" :class="{glow: notif?.msgs?.length > 1, oneline: !nolimit}">
      {{msg.label}}
      <div class="badge" v-if="notif.msgs.length > 1  && msg?.nb > 1">{{msg?.nb}}</div>
    </div>
  </div>
  <div class="badge" v-if="notif?.msgs?.length===1 && notif?.msgs[0]?.nb > 1">{{notif?.msgs[0]?.nb}}</div>
</div>
</template>

<script setup>
defineProps({
  width: {default: '420px'},
  notif: { 
    /** @type {import('../helpers/notification').Notif | null} */
    default: null
  },
  nolimit: {default: false}
})
</script>

<style lang="scss" scoped>
.notif {
  max-height: 100px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  color: white;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 4px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: 300ms;
  transition-property: transform;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
  h2 {
    margin-top: 0px;
    margin-bottom: 0px;
    font-size: 1.2em;
  }
  .messages {
    overflow: auto;
    display: flex;
    flex-direction: column;
    .message {
      &.oneline {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }
      position: relative;
      flex-shrink: 0;
    }
  }
  &, .badge {
    background: #11998e;  /* fallback for old browsers */
    background: -webkit-linear-gradient(right, #38ef7d, #11998e);  /* Chrome 10-25, Safari 5.1-6 */
    background: linear-gradient(to right, #1dcf61, #11998e); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
    box-shadow: 0px 0px 10px 0px #11998e;
  }
  .badge {
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
  .message .badge {
    transform: translateX(0) translateY(5px);
    height: 10px;
    width: 10px;
  }
  &.error, &.error .badge{
    background: #CB356B;  /* fallback for old browsers */
    background: -webkit-linear-gradient(right, #BD3F32, #CB356B);  /* Chrome 10-25, Safari 5.1-6 */
    background: linear-gradient(to right, #BD3F32, #CB356B); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
    box-shadow: 0px 0px 10px 0px #BD3F32;
    .glow {
      background-color: rgba(255,255,255,0.3);
      border-radius: 4px;
      padding: 5px;
      margin: 5px 0;
    }
  }
}
</style>