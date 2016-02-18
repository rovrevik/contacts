'use strict';

/**
 * @ngdoc overview
 * @name contactsApp
 * @description
 * # ContactsApp
 *
 * Main module of the application. Not including the controllers.
 */
var ContactsApp = angular.module('contactsApp', [
    'ng',
    'ngRoute',
    'ngResource',
    'contactsAppControllers',
    'contactsAppServices',
    'contactsAppFilters',
    'contactsAppDirectives'
]);

angular.module('contactsAppControllers', [])
    .controller('ContactsController', ['$scope', '$location', 'Contact', function($scope, $location, Contact) {
        $scope.contacts = Contact.query({}, function(contacts) {
            $scope.contacts = contacts;
        });

        $scope.create = function() {
            $location.path('/contacts/create');
        };

        $scope.remove = function(contactId) {
            Contact.remove({id: contactId}, function(contact) {
                $scope.contacts = Contact.query({}, function(contacts) {
                    $scope.contacts = contacts;
                });
            });
        };

        $scope.edit = function(contactId) {
            $location.path('/contacts/edit/' + contactId);
        };
    }])
    .controller('ContactEditController', ['$scope', '$routeParams', '$location', 'Contact', function($scope, $routeParams, $location, Contact) {
        $scope.viewName = 'Edit';
        $scope.contact =  Contact.get({id: $routeParams.contactId}, function(contact) {
            $scope.contact = contact;
        });
        $scope.saveOrUpdate = function() {
            Contact.update({id: $routeParams.contactId}, $scope.contact, function(value) {
                $location.path('/contacts');
            }, function(reason) {
                $scope.responseContent = JSON.stringify(reason);
            });
        };
    }])
    .controller('ContactCreateController', ['$scope', '$location', 'Contact', function($scope, $location, Contact) {
        $scope.viewName = 'Add';
        $scope.contact =  {};
        $scope.saveOrUpdate = function() {
            Contact.save($scope.contact, function(value) {
                $location.path('/contacts');
            }, function(reason) {
                $scope.responseContent = JSON.stringify(reason);
            });
        };
    }])
    .controller('AuthController', ['$scope', '$http', '$location', '$window', function($scope, $http, $location, $window) {
        $scope.user = {username: '', password: ''};
        $scope.authenticated = isAuthenticated();

        //If user is signed in then redirect back home
        if (isAuthenticated()) {
            $location.path('/');
        }

        $scope.login = function() {
            $http.post('/api/auth/login', $scope.user).then(function(response) {
                // If successful store the token
                $window.localStorage.jwtToken = response.data.token;
                $scope.authenticated = true;
                // And redirect to the home page
                $location.path('/');
            }, function(response) {
                $scope.responseContent = JSON.stringify(response);
            });
        };

        $scope.logout = function() {
            $scope.responseContent = 'logging out';
            delete $window.localStorage.jwtToken;
            $scope.authenticated = false;
            $location.path('/login');
        };

        $scope.signup = function() {
            $http.post('/api/users', $scope.user).then(function(response) {
                $scope.responseContent = JSON.stringify(response);
                $scope.user = response;
            }, function(response) {
                $scope.responseContent = JSON.stringify(response);
            });
        };

        function isAuthenticated() {
            return 'jwtToken' in $window.localStorage;
        }

    }]);

angular.module('contactsAppServices', [])
    .factory('Contact', ['$resource', function($resource) {
        return $resource('/api/contacts/:id', null, {
            update: { method: 'PUT'}
        });
    }])
    .factory('enforceAuth', ['$q', '$window', '$location', function($q, $window, $location) {
        return {
            responseError: function(rejection) {
                if (rejection.status === 401) {
                    // got a 401 so go to the login page
                    delete $window.localStorage.jwtToken;
                    $location.path('/login');
                }
                return $q.reject(rejection);
            }
        };
    }]).factory('addJwtToken', ['$q', '$window', function($q, $window) {
        return {
            request: function(config) {
                if ($window.localStorage.jwtToken) {
                    config.headers.Authorization = 'Bearer ' + $window.localStorage.jwtToken;
                }
                return config;
            }
        };
    }]);

angular.module('contactsAppFilters', []);
angular.module('contactsAppDirectives', []);

ContactsApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/contacts', {
            templateUrl: 'views/contacts.html',
            controller: 'ContactsController'
        })
        .when('/contacts/create', {
            templateUrl: 'views/contactEdit.html',
            controller: 'ContactCreateController',

        })
        .when('/contacts/edit/:contactId', {
            templateUrl: 'views/contactEdit.html',
            controller: 'ContactEditController'
        })
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'AuthController'
        })
        .otherwise({
            redirectTo: '/contacts'
        });
}]).config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('enforceAuth');
    $httpProvider.interceptors.push('addJwtToken');
}]);

ContactsApp.run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.$on('$routeChangeSuccess', function(userInfo) {
        console.log(userInfo);
    });

    $rootScope.$on('$routeChangeError', function(event, current, previous, eventObj) {
        if (eventObj.authenticated === false) {
            $location.path('/login');
        }
    });
}]);
