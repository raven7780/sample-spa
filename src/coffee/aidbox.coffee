app = require('./module')
URI = require('../../bower_components/uri.js/src/URI.js')

app.service '$aidbox', ($rootScope, $http, $cookies)->
  config = {
    client_id    : 'implicit'
    grant_type   : 'implicit'
    scope        : 'ups'
    redirect_uri : 'http://localhost:3000'
  }
  oauth_server = 'http://aidbox.hs'
  query = URI(window.location.search).search(true)
  loginUrl = URI(oauth_server)
      .directory '/oauth/token'
      .setQuery config

  if query.access_token
    $cookies.put 'ab_'+config.client_id, query.access_token
    window.close()

  access_token= ()->
    $cookies.get('ab_'+config.client_id)

  out = ()->
    $cookies.remove 'ab_'+ config.client_id
    # Clear some other data

  @signin= (win)->
    if access_token()
      console.log 'You are signed in'
    else
      if win
        window.location.href=loginUrl
      else
        window.open(loginUrl, "SignIn to you Box", "width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=100,top=100")
  
  @signout= ()->
    if access_token()
      $http.get oauth_server+'/signout', { params : {access_token : access_token() }}
        .success (data)->
          out()
          console.log "You are now logged out"
        .error (err)->
          out()
          console.log "Wrong access_token", err
    else
      console.log "You are not logged"

  @

###

    $rootScope.getUserData = ()->
      $http.get oauth_server+'/user', { params : {access_token : $rootScope.access_token() }}
        .success (data)->
          $rootScope.user = data
    
    if $cookies.get 'access_token'
      $rootScope.getUserData()

###
