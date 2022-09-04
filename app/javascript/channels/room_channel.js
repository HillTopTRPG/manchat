import consumer from "channels/consumer"

// noinspection JSUnresolvedVariable
const appRoom = consumer.subscriptions.create("RoomChannel", {
  connected() {
  },

  disconnected() {
    // Called when the subscription has been terminated by the server
  },

  received(data) {
    // Called when there's incoming data on the websocket for this channel
    return alert(JSON.stringify(data, null, "  "));
  },

  speak: function (message) {
    // noinspection JSUnresolvedFunction
    return this.perform('speak', { message: message });
  },
});

// noinspection JSUnresolvedVariable
window.document.onkeydown = function (event) {
  // noinspection JSUnresolvedVariable
  if (event.key === 'Enter' && event.target.value) {
    console.log(event.target.value)
    appRoom.speak(event.target.value);
    event.target.value = '';
    event.preventDefault();
  }
}
