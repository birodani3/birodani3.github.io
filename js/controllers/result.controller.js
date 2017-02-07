(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('ResultController', ResultController);

    ResultController.$inject = ['$rootScope', '$scope', '$timeout', 'msgService'];

    function ResultController ($rootScope, $scope, $timeout, msgService) {
        $scope.flip = false;
        $scope.cards = [];

        msgService.listen("ANY", function() {
            $timeout(checkStats);
        });
        msgService.listen("USER_LEFT", function(username) {
            $scope.cards = $scope.cards.filter(function(card) {
                return card.user !== username;
            });
        });
        msgService.listen("USER_JOINED", function(username) {
            var card = {
                user: username,
                value: null
            };

            $scope.cards.push(card);
        });
        msgService.listen("USER_PICKED", function(data) {
            var card = $scope.cards.find(function(card) {
                return card.user === data.user;
            });

            if (card) {
                card.value = data.value;
            }
        });

        $scope.reset = function() {
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
                var cardsWithNumberCount = $scope.cards
                    .filter(function(card) {
                        return !isNaN(card.value);
                    })
                    .length;

                if (cardsWithNumberCount >= 3) {
                    
                }


                $scope.flip = true;
            } else {
                $scope.notChosenCount = $scope.cards
                    .filter(function(card) {
                        return !card.value;
                    })
                    .length;
            }

            $rootScope.$$phase || $rootScope.$apply();
        }
    }

}());
