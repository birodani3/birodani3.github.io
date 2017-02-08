(function () {
    'use strict';

    angular
        .module('estimate')
        .factory('msgService', msgService);

    msgService.$inject = ["$rootScope"];

    function msgService ($rootScope) {
        var pubNub = null;
        var channel = null;

        return {
            init: init,
            unsubscribe: unsubscribe,
            send: send,
            listen: listen,
            listenPresence: listenPresence,
            hereNow: hereNow
        };

        function init(user) {
            channel = user.room;
            user.uuid = PubNub.generateUUID();

            pubNub = new PubNub({
                publishKey: 'pub-c-69789d50-67b0-4cf4-80b6-368360332773',
                subscribeKey: 'sub-c-82db2fb2-eca4-11e6-889b-02ee2ddab7fe',
                uuid: user.uuid
            });

            pubNub.subscribe({
                channels: [channel],
                withPresence: true
            });
        }

        function unsubscribe() {
            if (pubNub) {
                pubNub.unsubscribe({
                    channels: [channel]
                });
            }
        }

        function send(data) {
            pubNub.publish({
                message: data,
                channel: $rootScope.user.room
            }, function(status, response) {});
        }

        function listen(type, callback) {
            pubNub.addListener({
                message: function(data) {
                    console.log("data: ", data);
                    if (type === "ANY") {
                        callback(data.message.message)
                    } else if (data.message.type === type) {
                        callback(data.message.message)
                    }
                }
            });
        }

        function listenPresence(actions, callback) {
            var supportedActions = [
                "join",
                "leave",
                "timeout",
                "state-change",
                "interval",
                "ANY"
            ];
            
            actions.forEach(function(action) {
                if (!supportedActions.includes(action)) {
                    console.warn("Unsupported presence action: ", action);
                }
            });

            pubNub.addListener({
                presence: function(data) {
                    if (data.uuid === $rootScope.user.uuid) {
                        return;
                    }

                    if (actions.includes("ANY") || actions.includes(data.action)) {
                        callback(data);
                    }
                }
            });
        }

        function hereNow(callback) {
            pubNub.hereNow({ uuids: false, }, callback);
        }
    }

}());