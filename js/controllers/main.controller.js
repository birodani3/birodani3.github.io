(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('MainController', MainController);

    MainController.$inject = ['$rootScope', '$scope', '$cookies', '$location', 'toastr', 'msgService'];

    function MainController ($rootScope, $scope, $cookies, $location, toastr, msgService) {

        $scope.leaveRoom = leaveRoom;
        $scope.isLoggedIn = isLoggedIn;
        $scope.isHost = isHost;

        ///////////////////////////////////////////////////////////////////////////

        function isHost() {
            return $rootScope.user && $rootScope.user.isHost;
        }

        function isLoggedIn() {
            return !!$rootScope.user;
        }

        function leaveRoom() {
            $location.path("/login");
        }
    }

}());
