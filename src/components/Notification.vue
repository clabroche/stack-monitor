<template>
  <transition-group tag="div" class="root-notification" name="slide">
    <div v-for="notif of notifs" :key="notif.id" class="notif" :class="notif.type" @click="remove(notif, true)" @mouseenter="notif.hover = true" @mouseleave="notif.hover = false">
      <template v-if="!notif.hover">
        <h2 v-if="notif.serviceLabel">{{notif.serviceLabel}}</h2>
      </template>
      <template v-else-if="notif.serviceLabel">
        <h2><i class="fas fa-chevron-right" aria-hidden="true"></i></h2>
      </template>
      <div class="messages">
        <div class="message" v-for="msg of notif?.msgs" :key="msg.label" :class="{glow: notif?.msgs?.length > 1, hover: msg.hover}">
          {{msg.label}}
          <label class="badge" v-if="notif.msgs.length > 1  && msg?.nb > 1">{{msg?.nb}}</label>
        </div>
      </div>
      <label class="badge" v-if="notif?.msgs?.length===1 && notif?.msgs[0]?.nb > 1">{{notif?.msgs[0]?.nb}}</label>
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
  async mounted() {
    event.subscribe((type, msg, serviceLabel) => {
      let notif = this.notifs.find(n => n.type === type  && n.serviceLabel === serviceLabel && serviceLabel) 
      if(notif) {
        const existingMsg = notif.msgs.find(n => n.label === msg) 
        const newMsg = existingMsg || {
          label: msg,
          nb: 0
        }
        newMsg.nb++
        if(!existingMsg) {
          notif.msgs.unshift(newMsg)
        }
      } else {
        const existingNotifWithLabel = this.notifs
          .find(n => n.type === type &&  !n.serviceLabel && n.msgs.find(_n => _n.label === msg)) 
        notif = existingNotifWithLabel || {
          id: uuid(),
          type, msgs: [],
          serviceLabel,
          nb: 0
        }
        const existingMsg = notif.msgs.find(n => n.label === msg)
        const newMsg = existingMsg || {
          label: msg,
          nb:0
        }
        newMsg.nb++
        if(!existingMsg) {
          notif.msgs.unshift(newMsg)
        }
        if(!existingNotifWithLabel) {
          this.notifs.unshift(notif)
        }
      }
      clearTimeout(notif.timeout)
      notif.timeout = setTimeout(() => {
        this.remove(notif)
      }, 5000);
    })

    //! TODO: Make unit test with these:
    // event.next('error', 'test1', 'service 1')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test2', 'service 1')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test3', 'service 1')
    // await new Promise(res => setTimeout(res, 1000))

    // event.next('error', 'test1', 'service 2')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test1', 'service 2')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test1', 'service 2')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test2', 'service 2')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test1')
    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test1')

    // await new Promise(res => setTimeout(res, 1000))
    // event.next('error', 'test2')

    // await new Promise(res => setTimeout(res, 1000))
    // event.next('success', 'test1')
  },
  methods: {
    remove(notif, hasClicked) {
      const index = this.notifs.indexOf(notif)
      if(index>-1) this.notifs.splice(index, 1)
      if(hasClicked && notif.serviceLabel) this.$router.push({name: 'stack-single', params: {label: notif.serviceLabel}})
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
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        position: relative;
        flex-shrink: 0;
      }
    }
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
    .message label {
      transform: translateX(0) translateY(5px);
      height: 10px;
      width: 10px;
    }
    &.error, &.error label{
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