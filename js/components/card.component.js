(function () {
    'use strict';

    angular
        .module('estimate')
        .component('card', {
            templateUrl: '/templates/card.html',
            controller: CardController,
            controllerAs: 'vm',
            bindings: {
                card: '=',
                flip: '<'
            }
        });

    function CardController() {
        this.$onInit = function() {
            
        }

        this.$onDestroy = function() {

        }
    }

}());
