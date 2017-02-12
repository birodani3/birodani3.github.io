(function() {
    'use strict';

    /**
     * 
     * Story point task estimator
     * Made with PubNub: no backend required
     * It might work in IE, but i dont care about it. Use it with Chrome.
     * Because of the limitations of the PubNub's free package (100 UUID/day), the application wont work with 2 clients in the same browser.
     * 
     * @author Daniel Biro
     * 
     */
    angular
        .module('estimate', [
            'ngRoute',
            'ngCookies',
            'ngAnimate',
            'ngLodash',
            'toastr'
        ])
        .value('isMobile', (function() { return 'ontouchstart' in document; })())
        .run(run);
    
    run.$inject = ["$rootScope", "isMobile"];

    function run($rootScope, isMobile) {
        $rootScope.isMobile = isMobile;

        // Remove :hover and :active css rules on touch devices
        if (isMobile) {
            try { // prevent exception on browsers not supporting DOM styleSheets properly
                for (var index in document.styleSheets) {
                    var styleSheet = document.styleSheets[index];

                    if (!styleSheet.rules) {
                        continue;
                    }

                    for (var i = styleSheet.rules.length - 1; i >= 0; i--) {
                        if (!styleSheet.rules[i].selectorText) continue;

                        if (styleSheet.rules[i].selectorText.match(':hover') || styleSheet.rules[i].selectorText.match(':active')) {
                            styleSheet.deleteRule(i);
                        }
                    }
                }
            } catch (ex) {}
        }
    }

})();