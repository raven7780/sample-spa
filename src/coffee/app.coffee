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

app.config ($routeProvider) ->
  rp = $routeProvider.when '/',
    name: 'home'
    templateUrl: '/views/home.html'
    controller: 'HomeCtrl'

  rp.otherwise
    templateUrl: '/views/404.html'

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

app.run ($rootScope, $window, $location, $http)->
  query = URI(window.location.search).query(true)

  loginUrl = "#{oauth_server}/oauth/token?grant_type=#{config.grant_type}&client_id=#{config.client_id}&scope=#{config.ups}&redirect_uri=#{config.redirect_uri}"

  if !query.access_token
    window.location.href = loginUrl

  $rootScope.access_token = query.access_token
  $http.get oauth_server+'/user', { params :  {access_token : $rootScope.access_token }}
    .success (data)->
      $rootScope.user = data
      console.log data
  

app.controller 'HomeCtrl', ($scope, $http, $rootScope)->
  console.log $rootScope.access_token
  $http.get oauth_server+'/fhir/SearchParameter/_search', { params :  {access_token : $rootScope.access_token }}
    .success (data)->
      $scope.data = data
      console.log data


app.controller 'PageCtrl', ($scope, $routeParams)->
  $scope.header = "PageCtrl"
  $scope.params = $routeParams
