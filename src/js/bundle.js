(() => {
    'use strict';

    /**
     * 
     * Story point task estimator
     * Made with PubNub: no backend required
     * It might work in IE, but i dont care about it. Use it with Chrome.
     * Because of the limitations of the PubNub's free package (100 UUID/day), the application wont work with 2 clients in the same browser.
     * 
     * @author Daniel Biro
     * 
     */
    angular
        .module('estimate', [
            'ngRoute',
            'ngCookies',
            'ngAnimate',
            'ngLodash',
            'toastr'
        ])
        .value('isMobile', (() => 'ontouchstart' in document )())
        .run(run);
    
    run.$inject = ["$rootScope", "$window", "$document", "isMobile", "store", "msgService"];

    function run($rootScope, $window, $document, isMobile, store, msgService) {
        if (isMobile) {
            // Adding mobile class to body
            $document.find("body").addClass("mobile");

            // Remove :hover and :active css rules on touch devices
            // Prevent exception on browsers not supporting DOM styleSheets properly
            try {
                for (let styleSheet of document.styleSheets) {
                    if (!styleSheet.rules) {
                        continue;
                    }

                    for (let i = styleSheet.rules.length - 1; i >= 0; i--) {
                        if (!styleSheet.rules[i].selectorText) continue;

                        if (styleSheet.rules[i].selectorText.match(':hover') || styleSheet.rules[i].selectorText.match(':active')) {
                            styleSheet.deleteRule(i);
                        }
                    }
                }
            } catch (ex) {}
        }

        // Unsubscribe on page unload
        $window.addEventListener("beforeunload", () => {
            msgService.unsubscribe();
        });

        // Fill up store with default settings
        store.setSettings({
            undo: true,
            showName: true,
            animation: true,
            color: "#2670e0",
            values: {
                0: true, 1: true, 2: true, 3: true, 5: true, 8: true,
                13: true, 20: true, 40: true, "∞": true, "?": true
            }
        });

        // Fill up store with default user data
        store.setUser({
            uuid: null,
            name: null,
            channel: null,
            isHost: false
        });
    }

})();;(function () {
    'use strict';

    angular
        .module('estimate')
        .config(config);

    config.$inject = ['$routeProvider', '$cookiesProvider', 'toastrConfig'];

    function config ($routeProvider, $cookiesProvider, toastrConfig) {
        // Routes config
        $routeProvider
            .when('/login', {
                templateUrl: '/src/templates/login.html',
                controller: 'LoginController'
            })
            .when('/results', {
                templateUrl: '/src/templates/result.html',
                controller: 'ResultController',
                resolve: {
                    access: ['$rootScope', '$location', '$q', 'store', access]
                }
            })
            .when('/estimate', {
                templateUrl: '/src/templates/estimate.html',
                controller: 'EstimateController',
                resolve: {
                    access: ['$rootScope', '$location', '$q', 'store', access]
                }
            })
            .otherwise({
                redirectTo: '/login'
            });

        // Toastr config
        angular.extend(toastrConfig, {
            newestOnTop: true,
            maxOpened: 5,
            target: 'body'
        });

        // Cookie config
        $cookiesProvider.defaults.expires = "2030-12-30T12:00:00.000Z"
        
        // This function gets called before the navigation happens
        // If a resolve function like this returns a rejected promise, a $routeChangeError will be emitted on the $rootScope
        // We listen once to the $routeChangeError and redirect the page to "/"
        function access ($rootScope, $location, $q, store) {
            let onChangeError = $rootScope.$on("$routeChangeError", (event, current, previous, rejection) => {
                $location.path('/');

                onChangeError();
            });

            return store.getUser().uuid ? true : $q.reject();
        }
    }

}());
;(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('EstimateController', EstimateController);

    EstimateController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'store', 'msgService'];

    function EstimateController ($rootScope, $scope, $timeout, toastr, store, msgService) {
        let undoTimeout;

        $scope.selected = false;
        $scope.undoEnabled = true;
        $scope.settings = {
            undo: true,
            values: []
        };

        //////////////////////////////////////////////////////////////

        msgService.listen("RESET", reset);
        msgService.listen("SETTINGS", saveSettings);
        msgService.listen("REMOVE", onRemoved);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);
        msgService.send({
            type: "USER_JOINED",
            message: store.getUser()
        });

        $scope.selectCard = (value) => {
            if ($scope.selected) {
                return;
            }

            $scope.selectedValue = value;
            $scope.selected = true;

            msgService.send({
                type: "USER_PICKED",
                message: {
                    value: value,
                    uuid: store.getUser().uuid
                }
            });

            if ($scope.undoEnabled) {
                undoTimeout = $timeout(() => {
                    if ($scope.selected) {
                        $scope.undoEnabled = false;
                    }
                }, 4000);
            }
        }

        $scope.undo = () => {
            $timeout.cancel(undoTimeout);

            msgService.send({
                type: "USER_UNDO",
                message: {
                    uuid: store.getUser().uuid
                }
            });
        }

        $scope.isSelected = (value) => {
            return $scope.selectedValue === value;
        }

        $scope.$on("$destroy", () => {
            $timeout.cancel(undoTimeout);
        });

        function reset(data) {
            if (!data.uuid || data.uuid === store.getUser().uuid) {
                $scope.selectedValue = null;
                $scope.selected = false;
                $scope.undoEnabled = $scope.settings.undo;
            }
        }

        function saveSettings(data) {
            if (data.uuid === store.getUser().uuid) {
                $scope.hostUuid = data.hostUuid;
                $scope.settings = data.settings;
                $scope.undoEnabled = $scope.settings.undo;
            }
        }

        function onRemoved(data) {
            if (data.uuid === store.getUser().uuid) {
                toastr.warning("You have been removed from the channel.", "Warning");
                $scope.leaveChannel();
            }
        }

        function onUserLeft(data) {
            // The channel host left the channel, time to leave
            if (data.uuid === $scope.hostUuid) {
                toastr.warning("Channel host left. Leaving channel.", "Warning");
                $scope.leaveChannel();
            }
        }
    }

}());
;(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$scope', '$cookies', '$location', 'lodash', 'toastr', 'store', 'msgService'];

    function LoginController ($rootScope, $scope, $cookies, $location, _, toastr, store, msgService) {
        $scope.states = {
            "SELECT_MODE": "SELECT_MODE",
            "CREATE_CHANNEL": "CREATE_CHANNEL",
            "JOIN_CHANNEL": "JOIN_CHANNEL",
            "SETTINGS": "SETTINGS"
        };

        $scope.isLoading = false;
        $scope.state = $scope.states.SELECT_MODE;
        $scope.title = "Estimation";
        $scope.defaultSettings = store.getSettings();
        $scope.settings = getSettings();
        
        msgService.unsubscribe();
        store.setUser({ name: null, channel: null, isHost: false });
        store.subscribe("user", onUserChanged);
        
        $scope.changeState = (newState) => {
            $scope.state = newState;

            switch(newState) {
                case $scope.states.SELECT_MODE:
                    $scope.title = "Estimation";
                    $scope.channel = "";
                    $scope.userName = "";
                    $scope.channels = [];
                    break;

                case $scope.states.CREATE_CHANNEL:
                    $scope.title = "Create channel";
                    $scope.channel = $cookies.get("channel") || "";
                    break;

                case $scope.states.SETTINGS:
                    $scope.title = "Settings"
                    break;
                
                case $scope.states.JOIN_CHANNEL:
                    $scope.title = "Join channel";
                    $scope.userName = $cookies.get("username") || "";
                    $scope.loadChannels();
                    break;
            }
        }

        $scope.back = () => {
            switch ($scope.state) {
                case $scope.states.CREATE_CHANNEL:
                case $scope.states.JOIN_CHANNEL:
                default:
                    $scope.changeState($scope.states.SELECT_MODE);
                    break;

                case $scope.states.SETTINGS:
                    $scope.changeState($scope.states.CREATE_CHANNEL);
                    break;
            }
        }

        $scope.loadChannels = (callback = _.noop) => {
            $scope.isLoading = true;
            $scope.channels = [];

            msgService.hereNow((status, data) => {
                $scope.channels = _.keys(data.channels);
                $scope.isLoading = false;

                callback();
            });
        }

        $scope.createChannel = (channel) => {
            channel = channel.trim();

            if (channel) {
                toastr.info("Checking channel availability...", "Info");

                $scope.loadChannels(() => {
                    if (_.includes($scope.channels, channel)) {
                        toastr.error("Channel '" + channel + "' already exists.", "Error");
                        return;
                    }

                    msgService.subscribe(channel);
                    store.setUser({ name: name, channel: channel });
                    toastr.success("Channel '" + channel + "' created", "Success");
                    $cookies.put("channel", channel);
                    $location.path("/results");
                });
            } else {
                toastr.error("Please add a name to your channel.", "Error");
            }
        }

        $scope.joinChannel = (userName, channel) => {
            userName = userName.trim();
            channel = channel.trim();

            if (userName && channel) {
                store.setUser({ channel: channel, name: userName });
                msgService.subscribe(channel);

                $cookies.put("channel", channel);
                $cookies.put("username", userName);

                $location.path("/estimate");
            } else {
                toastr.error("Please add a username.", "Error");
            }
        }

        $scope.saveSettingsToCookie = () => {
            $cookies.put("settings", JSON.stringify($scope.settings));
        }

        $scope.loadDefaultSettings = () => {
            _.forIn($scope.defaultSettings, (value, key) => {
                $scope.settings[key] = angular.copy(value);
            });
        }

        $scope.$on("$destroy", () => {
            store.setSettings($scope.settings);
            store.unsubscribe(onUserChanged);
        });

        function getSettings() {
            let settings = store.getSettings();

            let cookieSettingsString = $cookies.get("settings");
            let cookieSettings = cookieSettingsString ? JSON.parse(cookieSettingsString) : null;

            return angular.merge(settings, cookieSettings);
        }

        function onUserChanged(user) {
            if (!user.uuid) {
                msgService.init();
            }
        }
    }

}());
;(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('MainController', MainController);

    MainController.$inject = ['$rootScope', '$scope', '$location', 'store'];

    function MainController ($rootScope, $scope, $location, store) {
        $scope.user = null;

        store.subscribe("user", (user) => {
            $scope.user = user;
        });

        $scope.hasChannel = () => {
            return $scope.user.channel;
        }

        $scope.leaveChannel = () => {
            $location.path("/login");
        }

        $scope.isHost = () => {
            return $scope.user.isHost;
        }
    }

}());
;(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('ResultController', ResultController);

    ResultController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'lodash', 'store', 'msgService'];

    function ResultController ($rootScope, $scope, $timeout, toastr, _, store, msgService) {
        $scope.settings = store.getSettings();
        $scope.canUndo = $scope.settings.undo;
        $scope.flip = false;
        $scope.selectedCard = null;
        $scope.cards = [];

        msgService.listen("USER_PICKED", onUserPicked);
        msgService.listen("USER_JOINED", onUserJoined);
        msgService.listen("USER_UNDO", onUserUndo);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);

        store.setUser({ isHost: true });

        let undoTimeout;
        
        $scope.reset = () => {
            $scope.cards.forEach((card) => {
                card.value = null;
            });

            msgService.send({
                type: "RESET",
                message: {
                    uuid: null
                }
            });

            $timeout.cancel(undoTimeout);
            $scope.canUndo = $scope.settings.undo;
            
            $scope.flip = false;
        }

        $scope.selectCard = (card) => {
            card.isSelected = !card.isSelected;
            
            $scope.selectedCard = card.isSelected;

            $scope.cards.forEach((_card) => {
                if (card !== _card) {
                    _card.isSelected = false;
                }
            });
        }

        $scope.removeSelectedCard = () => {
            $scope.selectedCard = null;

            let card = _.find($scope.cards, "isSelected");

            if (card) {
                msgService.send({
                    type: "REMOVE",
                    message: {
                        uuid: card.uuid
                    }
                });

                _.pull($scope.cards, card);

                checkStats();
            }
        }

        function onUserLeft(data) {
            let card = findCardByUuid(data.uuid);

            if (card) {
                _.remove($scope.cards, (_card) => {
                    return card === _card;
                });

                $scope.selectedCard = _.some($scope.cards, (card) => card.isSelected);

                checkStats();
                toastr.info("User " + card.name + " left", "Info");
            }
        }

        function onUserJoined(user) {
            let card = {
                name: $scope.settings.showName ? user.name : "<hidden>",
                uuid: user.uuid,
                value: null
            };

            toastr.info("User " + card.name + " joined", "Info");

            sendSettingsToUser(user);
            $scope.cards.push(card);
            $scope.reset();
        }

        function onUserUndo(data) {
            if ($scope.flip) {
                return;
            }

            $timeout.cancel(undoTimeout);
            let card = findCardByUuid(data.uuid);

            if (card) {
                card.value = null;
                $scope.canUndo = true;
                resetFor(card.uuid);
            }
        }

        function onUserPicked(data) {
            let card = findCardByUuid(data.uuid);

            if (card) {
                card.value = data.value;

                checkStats();
            }
        }

        function resetFor(uuid) {
            msgService.send({
                type: "RESET",
                message: {
                    uuid: uuid
                }
            });
        }

        function findCardByUuid(uuid) {
            return _.find($scope.cards, { uuid: uuid });
        }

        function checkStats() {
            let done = _.every($scope.cards, (card) => {
                return card.value !== null;
            });

            if (done && $scope.cards.length) {
                if ($scope.canUndo) {
                    $scope.canUndo = false;

                    // Wait extra 3 secs for the last client's possible undo
                    undoTimeout = $timeout(checkStats, 3000);
                } else {
                    $scope.flip = true;
                }
            } else {
                $scope.flip = false;
            }
        }

        function sendSettingsToUser(user) {
            let settingsToSend = angular.copy($scope.settings);
            
            // Only the accepted values are sent as an array
            settingsToSend.values = _.reduce(settingsToSend.values, (result, value, key) => {
                if (value) {
                    result.push(key);
                }

                return result;
            }, []);

            msgService.send({
                type: "SETTINGS",
                message: {
                    uuid: user.uuid,
                    hostUuid: store.getUser().uuid,
                    settings: settingsToSend
                }
            });
        }
    }

}());
;(function () {
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
                message: (data) => {
                    if (type === "ANY" || data.message.type === type) {
                        $rootScope.$evalAsync(() => callback(data.message.message));
                    }
                }
            }

            listeners.push(listener);
            pubNub.addListener(listener);
        }

        function listenPresence(actions, callback) {
            let listener = {
                presence: (data) => {
                    // User will not get his/her own presence messages
                    if (data.uuid === store.getUser().uuid) {
                        return;
                    }

                    if (_.includes(actions, data.action) || _.includes(actions, "ANY")) {
                        $rootScope.$evalAsync(() => callback(data));
                    }
                }
            };

            listeners.push(listener);
            pubNub.addListener(listener);
        }

        function hereNow(callback) {
            let pubNubCallback = (...params) => $rootScope.$evalAsync(() => callback(...params));

            pubNub.hereNow({ uuids: false }, pubNubCallback);
        }
    }

}());;(function () {
    'use strict';

    angular
        .module('estimate')
        .factory('store', store);

    store.$inject = ["$rootScope", "lodash"];

    function store($rootScope, _) {
        let subscriptions = [];

        // Default settings
        let store = {
            settings: {},
            user: {}
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