(function() {
    'use strict';

    angular
        .module('estimate', [
            'ngRoute',
            'ngCookies'
        ])
        .run(run);

    run.$inject = ["$rootScope", "$cookies", "$location", "msgService"];
    function run($rootScope, $cookies, $location, msgService) {
        $rootScope.newUser = {
            name: $cookies.get("username"),
            room: '',
            password: ''
        };

        $rootScope.login = function(user) {
            if (!user || !user.name || (!user.joinRoom && !user.newRoom)) {
                return;
            }

            user.room = user.joinRoom || user.newRoom;

            $rootScope.user = user
            $cookies.put("username", user.name);

            $rootScope.pub = new PubNub({
                publishKey: 'pub-c-69789d50-67b0-4cf4-80b6-368360332773',
                subscribeKey: 'sub-c-82db2fb2-eca4-11e6-889b-02ee2ddab7fe'
            });

            msgService.subscribe($rootScope.user.room);
            
            if (user.joinRoom) {
                $location.path("/estimate");
            } else {
                $location.path("/results");
            }
        };
    }

})();