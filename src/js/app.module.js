(() => {
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
        .value('isMobile', (() => 'ontouchstart' in document )())
        .run(run);
    
    run.$inject = ["$rootScope", "$window", "$document", "isMobile", "msgService"];

    function run($rootScope, $window, $document, isMobile, msgService) {
        if (isMobile) {
            // Adding mobile class to body
            $document.find("body").addClass("mobile");

            // Remove :hover and :active css rules on touch devices
            // Prevent exception on browsers not supporting DOM styleSheets properly
            try {
                for (let index in document.styleSheets) {
                    let styleSheet = document.styleSheets[index];

                    if (!styleSheet.rules) {
                        continue;
                    }

                    for (let i = styleSheet.rules.length - 1; i >= 0; i--) {
                        if (!styleSheet.rules[i].selectorText) continue;

                        if (styleSheet.rules[i].selectorText.match(':hover') || styleSheet.rules[i].selectorText.match(':active')) {
                            styleSheet.deleteRule(i);
                        }
                    }
                }
            } catch (ex) {}
        }

        // Unsubscribe on page unload
        $window.addEventListener("beforeunload", () => {
            msgService.unsubscribe();
        });
    }

})();