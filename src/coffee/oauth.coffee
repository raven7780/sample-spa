config = {
  client_id    : 'implicit'
  scope        : 'ups'
  redirect_uri : 'http://localhost:3000'
  grant_type   : 'implicit'
  ups          : 'ups'
}
oauth_server = 'http://aidbox.hs'
access_token = ''

URI = require('../../bower_components/uri.js/src/URI.js')
query = URI(window.location.search).query(true)

loginUrl = "#{oauth_server}/oauth/token?grant_type=#{config.grant_type}&client_id=#{config.client_id}&scope=#{config.ups}&redirect_uri=#{config.redirect_uri}"


#http.get oauth_server+'/sign-out'
#  .success (data)->
#    console.log 'Yes'


if !query.access_token
  window.location.href = loginUrl

access_token = query.access_token

console.log(access_token)


#signinWin = window.open(url, "SignIn", "width=780,height=410,toolbar=0,scrollbars=0,status=0,resizable=0,location=0,menuBar=0,left=100,top=100")
# http://aidbox.hs/oauth/token?grant_type=implicit&client_id=implicit&scope=ups&redirect_uri=http://localhost:3000
