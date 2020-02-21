/**
  *
  * main() will be run when you invoke this action
  *
  * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
  *
  * @return The output of this action, which must be a JSON object.
  *
  */
const VALID_REPOS = [ 
                    'nfstein/git-sandbox',
                    'IBM/mean-app',
                    'IBM/mern-app',
                    'IBM/swift-kitura-app',
                    'IBM/swift-kitura-hyper-protect-dbaas',
                    'IBM/node-red-app',
                    'IBM/nodejs-express-app',
                    'IBM/nodejs-cloudant',
                    'IBM/java-liberty-app',
                    'IBM/java-spring-app',
                    'IBM/python-flask-app',
                    'IBM/python-django-app',
                    'IBM/go-gin-app',
                    'IBM/knative-eventing-java-app',
                    'watson-developer-cloud/natural-language-understanding-code-pattern',
                    'watson-developer-cloud/speech-to-text-code-pattern',
                    'watson-developer-cloud/visual-recognition-code-pattern',
                    'watson-developer-cloud/text-to-speech-code-pattern'
                ]

const master = 'refs/heads/master'
const development = 'refs/heads/development'

params.log += "in git \n"

// repo name and urls
const repoFullName = params.repository.full_name

params.log += "Registration request recieved for pattern: " + repoFullName + "\n"


// Early-out conditions - invalid repos & non-master branches
if (!VALID_REPOS.includes(repoFullName)) {
    throw new error('Not a valid repository: ' + repoFullName)
}
if (params.ref !== master && params.ref !== development) {
    throw new error('Ref: ' + params.ref)
} 

params

 
