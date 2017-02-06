(function () {
    'use strict';

    angular
        .module('estimate')
        .factory('message', message);

    message.$inject = ["$rootScope"];

    function message ($rootScope) {
        return {
            subscribe: subscribe,
            send: send,
            listen: listen
        };

        function subscribe(room) {
            $rootScope.pub.subscribe({
                channels: [room]
            });
        }

        function send (data) {
            $rootScope.pub.publish({
                message: data,
                channel: $rootScope.user.room
            }, function(status, response) {});
        }

        function listen(type, callback) {
            $rootScope.pub.addListener({
                message: function(data) {
                    if (type === "ANY") {
                        callback(data.message.message)
                    } else if (data.message.type === type) {
                        callback(data.message.message)
                    }
                },
                presence: function(presenceEvent) {

                }
            });
        }
    }

}());