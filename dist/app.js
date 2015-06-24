(function() {

    var BOX_URL = 'https://nicola.aidbox.io';

    function getIn(obj, path) {
        var t = obj;
        for (var i = 0; i < path.length; i++) {
            t = t[path[i]];
            if (!t) {
                return null;
            }
        }
        return t;
    }

    function mapPatient(entry) {
        return {
            id: entry.resource.id,
            given: getIn(entry, ['resource', 'name', 0, 'given', 0]),
            family: getIn(entry, ['resource', 'name', 0, 'family', 0]),
            gender: getIn(entry, ['resource', 'gender', 'coding', 0]),
            meta: entry.resource.meta
        };
    };

    function fillPatient(pt) {
        var res = {
            name: [{
                use: 'official',
                given: pt.given,
                family: pt.family
            }],
            gender: {coding: [pt.gender]},
            resourceType: 'Patient'
        };
        pt.meta && (res.meta = pt.meta);
        pt.id && (res.id = pt.id);
        return res;
    };

    var app = angular.module('app', ['ngCookies', 'ngAidbox']);

    app.run(function($rootScope, $aidbox) {
        var searchPatient = function() {
            var name = $rootScope.search.name;
            $aidbox.http({
                url: '/fhir/Patient/_search',
                params: {name: name, _sort: 'name'}
            }).success(function(data) {
                $rootScope.patients = data.entry.map(mapPatient);
            });
        };

        function handleError(data, response) {
            $rootScope.err = data;
        };

        $rootScope.newPatient = {};
        $rootScope.search = {};
        $rootScope.searchPatient = searchPatient;

        var loadGenders = function() {
            $aidbox.fhir.valueSet.expand('administrative-gender')
                .then(function(data) {
                    $rootScope.genders = data;
                }).catch(function(data) {
                    $rootScope.err = data;
                });
        };

        $aidbox.init({
            box: BOX_URL,
            onSignIn: function(user) {
                $rootScope.user = user;
                searchPatient();
                loadGenders()
            },
            onSignOut: function() {
                $rootScope.user = null;
            }
        });

        $rootScope.delete = function(pt) {
            $aidbox.http({
                url: '/fhir/Patient/' + pt.id,
                method: 'DELETE'
            }).success(searchPatient).error(handleError)
        };

        $rootScope.auth = {
            signin: $aidbox.signin,
            signout: function() {
                $aidbox.signout();
                $rootScope.user = null;
            }
        };

        $rootScope.update = function(pt) {
            $aidbox.http({
                url: '/fhir/Patient/' + pt.id,
                method: 'PUT',
                data: fillPatient(pt)
            }).success(searchPatient).error(handleError);
        };

        $rootScope.create = function() {
            var pt = $rootScope.newPatient;
            $aidbox.http({
                url: '/fhir/Patient',
                method: 'POST',
                data: fillPatient(pt)
            }).success(function(data) {
                searchPatient();
                $rootScope.newPatient = {};
            }).error(handleError);
        };
    });
})();
