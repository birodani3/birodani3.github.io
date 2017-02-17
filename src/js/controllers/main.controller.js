(function () {
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
