/**
  *
  * main() will be run when you invoke this action.  It checks the result of the previous job for a failure then notifies Slack 
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object. This JSON option should contain
  *         a 'success' attribute as a Bool, as well as a github repository name and url.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
function main(params) {
    
    const rp = require('request-promise');
    
    if (params.success) {
        return { message: 'The previous exectuion completed successfully, skipping notification.' }
    } else {
        console.log('Previous jobs unsuccessfull for: ' + params.repository.name + ', notifying in #arf-automation...')
        
        var options = {
            method: 'POST',
            uri: `https://hooks.slack.com/services/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`,
            json: true,
            body: {
                text: `:stitch2: Pattern Registration for <${params.repository.url}|${params.repository.name}> failed. >> <https://global.devx.cloud.ibm.com/registry/api/blueprints/${params.blueprintid}?includeValidationMessages=true|Logs>`  //`Automated update of patter<${Url.format(pattern_repo)}|${payload.project.name}> *FAILED*.`
            }
        }
        
        // Post to Slack
        return rp(options).then(response => {
            console.log('Error transmission complete.')
            return { 'message': response }
        })
    }
}
