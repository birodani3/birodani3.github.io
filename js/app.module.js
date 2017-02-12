(function() {
    'use strict';

    /**
     * 
     * Story point task estimator
     * Made with PubNub: no backend required
     * Because of the limitations of the PubNub's free package (100 UUID/day), the application wont work with 2 clients in the same browser.
     * It might work with IE, but i dont care about it. Use it with Chrome.
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
    }

})();