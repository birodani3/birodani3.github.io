(function () {
    'use strict';

    angular
        .module('estimate')
        .factory('msgService', msgService);

    msgService.$inject = ["$rootScope", "$cookies", "store", "lodash"];

    function msgService($rootScope, $cookies, store, _) {
        let pubNub = null;
        let listeners = [];

        return {
            // Init PubNub, set userStore's user uuid
            init: init,

            // Subscribe for channel
            subscribe: subscribe,

            // Unsubscribe from channel
            unsubscribe: unsubscribe,

            // Send message
            send: send,

            // Listen to messages
            listen: listen,

            // Listen to presence messages
            listenPresence: listenPresence,

            // Get all existing channels and connected devices
            hereNow: hereNow
        };

        function init() {
            let uuid = $cookies.get("uuid");

            if (!uuid) {
                uuid = PubNub.generateUUID();
                $cookies.put("uuid", uuid);
            }

            store.setUser({
                uuid: uuid
            });
            
            pubNub = new PubNub({
                publishKey: 'pub-c-69789d50-67b0-4cf4-80b6-368360332773',
                subscribeKey: 'sub-c-82db2fb2-eca4-11e6-889b-02ee2ddab7fe',
                uuid: uuid
            });
        }

        function subscribe(channel = store.getUser().channel) {
            pubNub.subscribe({
                channels: [channel],
                withPresence: true
            });
        }

        function unsubscribe(channel = store.getUser().channel) {
            if (pubNub) {
                listeners.forEach(pubNub.removeListener);
                
                pubNub.unsubscribe({
                    channels: [channel]
                });

                listeners = [];
            }
        }

        function send(data, channel = store.getUser().channel) {
            pubNub.publish({
                message: data,
                channel: channel
            });
        }

        function listen(type, callback) {
            let listener = {
                message: function(data) {
                    if (type === "ANY") {
                        callback(data.message.message)
                    } else if (data.message.type === type) {
                        callback(data.message.message)
                    }
                }
            }

            listeners.push(listener);
            pubNub.addListener(listener);
        }

        function listenPresence(actions, callback) {
            let listener = {
                presence: function(data) {
                    // User will not get his/her own presence messages
                    if (data.uuid === store.getUser().uuid) {
                        return;
                    }

                    if (_.includes(actions, data.action) || _.includes(actions, "ANY")) {
                        callback(data);
                    }
                }
            };

            listeners.push(listener);
            pubNub.addListener(listener);
        }

        function hereNow(callback) {
            pubNub.hereNow({ uuids: false }, callback);
        }
    }

}());