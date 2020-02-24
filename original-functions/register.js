'use strict';

/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output, a JSON object containing the input content as well as a Boolean 'success' attribute.
  *
  */
function main(params) {
    
    const rp = require('request-promise');
    const Promise = require('bluebird');
    const itm = require('@ibm-functions/iam-token-manager');
    
    // repo name and urls
    const repoFullName = params.repository.full_name;
    const repoName     = params.repository.name;
    const apiURL       = params.repository.url;
    const htmlURL      = params.repository.html_url;
    const apikey       = params.apikey;
    const branchName   = params.ref.split("/").pop();
    
    delete params.apikey // delete apikey so it does not show up in the logs.
      
    console.log("Registration request processing for pattern: " + repoFullName);
    
    // get IAM token
    const m = new itm({
        "iamApikey": apikey
    })
    return m.getToken().then(token => {

        // construct requests to registry endpoint
        var data = dictionary(repoName);
        
        var payload = {
            "blueprint": {
                "description": data.description,
                "name": data.name,
                "platform": data.platform,
                "toolchain": data.toolchain || [ "CF", "KUBE", "KNATIVE" ], // to accomodate serverless and knative
                "type": "PATTERN",
                "requiredCapabilities": data.capabilities || [],
                "servicePlans": data.plans || {}
             },
            "branch": branchName,
            "repoURL": apiURL
        }

        if (branchName !== "master") {
            let prefixName = (branchName.length > 3) ? branchName.slice(0,3) : branchName;
            payload.blueprint.name = prefixName + " - " + payload.blueprint.name;
            payload.blueprint.tag = ["devex"];
        }
        
         // Send payload to global endpoint
        var options = {
            method: 'POST',
            uri: params.uri,
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: payload,
            json: true
        }
        
        console.log("sent: ")
        console.log(JSON.stringify(options))
          
        // Parse response to get job id
        return rp(options)
            .then(response => {
                console.log("received: ")
                console.log(JSON.stringify(response))

                var id = response.job.ids[0]
                params.blueprintid = id
                console.log("Codegen Response: Blueprint ID: " + id)
                
                // Process result of polling function to return success or failure
                return poll(id)
                    .then(res => {
                        params.success = (res.status == "VALIDATED_TEST")
                        return params
                    }).catch(res => {
                        params.success = false
                        return params
                    })
            }).catch(err => {
                console.log(`Failed to get job id from starter kit registry. Status: ${err.statusCode}`)
                console.log(JSON.stringify(err))
                params.success = false //TODO: remove
                return params
            })

    }).catch(res => {
        console.log('Problem authenticating with IAM.')
        params.success = false
        return params
    })
}

/**
  *
  * dictionary() is called to contruct the blueprint object with the information specific to each pattern - descriptions, language, and names
  *
  * @name String - the repo shortname that will look up and return a JSON object with the correct output for each repo
  *
  * @return a JSON object with the corresponding details
  *
  */
