(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('EstimateController', EstimateController);

    EstimateController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'store', 'msgService'];

    function EstimateController ($rootScope, $scope, $timeout, toastr, store, msgService) {
        var undoTimeout;
        $scope.selected = false;
        $scope.undoEnabled = true;
        $scope.settings = {
            undo: true,
            values: []
        };

        //////////////////////////////////////////////////////////////

        msgService.listen("ANY", applyChangesAsync);
        msgService.listen("RESET", reset);
        msgService.listen("SETTINGS", saveSettings);
        msgService.listen("REMOVE", onRemoved);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);
        msgService.listenPresence(["ANY"], applyChangesAsync);
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
                undoTimeout = $timeout(function() {
                    if ($scope.selected) {
                        $scope.undoEnabled = false;
                    }
                }, 4000);
            }
        }

        $scope.undo = function() {
            $timeout.cancel(undoTimeout);

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

        $scope.$on("$destroy", function() {
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

        // Apply is needed because pubNub callbacks are executed from outside of angular's scope
        // Timeout is needed because there is no guarantee that the "ANY" callback gets called later than other event callbacks
        function applyChangesAsync() {
            $timeout(function() {
                $scope.$apply();
            });
        }
    }

}());
