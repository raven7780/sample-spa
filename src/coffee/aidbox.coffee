app = require('./module')
URI = require('../../bower_components/uri.js/src/URI.js')

app.service '$aidbox', ($rootScope, $http, $cookies, $window, $location)->
  uri = URI($window.location)
  config = {
    client_id    : ''
    grant_type   : 'implicit'
    scope        : 'ups'
    redirect_uri : uri.protocol()+'://'+uri.host()
  }
  box_url = ''
  
  query = URI($window.location.search).search(true)

  loginUrl = ()->
    URI(box_url)
      .directory '/oauth/token'
      .setQuery config

  # Just return at
  access_token= ()->
    $cookies.get('ab_'+config.client_id)

  # Clear all user data
  out = ()->
    $cookies.remove 'ab_'+ config.client_id
    # Clear some other data

  # Init client_id  box_url and other
  @init = (param)->
    box_url = param.box_url
    delete param.box_url
    for k,v of param
      config[k] = v
    # Remove AT from uri and close modal window
    if query.access_token
      $cookies.put 'ab_'+config.client_id, query.access_token
      q = URI($window.location)
        .removeQuery('access_token').resource()
        .toString()
      $window.history.pushState(null, '', q)
      
      if $window.opener
        $window.close()


  @signin= (win)->
    if access_token()
      console.log 'You are signed in'
    else
      if win
        $window.location.href=loginUrl()
      else
        $window.open(loginUrl(), "SignIn to you Box", "width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=100,top=100")
  
  @signout= ()->
    if access_token()
      $http.get box_url+'/signout', { params : {access_token : access_token() }}
        .success (data)->
          out()
          console.log "You are now logged out"
        .error (err)->
          out()
          console.log "Wrong access_token", err
    else
      console.log "You are not logged"

  @