function dictionary(name) {
    
    var result = {}
    
    switch (name) {
        case 'node-red-app': 
            result.name = 'Node-RED'
            result.description = 'A starter to run the Node-RED open-source project on IBM Cloud.'
            result.platform = 'node'
            result.capabilities = ["cloudant"]
            result.plans = {
                "cloudant": "Lite"
            }
            break;
        case 'mean-app':
            result.name = 'MEAN Stack: MongoDb, Express.js, Angular, Node.js'
            result.description = 'A pattern for setting up a mongodb, express, angular and node application'
            result.platform = 'node'
            break;
        case 'mern-app':
            result.name = 'MERN Stack: MongoDb, Express.js, React, Node.js'
            result.description = 'A pattern for setting up a mongodb, express, react and node application'
            result.platform = 'node'
            break;
        case 'nodejs-cloudant':
            result.name = 'Node.js + Cloudant'
            result.description = 'A web application with Node.js and Cloudant'
            result.platform = 'node'
            result.capabilities = ["cloudant"]
            result.plans = {
                "cloudant": "Lite"
            }
            break;
        case 'swift-kitura-hyper-protect-dbaas':
            result.name = 'Backend for IBM Hyper Protect Services'
            result.description = 'A pattern to create a Swift backend that accelerates consumption of Hyper Protect Services.'
            result.platform = 'swift'
            break;
        case 'knative-eventing-java-app':
            result.name = 'Knative Eventing with Cloud Events';
            result.description = 'A pattern for building a Knative Eventing application in Java, using the Spring and Cloud Events frameworks with a Cloudant database.';
            result.platform = 'spring';
            result.toolchain = [ "KUBE", "KNATIVE" ]
            result.capabilities = ["cloudant"]
            result.plans = {
                "cloudant": "Lite"
            }
            break;
        case 'java-liberty-app':
            result.name = 'Java Liberty App'
            result.description = 'Start building your next Java Liberty app on IBM Cloud.'
            result.platform = 'java'
            break;
        case 'java-spring-app':
            result.name = 'Java Spring App'
            result.description = 'Start building your next Java Spring app on IBM Cloud.'
            result.platform = 'spring'
            break;
        case 'nodejs-express-app':
            result.name = 'Node.js Express App'
            result.description = 'Start building your next Node.js Express app on IBM Cloud.'
            result.platform = 'node'
            break;
        case 'swift-kitura-app':
            result.name = 'Swift Kitura App'
            result.description = 'Start building your next Swift Kitura app on IBM Cloud.'
            result.platform = 'swift'
            break;
        case 'python-django-app':
            result.name = 'Python Django App'
            result.description = 'Start building your next Python Django app on IBM Cloud.'
            result.platform = 'django'
            break;
        case 'python-flask-app':
            result.name = 'Python Flask App'
            result.description = 'Start building your next Python Flask app on IBM Cloud.'
            result.platform = 'python'
            break;
        case 'go-gin-app':
            result.name = 'Go Gin App'
            result.description = 'Start building your next Go Gin app on IBM Cloud.'
            result.platform = 'go'
            break;
        case 'natural-language-understanding-code-pattern'
            result.name = 'Natural Language Understanding Node.js App'
            result.description = 'Use Watson Natural Language Understanding to analyze text to help you understand its concepts, entities, keywords, sentiment, and more.'
            result.platform = 'node'
            result.toolchain = [ "CF", "KUBE" ]
            result.capabilities = ["naturalLanguageUnderstanding"]
            result.plans = {
                "naturalLanguageUnderstanding": "lite"
            }
            break;
        case 'speech-to-text-code-pattern':
            result.name = 'Speech to Text Node.js App'
            result.description = 'React app using the Watson Speech to Text service to transform voice audio into written text.'
            result.platform = 'node'
            result.toolchain = [ "CF", "KUBE" ]
            result.capabilities = ["speechToText"]
            result.plans = {
                "speechToText": "lite"
            }
            break;
        case 'visual-recognition-code-pattern':
            result.name = 'Visual Recognition Node.js App'
            result.description = 'React app using the Watson Visual Recognition service to analyze images for scenes, objects, text, and other subjects.'
            result.platform = 'node'
            result.toolchain = [ "CF", "KUBE" ]
            result.capabilities = ["visualRecognition"]
            result.plans = {
                "visualRecognition": "lite"
            }
            break;
        case 'text-to-speech-code-pattern':
            result.name = 'Text to Speech Node.js App'
            result.description = 'React app using the Watson Text to Speech service to transform text into audio.'
            result.platform = 'node'
            result.toolchain = [ "CF", "KUBE" ]
            result.capabilities = ["textToSpeech"]
            result.plans = {
                "textToSpeech": "lite"
            }
            break;  
    }
    
    return result        
}

/**
  *
  * poll() polls the starter kit registry endpoint to check whether registration is complete.
  *
  * @id The registration id to check the codegen endpoint.
  *
  * @return A JSON object containing the response from the status endpoint or a timeout failure.
  *
  */
function poll(id) {
    const timeout = 480000  // 8 minutes for polling
    const interval = 30000  // 30 seconds
    var rp = require('request-promise') 
    var i = 0
    
    var status_options = {
        method: 'GET',
        uri: `https://global.devx.cloud.ibm.com:443/registry/api/blueprints/${id}`,
        json: true
    }

    var checkCondition = function(resolve, reject) {
        i++
        console.log('polling...')
        
        // Make request to the status endpoint
        rp(status_options).then(res => {
            if(res.status !== "VALIDATING") {
                console.log('Registration complete with status: ' + res.status)
                resolve(res);
            }
            // Still validating - check timeout threshold
            else if (interval*i < timeout) {
                setTimeout(checkCondition, interval, resolve, reject);
            } 
            else {
                console.log('Timeout threshold reached...')
                reject();
            }
            
        }).catch(res => {
            console.log('Polling request failed...')
            reject();
        })
    }

    return new Promise(checkCondition);
}
