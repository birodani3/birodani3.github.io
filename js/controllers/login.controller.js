(function () {
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
        $scope.settings = store.getSettings();
        
        msgService.unsubscribe();
        store.setUser({ name: null, channel: null, isHost: false });
        store.subscribe("user", onUserChanged);
        
        $scope.changeState = function(newState) {
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

        $scope.back = function() {
            switch($scope.state) {
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

        $scope.loadChannels = function(callback) {
            callback = callback || _.noop;

            $scope.isLoading = true;
            $scope.channels = [];

            msgService.hereNow(function(status, data) {
                $scope.channels = _.keys(data.channels);
                $scope.isLoading = false;

                $rootScope.$apply(callback);
            });
        }

        $scope.createChannel = function(channel) {
            channel = channel.trim();

            if (channel) {
                toastr.info("Checking channel availability...", "Info");

                $scope.loadChannels(function() {
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

        $scope.joinChannel = function(userName, channel) {
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

        $scope.$on("destroy", function() {
            store.unsubscribe(onUserChanged);
        });

        function onUserChanged(user) {
            if (!user.uuid) {
                msgService.init();
            }
        }
    }

}());
