(function () {
    'use strict';

    angular
        .module('estimate')
        .config(config);

    config.$inject = ['$routeProvider', '$cookiesProvider', 'toastrConfig'];

    function config ($routeProvider, $cookiesProvider, toastrConfig) {
        // Routes config
        $routeProvider
            .when('/login', {
                templateUrl: '/src/templates/login.html',
                controller: 'LoginController'
            })
            .when('/results', {
                templateUrl: '/src/templates/result.html',
                controller: 'ResultController',
                resolve: {
                    access: ['$rootScope', '$location', '$q', 'store', access]
                }
            })
            .when('/estimate', {
                templateUrl: '/src/templates/estimate.html',
                controller: 'EstimateController',
                resolve: {
                    access: ['$rootScope', '$location', '$q', 'store', access]
                }
            })
            .otherwise({
                redirectTo: '/login'
            });

        // Toastr config
        angular.extend(toastrConfig, {
            newestOnTop: true,
            maxOpened: 5,
            target: 'body'
        });

        // Cookie config
        $cookiesProvider.defaults.expires = "2030-12-30T12:00:00.000Z"
        
        // This function gets called before the navigation happens
        // If a resolve function like this returns a rejected promise, a $routeChangeError will be emitted on the $rootScope
        // We listen once to the $routeChangeError and redirect the page to "/"
        function access ($rootScope, $location, $q, store) {
            let onChangeError = $rootScope.$on("$routeChangeError", (event, current, previous, rejection) => {
                $location.path('/');

                onChangeError();
            });

            return store.getUser().uuid ? true : $q.reject();
        }
    }

}());
