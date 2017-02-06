(function () {
    'use strict';

    angular
        .module('estimate')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config ($routeProvider) {
        // Routes config
        $routeProvider
            .when('/login', {
                templateUrl: '/templates/login.html'
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

        function access ($rootScope, $location, $q) {
            var onChangeError = $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
                $location.path('/');

                onChangeError();
            });

            return $rootScope.user ? true : $q.reject('No country selected');
        }
    }

}());
