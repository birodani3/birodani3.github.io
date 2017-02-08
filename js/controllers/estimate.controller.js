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

        msgService.listen("RESET", reset);
        msgService.send({
            type: "USER_JOINED",
            message: $rootScope.user
        });

        function reset() {
            $scope.selectedValue = null;
            $scope.selected = false;

            $rootScope.$apply();
        }

        function selectCard(value) {
            if ($scope.selected) {
                return;
            }

            $scope.selectedValue = value;
            $scope.selected = true;

            msgService.send({
                type: "USER_PICKED",
                message: {
                    value: value,
                    uuid: $rootScope.user.uuid
                }
            });
        }

        function isSelected(value) {
            return $scope.selectedValue === value;
        }
    }

}());
