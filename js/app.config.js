(function () {
    'use strict';

    angular
        .module('estimate')
        .config(config);

    config.$inject = ['$routeProvider', 'toastrConfig'];

    function config ($routeProvider, toastrConfig) {
        // Routes config
        $routeProvider
            .when('/login', {
                templateUrl: '/templates/login.html',
                controller: 'LoginController'
            })
            .when('/results', {
                templateUrl: '/templates/result.html',
                controller: 'ResultController',
                resolve: {
                    access: ['$rootScope', '$location', '$q', access]
                }
            })
            .when('/estimate', {
                templateUrl: '/templates/estimate.html',
                controller: 'EstimateController',
                resolve: {
                    access: ['$rootScope', '$location', '$q', access]
                }
            })
            .otherwise({
                redirectTo: '/login'
            });

        // Toastr config
        angular.extend(toastrConfig, {
            newestOnTop: true,
            maxOpened: 6,
            target: 'body'
        });

        function access ($rootScope, $location, $q) {
            var onChangeError = $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
                $location.path('/');

                onChangeError();
            });

            return $rootScope.user ? true : $q.reject();
        }
    }

}());
