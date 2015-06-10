require('../../bower_components/angular/angular.js')
require('../../bower_components/angular-route/angular-route.js')
require('../../bower_components/angular-sanitize/angular-sanitize.js')
require('../../bower_components/angular-animate/angular-animate.js')
require('../../bower_components/angular-cookies/angular-cookies.js')
require('../../bower_components/fhir-bower/ngFhir.js')

require('file?name=index.html!../index.html')
require('file?name=oauth.html!../oauth.html')
require('../less/app.less')

app = require('./module')

require('./views')
require('./aidbox')

app.config ($routeProvider, $httpProvider) ->
  rp = $routeProvider.when '/',
    name: 'home'
    templateUrl: '/views/home.html'
    controller: 'HomeCtrl'

  rp.otherwise
    templateUrl: '/views/404.html'

  $httpProvider.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8'

app.run ($rootScope, $window, $location, $http, $cookies, $aidbox)->
  $aidbox.init
    client_id:'implicit'
    box_url: 'http://aidbox.hs'

app.controller 'MainCtrl', ($scope, $http, $rootScope, $aidbox)->
  $scope.signin = $aidbox.signin
  $scope.signout = $aidbox.user


app.controller 'HomeCtrl', ($scope, $http, $rootScope, $aidbox)->
  $aidbox.user (data)->
    $rootScope.user = data

  $aidbox.patients (data)->
    $rootScope.data = data


app.controller 'PageCtrl', ($scope, $routeParams)->
  $scope.header = "PageCtrl"
  $scope.params = $routeParams
