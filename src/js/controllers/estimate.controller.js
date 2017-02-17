(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('EstimateController', EstimateController);

    EstimateController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'store', 'msgService'];

    function EstimateController ($rootScope, $scope, $timeout, toastr, store, msgService) {
        let undoTimeout;

        $scope.selected = false;
        $scope.undoEnabled = true;
        $scope.settings = {
            undo: true,
            values: []
        };

        //////////////////////////////////////////////////////////////

        msgService.listen("RESET", reset);
        msgService.listen("SETTINGS", saveSettings);
        msgService.listen("REMOVE", onRemoved);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);
        msgService.send({
            type: "USER_JOINED",
            message: store.getUser()
        });

        $scope.selectCard = (value) => {
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
                undoTimeout = $timeout(() => {
                    if ($scope.selected) {
                        $scope.undoEnabled = false;
                    }
                }, 4000);
            }
        }

        $scope.undo = () => {
            $timeout.cancel(undoTimeout);

            msgService.send({
                type: "USER_UNDO",
                message: {
                    uuid: store.getUser().uuid
                }
            });
        }

        $scope.isSelected = (value) => {
            return $scope.selectedValue === value;
        }

        $scope.$on("$destroy", () => {
            $timeout.cancel(undoTimeout);
        });

        function reset(data) {
            if (!data.uuid || data.uuid === store.getUser().uuid) {
                $scope.selectedValue = null;
                $scope.selected = false;
                $scope.undoEnabled = $scope.settings.undo;
            }
        }

        function saveSettings(data) {
            if (data.uuid === store.getUser().uuid) {
                $scope.hostUuid = data.hostUuid;
                $scope.settings = data.settings;
                $scope.undoEnabled = $scope.settings.undo;
            }
        }

        function onRemoved(data) {
            if (data.uuid === store.getUser().uuid) {
                toastr.warning("You have been removed from the channel.", "Warning");
                $scope.leaveChannel();
            }
        }

        function onUserLeft(data) {
            // The channel host left the channel, time to leave
            if (data.uuid === $scope.hostUuid) {
                toastr.warning("Channel host left. Leaving channel.", "Warning");
                $scope.leaveChannel();
            }
        }
    }

}());
