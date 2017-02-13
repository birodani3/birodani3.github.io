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

        msgService.listen("ANY", checkStatsAsync);
        msgService.listen("USER_PICKED", onUserPicked);
        msgService.listen("USER_JOINED", onUserJoined);
        msgService.listen("USER_UNDO", onUserUndo);
        msgService.listenPresence(["ANY"], checkStatsAsync);
        msgService.listenPresence(["leave", "timeout"], onUserLeft);

        store.setUser({ isHost: true });
        
        $scope.reset = function() {
            $scope.cards.forEach(function(card) {
                card.value = null;
            });

            msgService.send({
                type: "RESET",
                message: {
                    uuid: null
                }
            });

            $scope.canUndo = $scope.settings.undo;
            $scope.flip = false;
        }

        $scope.selectCard = function(card) {
            card.isSelected = !card.isSelected;

            $scope.cards.forEach(function(_card) {
                if (card !== _card) {
                    card.isSelected = false;
                }
            });

            $scope.selectedCard = card.isSelected;
        }

        $scope.kick = function(card) {
            $scope.selectedCard = null;
            _.pull($scope.cards, card);í

            checkStats();
        }

        function onUserLeft(data) {
            var card = findCardByUuid(data.uuid);

            if (card) {
                _.remove($scope.cards, function(_card) {
                    return card === _card;
                });

                toastr.info("User " + card.name + " left", "Info");
            }
        }

        function onUserJoined(user) {
            var card = {
                name: $scope.settings.showName ? user.name : "<hidden>",
                uuid: user.uuid,
                value: null
            };

            toastr.info("User " + card.name + " joined", "Info");

            sendSettingsToUser(user);
            $scope.cards.push(card);
            $scope.reset();
        }

        function onUserUndo(data) {
            if ($scope.flip) {
                return;
            }

            var card = findCardByUuid(data.uuid);

            if (card) {
                card.value = null;
                $scope.canUndo = true;
                resetFor(card.uuid);
            }
        }

        function onUserPicked(data) {
            var card = findCardByUuid(data.uuid);

            if (card) {
                card.value = data.value;
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
            var done = _.every($scope.cards, function(card) {
                return card.value !== null;
            });

            if (done && $scope.cards.length) {
                if ($scope.canUndo) {
                    $scope.canUndo = false;

                    // Wait extra 3 secs for the last client's possible undo
                    $timeout(checkStats, 3000);
                } else {
                    $scope.flip = true;
                }
            } else {
                $scope.flip = false;
            }
        }

        function sendSettingsToUser(user) {
            var settingsToSend = angular.copy($scope.settings);
            // Only the accepted values are sent as an array
            settingsToSend.values = _.reduce(settingsToSend.values, function(result, value, key) {
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

        // Angular does not know about pubNub event callbacks
        // We have to initiate a $digest cycle manually by $evalAsync
        function checkStatsAsync() {
            $rootScope.$evalAsync(checkStats);
        }
    }

}());
