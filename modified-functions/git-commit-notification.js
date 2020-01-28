/**
  * 
  * Here we make a request to github to turn status of commit to pending (orange dot)
  * 
  */
function main(params) {
    
  var token = params.token
    
  var rp = require('request-promise')
  
  const repoName = params.repository.name
  const statusUrl = params.repository.statuses_url
  const sha = params.after
  const gitUrl = statusUrl.replace('{sha}', sha)
  var state = 'pending'
  
  
  // overwrite state with the contents of the 'success' parameter
  if (typeof params.success !== 'undefined') {
      state = (params.success) ? 'success' : 'failure'
  }
  
  console.log(`Notifying ${gitUrl} that status check is: ${state}`)

  var options = {
    method: 'POST',
    uri: gitUrl,
    qs: {
      access_token: token
    },
    headers: {
      'User-Agent': repoName
    },
    body: {
      state: state,
      description: 'Starterkit Registration',
      target_url: 'https://cloud.ibm.com/openwhisk/dashboard',
      context: 'registration'
    },
    json: true
  }

  return rp(options)
    .then(function() {
      delete params.token  // Delete or else token shows up in logs
      return params
    }).catch(function(err) {
      return { error: err }
    })
}
