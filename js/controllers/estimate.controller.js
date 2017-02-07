(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('EstimateController', EstimateController);

    EstimateController.$inject = ['$rootScope', '$scope', 'msgService'];

    function EstimateController ($rootScope, $scope, msgService) {
        $scope.selected = false;
        $scope.values = [0, 1, 2, 3, 5, 8, 13, 20, 40, "∞", "?"];
        $scope.selectCard = selectCard;
        $scope.isSelected = isSelected

        //////////////////////////////////////////////////////////////

        msgService.send({
            type: "USER_JOINED",
            message: $rootScope.user.name
        });

        msgService.listen("RESET", reset);

        function reset() {
            $scope.selectedValue = null;
            $scope.selected = false;

            $rootScope.$apply();
        }

        function selectCard(value) {
            $scope.selectedValue = value;
            $scope.selected = true;

            msgService.send({
                type: "USER_PICKED",
                message: {
                    value: value,
                    user: $rootScope.user.name
                }
            });
        }

        function isSelected(value) {
            return $scope.selectedValue === value;
        }


        function sendLeftMessage() {
            msgService.send({
                type: "USER_LEFT",
                message: $rootScope.user.name
            });
            return true;
        }
        window.onbeforeunload = sendLeftMessage;
        $scope.$on("$destroy", sendLeftMessage);
    }

}());
