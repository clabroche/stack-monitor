import { ref } from 'vue';
import { v4 as uuid } from 'uuid';
import Observable from './CustomObservable';
import router from '../router/router';

class Notification {
  constructor() {
    /** @type {import('vue').Ref<Notif[]>} */
    this.notifs = ref([]);
    /** @type {import('vue').Ref<Notif[]>} */
    this.notifsHistory = ref([]);
    this.openHistory = new Observable();
  }

  /**
   *
   * @param {'error' | 'success'} type
   * @param {string} msg
   * @param {string | undefined} serviceLabel
   * @param {Notif[] | null} notifAggregator
   */
  next(type, msg, serviceLabel = undefined, notifAggregator = null) {
    if (!notifAggregator) {
      this.next(type, msg, serviceLabel, this.notifsHistory.value);
      notifAggregator = this.notifs.value;
    }
    let notif = notifAggregator.find((n) => n.type === type && n.serviceLabel === serviceLabel && serviceLabel);
    if (notif) {
      const existingMsg = notif.msgs.find((n) => n.label === msg);
      const newMsg = existingMsg || {
        label: msg,
        nb: 0,
      };
      newMsg.nb += 1;
      if (!existingMsg) {
        notif.msgs.unshift(newMsg);
      }
    } else {
      const existingNotifWithLabel = notifAggregator
        .find((n) => n.type === type && !n.serviceLabel && n.msgs.find((_n) => _n.label === msg));
      notif = existingNotifWithLabel || {
        id: uuid(),
        type,
        msgs: [],
        serviceLabel,
        nb: 0,
      };
      const existingMsg = notif.msgs.find((n) => n.label === msg);
      const newMsg = existingMsg || {
        label: msg,
        nb: 0,
      };
      newMsg.nb += 1;
      if (!existingMsg) {
        notif.msgs.unshift(newMsg);
      }
      if (!existingNotifWithLabel) {
        notifAggregator.unshift(notif);
      }
    }
    // @ts-ignore
    clearTimeout(notif.timeout);
    notif.timeout = setTimeout(() => {
      if (notif) this.remove(notif);
    }, 5000);
  }

  /**
   * @param {Notif} notif
   * @param {boolean} hasClicked
   */
  remove(notif, hasClicked = false) {
    const index = this.notifs.value.indexOf(notif);
    if (index > -1) this.notifs.value.splice(index, 1);
    if (hasClicked && notif.serviceLabel) router.push({ name: 'stack-single', params: { label: notif.serviceLabel } });
  }

  /**
   * @param {Notif} notif
   * @param {boolean} hasClicked
   */
  removeHistory(notif, hasClicked) {
    const index = this.notifsHistory.value.indexOf(notif);
    if (index > -1) this.notifsHistory.value.splice(index, 1);
    if (hasClicked && notif.serviceLabel) router.push({ name: 'stack-single', params: { label: notif.serviceLabel } });
  }
}

/**
 * @typedef {{
 *  id: string,
 *  msgs: {
 *    label: string,
 *    nb: number
 *  }[],
 *  nb: number,
 *  type: string,
 *  hover?: boolean,
 *  serviceLabel?: string,
 *  timeout?: NodeJS.Timer
 * }} Notif
 */
export default new Notification();
