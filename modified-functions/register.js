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
    
    const rp = require('request-promise') 
    const Promise = require('bluebird')
    const itm = require('@ibm-functions/iam-token-manager')
    
    // repo name and urls
    const repoFullName = params.repository.full_name
    const repoName     = params.repository.name
    const apiURL       = params.repository.url
    const htmlURL      = params.repository.html_url
    const apikey       = params.apikey
    
    delete params.apikey // delete apikey so it does not show up in the logs.
      
    console.log("Registration request processing for pattern: " + repoFullName)
    
    
    // get IAM token
    const m = new itm({
        "iamApikey": apikey
    })
    return m.getToken().then(token => {

        // construct requests to registry endpoint
        var data = dictionary(repoName)
        var name = data.name
        var toolchain = data.toolchain || [ "CF", "KUBE", "KNATIVE" ] // to accomodate serverless and knative
        var capabilities = data.capabilities || []
        var plans = data.plans || {}

        var payload = {
            "blueprint": {
                "description": data.description,
                "name": data.name,
                "platform": data.platform,
                "toolchain": toolchain,
                "type": "PATTERN",
                "requiredCapabilities": capabilities,
                "servicePlans": plans
             },
            "repoURL": apiURL
        }
        
         // Send payload to global endpoint
        var options = {
            method: 'POST',
            uri: `https://global.devx.cloud.ibm.com:443/registry/api/blueprints`,
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: payload,
            json: true
        }
          
        // Parse response to get job id
        return rp(options)
            .then(response => {
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
            result.toolchain = ["CF", "KUBE" ]
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
        case 'nodejs-react-app':
            result.name = 'Node.js Web App with Express.js and React'
            result.description = 'A pattern that provides a rich React frontend via a Node.js application, including key web development tools.'
            result.platform = 'node'
            break;
        /*case 'nodejs-starter':
            result.name = 'Basic Node.js App'
            result.description = 'A simple pattern for a cloud native Node.js application.'
            result.platform = 'node'
            break;
        case 'nodejs-microservice':
            result.name = 'Node.js Microservice with Express.js'
            result.description = 'A pattern for building a microservice backend in Node.js, using the Express.js framework.'
            result.platform = 'node'
            break;
        case 'nodejs-web-app':
            result.name = 'Node.js Web App with Express.js'
            result.description = 'A pattern that provides a basic web serving application in Node.js, using the Express.js framework.'
            result.platform = 'node'
            break;*/
        case 'nodejs-cloudant':
            result.name = 'Node.js + Cloudant'
            result.description = 'A web application with Node.js and Cloudant'
            result.platform = 'node'
            result.capabilities = ["cloudant"]
            result.plans = {
                "cloudant": "Lite"
            }
            break;
        /*case 'spring-starter':
            result.name = 'Basic Spring App'
            result.description = 'A simple pattern for a cloud native Spring application.'
            result.platform = 'spring'
            break;
        case 'spring-microservice':
            result.name = 'Java Microservice with Spring'
            result.description = 'A pattern for building a microservice backend in Java, using the Spring framework.'
            result.platform = 'spring'
            break;
        case 'spring-web-app':
            result.name = 'Java Web App with Spring'
            result.description = 'A pattern that provides a basic web serving application in Java, using the Spring framework.'
            result.platform = 'spring'
            break;
        case 'java-liberty-starter':
            result.name = 'Basic Java App'
            result.description = 'A simple pattern for a cloud native Java application.'
            result.platform = 'java'
            break;
        case 'java-liberty-microservice':
            result.name = 'Java Microservice with Eclipse MicroProfile and Java EE'
            result.description = 'A pattern for building a microservice backend in Java, using the MicroProfile / Java EE framework.'
            result.platform = 'java'
            break;
        case 'java-liberty-web-app':
            result.name = 'Java Web App with Eclipse MicroProfile and Java EE'
            result.description = 'A pattern that provides a basic web serving application in Java, using the MicroProfile / Java EE framework.'
            result.platform = 'java'
            break;
        case 'flask-starter':
            result.name = 'Basic Flask App'
            result.description = 'A simple pattern for a cloud native Python Flask application.'
            result.platform = 'python'
            break;
        case 'flask-microservice':
            result.name = 'Python Microservice with Flask'
            result.description = 'A pattern for building a microservice backend, using the Flask framework.'
            result.platform = 'python'
            break;
        case 'flask-web-app':
            result.name = 'Python Web App with Flask'
            result.description = 'A pattern that provides a basic web serving application using the Flask framework.'
            result.platform = 'python'
            break;
        case 'django-web-app':
            result.name = 'Python Web App with Django'
            result.description = 'A pattern for building a basic web serving application, using the Django framework.'
            result.platform = 'django'
            break;
        case 'go-starter':
            result.name = 'Basic Go App'
            result.description = 'A simple pattern for a cloud native Go application.'
            result.platform = 'go'
            break;
        case 'go-microservice':
            result.name = 'Go Microservice with Gin'
            result.description = 'A pattern for building a microservice backend, using the Gin framework.'
            result.platform = 'go'
            break;
        case 'go-web-app':
            result.name = 'Go Web App with Gin'
            result.description = 'A pattern that provides a basic web serving application in Go, using the Gin framework.'
            result.platform = 'go'
            break;*/
        case 'swift-kitura-hyper-protect-dbaas':
            result.name = 'Backend for IBM Hyper Protect Services'
            result.description = 'A pattern to create a Swift backend that accelerates consumption of Hyper Protect Services.'
            result.platform = 'swift'
            break;
        /*case 'swift-starter':
            result.name = 'Basic Swift App'
            result.description = 'A simple pattern for a cloud native Swift application.'
            result.platform = 'swift'
            break;
        case 'swift-web-app':
            result.name = 'Swift for Web App Serving'
            result.description = 'A pattern that provides a basic web serving application in Swift, using the Kitura framework.'
            result.platform = 'swift'
            break;*/
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