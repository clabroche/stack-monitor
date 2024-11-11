export default {
  events: new Map(),
  connected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 100,
  maxReconnectDelay: 1000,
  reconnecting: false,

  reconnectWebSocket(url) {
    if (this.connected || this.reconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.trigger('maxReconnectAttemptsReached');
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts += 1;
    const delay = Math.min(this.reconnectDelay * 2 ** this.reconnectAttempts, this.maxReconnectDelay);

    setTimeout(() => {
      this.init(url)
        .then(() => {
          this.reconnecting = false;
        })
        .catch((error) => {
          this.reconnecting = false;
          this.reconnectWebSocket(url);
        });
    }, delay);
  },

  async init(url) {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.close();
        this.connected = false;
      }

      const socket = new WebSocket(url);

      socket.onopen = () => {
        this.socket = socket;
        this.connected = true;
        this.reconnectAttempts = 0;
        this.reconnecting = false;
        this.trigger('connect');
        resolve('ok');
      };

      socket.onmessage = (event) => {
        const { channel, data } = JSON.parse(event.data);
        (this.events.get(channel) || []).forEach((cb) => cb(...data));
      };

      socket.onerror = (error) => {
        reject(error);
      };

      socket.onclose = () => {
        this.connected = false;
        this.trigger('disconnect');
        this.reconnectWebSocket(url);
      };
    });
  },

  trigger(event, ...data) {
    (this.events.get(event) || []).forEach((cb) => cb(...data));
  },

  on(event, cb) {
    const store = this.events.get(event) || [];
    store.push(cb);
    this.events.set(event, store);
  },

  off(event, cb) {
    let store = this.events.get(event) || [];
    store = store.filter((_cb) => _cb !== cb);
    this.events.set(event, store);
  },
};
