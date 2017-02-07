(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$scope', 'msgService'];

    function LoginController ($rootScope, $scope, msgService) {
        // User was joined a room earlier, now navigated back
        if ($rootScope.user) {
            msgService.send({
                type: "USER_LEFT",
                message: $rootScope.user.name
            });
        }
    }

}());
