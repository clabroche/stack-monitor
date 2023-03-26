import { ref } from '@vue/reactivity';
import Observable from './CustomObservable';
import { v4 as uuid } from 'uuid';
import router from "../router/router"
class Notification {
  constructor() {
    this.notifs = ref([])
    this.notifsHistory = ref([])
    this.openHistory = new Observable()
  }
  next(type, msg, serviceLabel, notifAggregator) {
    if(!notifAggregator) {
      this.next(type,msg, serviceLabel, this.notifsHistory.value)
      notifAggregator = this.notifs.value
    }
    let notif = notifAggregator.find(n => n.type === type && n.serviceLabel === serviceLabel && serviceLabel)
    if (notif) {
      const existingMsg = notif.msgs.find(n => n.label === msg)
      const newMsg =  existingMsg || {
        label: msg,
        nb: 0
      }
      newMsg.nb++
      if (!existingMsg) {
        notif.msgs.unshift(newMsg)
      }
    } else {
      const existingNotifWithLabel = notifAggregator
        .find(n => n.type === type && !n.serviceLabel && n.msgs.find(_n => _n.label === msg))
      notif = existingNotifWithLabel || {
        id: uuid(),
        type, msgs: [],
        serviceLabel,
        nb: 0
      }
      const existingMsg = notif.msgs.find(n => n.label === msg)
      const newMsg = existingMsg || {
        label: msg,
        nb: 0
      }
      newMsg.nb++
      if (!existingMsg) {
        notif.msgs.unshift(newMsg)
      }
      if (!existingNotifWithLabel) {
        notifAggregator.unshift(notif)
      }
    }
    clearTimeout(notif.timeout)
    notif.timeout = setTimeout(() => {
      // this.remove(notif)
    }, 5000);
  }
  remove(notif, hasClicked) {
    const index = this.notifs.value.indexOf(notif)
    if (index > -1) this.notifs.value.splice(index, 1)
    if (hasClicked && notif.serviceLabel) router.push({ name: 'stack-single', params: { label: notif.serviceLabel } })
  }
  removeHistory(notif, hasClicked) {
    const index = this.notifsHistory.value.indexOf(notif)
    if (index > -1) this.notifsHistory.value.splice(index, 1)
    if (hasClicked && notif.serviceLabel) router.push({ name: 'stack-single', params: { label: notif.serviceLabel } })
  }
}
export default new Notification()
