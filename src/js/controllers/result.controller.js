(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('ResultController', ResultController);

    ResultController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'lodash', 'store', 'msgService'];

    function ResultController ($rootScope, $scope, $timeout, toastr, _, store, msgService) {
        $scope.settings = store.getSettings();
        $scope.canUndo = $scope.settings.undo;
        $scope.flip = false;
        $scope.selectedCard = null;
        $scope.cards = [];

        msgService.listen("USER_PICKED", onUserPicked);
        msgService.listen("USER_JOINED", onUserJoined);
        msgService.listen("USER_UNDO", onUserUndo);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);

        store.setUser({ isHost: true });

        let undoTimeout;
        
        $scope.reset = () => {
            $scope.cards.forEach((card) => {
                card.value = null;
            });

            msgService.send({
                type: "RESET",
                message: {
                    uuid: null
                }
            });

            $timeout.cancel(undoTimeout);
            $scope.canUndo = $scope.settings.undo;
            
            $scope.flip = false;
        }

        $scope.selectCard = (card) => {
            card.isSelected = !card.isSelected;
            
            $scope.selectedCard = card.isSelected;

            $scope.cards.forEach((_card) => {
                if (card !== _card) {
                    _card.isSelected = false;
                }
            });
        }

        $scope.removeSelectedCard = () => {
            $scope.selectedCard = null;

            let card = _.find($scope.cards, "isSelected");

            if (card) {
                msgService.send({
                    type: "REMOVE",
                    message: {
                        uuid: card.uuid
                    }
                });

                _.pull($scope.cards, card);

                checkStats();
            }
        }

        function onUserLeft(data) {
            let card = findCardByUuid(data.uuid);

            if (card) {
                _.remove($scope.cards, (_card) => {
                    return card === _card;
                });

                $scope.selectedCard = _.some($scope.cards, (card) => card.isSelected);

                checkStats();
                toastr.info("User " + card.name + " left", "Info");
            }
        }

        function onUserJoined(user) {
            let card = {
                name: $scope.settings.showName ? user.name : "<hidden>",
                uuid: user.uuid,
                value: null
            };

            toastr.info("User " + card.name + " joined", "Info");

            sendSettingsToUser(user);
            $scope.cards.push(card);
            
            $scope.flip = false;
        }

        function onUserUndo(data) {
            if ($scope.flip) {
                return;
            }

            $timeout.cancel(undoTimeout);
            let card = findCardByUuid(data.uuid);

            if (card) {
                card.value = null;
                $scope.canUndo = true;
                resetFor(card.uuid);
            }
        }

        function onUserPicked(data) {
            let card = findCardByUuid(data.uuid);

            if (card) {
                card.value = data.value;

                checkStats();
            }
        }

        function resetFor(uuid) {
            msgService.send({
                type: "RESET",
                message: {
                    uuid: uuid
                }
            });
        }

        function findCardByUuid(uuid) {
            return _.find($scope.cards, { uuid: uuid });
        }

        function checkStats() {
            let done = _.every($scope.cards, (card) => {
                return card.value !== null;
            });

            if (done && $scope.cards.length) {
                if ($scope.canUndo) {
                    $scope.canUndo = false;

                    // Wait extra 3 secs for the last client's possible undo
                    undoTimeout = $timeout(checkStats, 3000);
                } else {
                    $scope.flip = true;
                }
            } else {
                $scope.flip = false;
            }
        }

        function sendSettingsToUser(user) {
            let settingsToSend = angular.copy($scope.settings);
            
            // Only the accepted values are sent as an array
            settingsToSend.values = _.reduce(settingsToSend.values, (result, value, key) => {
                if (value) {
                    result.push(key);
                }

                return result;
            }, []);

            msgService.send({
                type: "SETTINGS",
                message: {
                    uuid: user.uuid,
                    hostUuid: store.getUser().uuid,
                    settings: settingsToSend
                }
            });
        }
    }

}());
