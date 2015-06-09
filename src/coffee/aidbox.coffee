app = require('./module')
URI = require('../../bower_components/uri.js/src/URI.js')

app.service '$aidbox', ($rootScope, $http, $cookies)->
  config : {
    client_id    : 'implicit'
    grant_type   : 'implicit'
    scope        : 'ups'
    redirect_uri : 'http://localhost:3000'
  }
  oauth_server : 'http://aidbox.hs'
  query : URI(window.location.search).search(true)

  loginUrl : ()->
    URI(@oauth_server)
      .directory '/oauth/token'
      .setQuery @config

  signin: ()->
    #  window.location.href = @loginUrl()
    window.open(@loginUrl(), "SignIn to you Box",
      "width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=100,top=100")
  
  signout: ()->
    client_id = @config.client_id
    $http.get @oauth_server+'/signout', { params : {access_token : @access_token() }}
      .success (data)->
        $cookies.remove 'ab_'+ client_id

  access_token: ()->
    $cookies.get('ab_'+@config.client_id) || @signin(true)

  run: ()->
    if @query.access_token
      $cookies.put 'ab_'+@config.client_id, @query.access_token
      window.close()

###

    $rootScope.getUserData = ()->
      $http.get oauth_server+'/user', { params : {access_token : $rootScope.access_token() }}
        .success (data)->
          $rootScope.user = data
    
    if $cookies.get 'access_token'
      $rootScope.getUserData()

###
