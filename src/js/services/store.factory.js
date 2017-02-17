(function () {
    'use strict';

    angular
        .module('estimate')
        .factory('store', store);

    store.$inject = ["$rootScope", "lodash"];

    function store($rootScope, _) {
        let subscriptions = []

        // Default settings
        let store = {
            settings: {
                undo: true,
                showName: true,
                animation: true,
                color: "#2670e0",
                values: {
                    0: true, 1: true, 2: true, 3: true, 5: true, 8: true,
                    13: true, 20: true, 40: true, "∞": true, "?": true
                }
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

            // Unsubscribe from store changes
            unsubscribe: unsubscribe,

            // Returns settings
            getSettings: getSettings,

            // Set the settings
            setSettings: setSettings,

            // Sets the user's given properties (other properties will not change!)
            setUser: setUser,

            // Returns user object
            getUser: getUser
        };

        function subscribe(key, callback) {
            let unsubscribe = $rootScope.$watchCollection(() => {
                return store[key];
            }, (newVal, oldVal) => {
                callback(newVal);
            }, true);

            subscriptions.push({
                originalCallback: callback,
                unsubscribe: unsubscribe
            });
        }

        function unsubscribe(callback) {
            let subscription = _.find(subscriptions, { originalCallback: callback });
            
            if (subscription) {
                subscription.unsubscribe();

                _.pull(subscriptions, subscription);
            }
        }

        function getSettings() {
            return angular.copy(store.settings);
        }

        function getUser() {
            return store.user;
        }

        function setSettings(settings) {
            store.settings = settings;
        }

        function setUser(user) {
            angular.merge(store.user, user);
        }
    }

}());