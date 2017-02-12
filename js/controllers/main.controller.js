(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('MainController', MainController);

    MainController.$inject = ['$rootScope', '$scope', '$location', 'store'];

    function MainController ($rootScope, $scope, $location, store) {
        $scope.user = null;

        store.subscribe("user", function(user) {
            $scope.user = user;
        });

        $scope.hasChannel = function() {
            return $scope.user.channel;
        }

        $scope.leaveChannel = function() {
            $location.path("/login");
        }

        $scope.isHost = function() {
            return $scope.user.isHost;
        }
    }

}());
