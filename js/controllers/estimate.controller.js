(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('EstimateController', EstimateController);

    EstimateController.$inject = ['$rootScope', '$scope', 'message'];

    function EstimateController ($rootScope, $scope, message) {
        $scope.numbers = [0, 1, 2, 3, 5, 8, 13, 20, "?"];

        $scope.props = {
            isWaiting: false
        };

        message.send({
            type: "USER_JOINED",
            message: $rootScope.user.name
        });

        $scope.send = function(value) {
            message.send({
                type: "USER_PICKED",
                message: {
                    value: value,
                    user: $rootScope.user.name
                }
            });
        }

        function sendLeftMessage() {
            message.send({
                type: "USER_LEFT",
                message: $rootScope.user.name
            });
            return true;
        }

        window.onbeforeunload = sendLeftMessage;
        $scope.$on("$destroy", sendLeftMessage);
    }

}());
