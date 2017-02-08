(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('ResultController', ResultController);

    ResultController.$inject = ['$rootScope', '$scope', '$timeout', 'toastr', 'msgService'];

    function ResultController ($rootScope, $scope, $timeout, toastr, msgService) {
        $scope.reset = reset;
        $scope.flip = false;
        $scope.cards = [];
        $rootScope.user.isHost = true;

        /////////////////////////////////////////////////////////////////////

        msgService.listen("ANY", function() { $timeout(checkStats); });
        msgService.listen("USER_PICKED", onUserPicked);
        msgService.listen("USER_JOINED", onUserJoined);
        msgService.listenPresence(["ANY"], function() { $timeout(checkStats); });
        msgService.listenPresence(["leave", "timeout"], onUserLeft);
        msgService.listenPresence(["state-change"], onStateChange);

        function onUserLeft(data) {
            var username;

            $scope.cards = $scope.cards.filter(function(card) {
                if (card.uuid === data.uuid) {
                    user = card.name;
                    return false;
                }

                return true;
            });

            toastr.info("User " + username + " left", "Info");
        }

        function onUserJoined(user) {
            var card = {
                name: user.name,
                uuid: user.uuid,
                value: null
            };

            toastr.info("User " + user.name + " joined", "Info");
            $scope.cards.push(card);

            reset();
        }

        function onStateChange(data) {
            $scope.cards.forEach(function(card) {
                if (card.uuid === data.uuid) {
                    card.name = data.state.name;
                }
            })
        }

        function onUserPicked(data) {
            var card = $scope.cards.find(function(card) {
                return card.uuid === data.uuid;
            });

            if (card) {
                card.value = data.value;
            }
        }

        function reset() {
            $scope.flip = false;

            $scope.cards.forEach(function(card) {
                card.value = null;
            });

            msgService.send({
                type: "RESET",
                message: ""
            });

            checkStats();
        }

        function checkStats() {
            var done = $scope.cards.every(function(card) {
                return card.value != null;
            });

            if (done && $scope.cards.length) {
                $scope.flip = true;
            } else {
                $scope.notChosenCount = $scope.cards
                    .filter(function(card) {
                        return card.value == null;
                    })
                    .length;
            }

            $rootScope.$$phase || $rootScope.$apply();
        }
    }

}());
