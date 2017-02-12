(function () {
    'use strict';

    angular
        .module('estimate')
        .factory('store', store);

    store.$inject = ["$rootScope", "lodash"];

    function store ($rootScope, _) {
        var subscriptions = []

        // Default settings
        var store = {
            settings: {
                undo: true,
                showName: true,
                color: "#2670e0"
            },
            user: {
                uuid: null,
                name: null,
                channel: null,
                isHost: false
            }
        };
      
        return {
            // Subscribe for store changes
            // Callback gets called with the updated value only (no oldVal as in angular)
            // Callback gets called once immediately after subscribing!
            subscribe: subscribe,

            // Returns settings
            getSettings: getSettings,

            // Sets the user's given properties (other properties will not change!)
            setUser: setUser,

            // Returns user object
            getUser: getUser
        };

        function subscribe(key, callback) {
            var unsubscribe = $rootScope.$watchCollection(function() {
                return store[key];
            }, function(newVal, oldVal) {
                callback(newVal);
            }, true);

            subscriptions.push({
                originalCallback: callback,
                unsubscribe: unsubscribe
            });
        }

        function unsubscribe(callback) {
            var subscription = _.find(subscriptions, { originalCallback: callback });
            
            if (subscription) {
                subscription.unsubscribe();

                _.pull(subscriptions, subscription);
            }
        }

        function getSettings() {
            return store.settings;
        }

        function getUser() {
            return store.user;
        }

        function setUser(user) {
            angular.merge(store.user, user);
        }
    }

}());