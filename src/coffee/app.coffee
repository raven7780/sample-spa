require('../../bower_components/angular/angular.js')
require('../../bower_components/angular-route/angular-route.js')
require('../../bower_components/angular-sanitize/angular-sanitize.js')
require('../../bower_components/angular-animate/angular-animate.js')
require('../../bower_components/angular-cookies/angular-cookies.js')
require('../../bower_components/fhir-bower/ngFhir.js')

require('file?name=index.html!../index.html')
require('file?name=oauth.html!../oauth.html')
require('../less/app.less')


URI = require('../../bower_components/uri.js/src/URI.js')

app = require('./module')

require('./views')

app.config ($routeProvider, $httpProvider) ->
  rp = $routeProvider.when '/',
    name: 'home'
    templateUrl: '/views/home.html'
    controller: 'HomeCtrl'

  rp.otherwise
    templateUrl: '/views/404.html'

  $httpProvider.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8'

app.config () ->
  console.log 'config'

config = {
  client_id    : 'implicit'
  scope        : 'ups'
  redirect_uri : 'http://localhost:3000'
  grant_type   : 'implicit'
  ups          : 'ups'
}
oauth_server = 'http://aidbox.hs'

app.run ($rootScope, $window, $location, $http, $cookies)->
  query = URI(window.location.search).query(true)
  # TODO: clear
  loginUrl = "#{oauth_server}/oauth/token?grant_type=#{config.grant_type}&client_id=#{config.client_id}&scope=#{config.ups}&redirect_uri=#{config.redirect_uri}"

  if query.access_token
    $cookies.put 'access_token', query.access_token
    window.close()

  $rootScope.access_token = ()->
    if $cookies.get 'access_token'
      $cookies.get 'access_token'
    else
      $rootScope.signin()
  
  $rootScope.signin = ()->
    window.open(loginUrl, "SignIn", "width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=100,top=100")
  
  $rootScope.signout = ()->
    $http.get oauth_server+'/signout', { params : {access_token : $rootScope.access_token() }}
      .success (data)->
        $rootScope.user = null
        $cookies.remove 'access_token'

  $rootScope.getUserData = ()->
    $http.get oauth_server+'/user', { params : {access_token : $rootScope.access_token() }}
      .success (data)->
        $rootScope.user = data
        console.log data
  
  if $cookies.get 'access_token'
    $rootScope.getUserData()

app.controller 'MainCtrl', ($scope, $http, $rootScope)->
  console.log 'MainCtrl'

app.controller 'HomeCtrl', ($scope, $http, $rootScope)->
###
  $http.get oauth_server+'/fhir/SearchParameter/_search', { params :  {access_token : $rootScope.access_token() }}
    .success (data)->
      $scope.data = data
      console.log data
###


app.controller 'PageCtrl', ($scope, $routeParams)->
  $scope.header = "PageCtrl"
  $scope.params = $routeParams
