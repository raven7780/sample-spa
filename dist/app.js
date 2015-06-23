function getIn(obj, path){
  var t = obj;
  for (var i=0; i < path.length; i++){
    t = t[path[i]];
    if(!t){
      return null
    } 
  }
  return t;
}

var app = angular.module('app', [
  'ngCookies',
  'ngAnimate',
  'ngSanitize',
  'ngAidbox'
])

app.run(function($rootScope, $aidbox){
  var searchPatient = function(name){
    $aidbox.http({
      url : '/fhir/Patient/_search',
      params : {
        name: name,
        _sort: 'name'
      }
    }).success(function(data){
      $rootScope.patients = data.entry.map(function(entry){
        return {
          id: entry.resource.id,
          given : getIn(entry, ['resource','name',0,'given',0]),
          family :getIn(entry, ['resource','name',0,'family',0]),
          gender : getIn(entry, ['resource','gender','coding',0]),
          meta: entry.resource.meta
        }
      }); 
    });
  }
  $rootScope.newPatient = {};


 var loadGenders = function(){
    $aidbox.fhir.valueSet.expand('administrative-gender') 
      .then(function(data){
        $rootScope.genders = data;
      }).catch(function(data){
        $rootScope.err = data;
      });
 }

  $aidbox.init({
    box:   'http://test.aidbox.hs',
    onUser: function(user){
      $rootScope.user = user;
      searchPatient();
      loadGenders()
    }
  });

  $rootScope.delete = function(pt){
    $aidbox.http({
      url : '/fhir/Patient/'+pt.id,
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

  $rootScope.$watch('nameSearch', function(x){
    console.log(x);
    searchPatient(x);
  });


  
  $rootScope.update = function(pt){
    console.log(pt);
    var data = {
      id: pt.id,
      name: [ {
        use : 'official',
        given : pt.given,
        family : pt.family
      } ],
      meta: pt.meta,
      gender: { coding : [ pt.gender ] },
      resourceType : 'Patient'
    }
    $aidbox.http({
      url : '/fhir/Patient/'+pt.id,
      method: 'PUT',
      data: JSON.stringify(data)
    }).success(function(data){
      searchPatient();
    }).error(function(data, response){
      $rootScope.err = data;
    });
  }

  $rootScope.create = function(){
    var pt = $rootScope.newPatient;
    var data = {
      name: [ {
        use : 'official',
        given : pt.given,
        family : pt.family
      } ],
      gender: { coding : [ pt.gender ] },
      resourceType : 'Patient'
    }
    $aidbox.http({
      url : '/fhir/Patient',
      method: 'POST',
      data: JSON.stringify(data)
    }).success(function(data){
      searchPatient();
      $rootScope.newPatient = {};
    }).error(function(data, response){
      $rootScope.err = data;
    });
  }
})
