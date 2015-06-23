var app = angular.module('app', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'ngAidbox'
])

app.run(function($rootScope, $aidbox){
  searchPatient = function(name){
    $aidbox.http({
      url : '/fhir/Patient/_search',
      params : {
        name: name
      }
    }).success(function(data){
      $rootScope.patients = data; 
    });
  }

  $aidbox.init({
    box:   'http://test.aidbox.hs',
    onUser: function(user){
      $rootScope.user = user;
      searchPatient();
    }
  });

  $rootScope.delete = function(id){
    $aidbox.http({
      url : '/fhir/Patient/'+id,
      method: 'DELETE'
    }).success(function(data){
      searchPatient();
    }).error(function(data, response){
      $rootScope.err = data;
    });
  };

  $rootScope.auth = {
    signin: function(){
      $aidbox.signin();
    },
    signout: function(){
      $aidbox.signout();
      $rootScope.user = null;
    }
  }

  $rootScope.$watch('search', function(x){
    searchPatient(x);
  });

  $rootScope.create = function(){
    var data = {
      name: [ {
        use : 'official',
        given : $rootScope.newPatient.given,
        family : $rootScope.newPatient.family
      } ],
      resourceType : 'Patient'
    }
    $aidbox.http({
      url : '/fhir/Patient',
      method: 'POST',
      data: JSON.stringify(data)
    }).success(function(data){
      searchPatient();
    }).error(function(data, response){
      $rootScope.err = data;
    });
  }
})
