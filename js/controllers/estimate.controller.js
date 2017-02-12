(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('EstimateController', EstimateController);

    EstimateController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'store', 'msgService'];

    function EstimateController ($rootScope, $scope, $timeout, toastr, store, msgService) {
        $scope.selected = false;
        $scope.undoEnabled = true;
        $scope.settings = {
            undo: true,
            values: []
        };

        //////////////////////////////////////////////////////////////

        msgService.listen("RESET", reset);
        msgService.listen("SETTINGS", saveSettings);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);
        msgService.send({
            type: "USER_JOINED",
            message: store.getUser()
        });

        $scope.selectCard = function(value) {
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
                $timeout(function() {
                    if ($scope.selected) {
                        $scope.undoEnabled = false;
                    }
                }, 4000);
            }
        }

        $scope.undo = function() {
            msgService.send({
                type: "USER_UNDO",
                message: {
                    uuid: store.getUser().uuid
                }
            });
        }

        $scope.isSelected = function(value) {
            return $scope.selectedValue === value;
        }

        function reset(data) {
            if (!data.uuid || data.uuid === store.getUser().uuid) {
                $scope.selectedValue = null;
                $scope.selected = false;
                $scope.undoEnabled = $scope.settings.undo;

                $rootScope.$apply();
            }
        }

        function saveSettings(data) {
            if (data.uuid === store.getUser().uuid) {
                $scope.hostUuid = data.hostUuid;
                $scope.settings = data.settings;
                $scope.undoEnabled = $scope.settings.undo;

                $rootScope.$apply();
            }
        }

        function onUserLeft(data) {
            // The channel host left the channel, time to leave
            if (data.uuid === $scope.hostUuid) {
                toastr.warning("Channel host left. Leaving channel.", "Warning");
                $scope.leaveChannel();
                $rootScope.$apply();
            }
        }
    }

}());
