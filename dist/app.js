var app = angular.module('app', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'ngAidbox'
])

app.run(function($rootScope, $aidbox){
  $aidbox.init({
    box:   'http://test.aidbox.local',
    onUser: function(user){
      $rootScope.user =user
    }
  });

  $rootScope.auth = {
    signin: function(){
      $aidbox.signin();
    },
    signout: function(){
      $aidbox.signout();
      $rootScope.user  = null;
    }
  }
})
