// FA2 - Jenkins declarative pipeline (Pipeline as Code)
// Git push -> Checkout -> Build -> Unit Test -> Security Scan -> Docker Build
//          -> Push image -> Deploy to Kubernetes -> Smoke test -> Scale
// Written for Jenkins running on Windows (uses bat steps).

pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 25, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    // Jenkins checks the Git repo every ~2 minutes and starts a build
    // automatically when it finds a new commit (a "git push").
    triggers {
        pollSCM('H/2 * * * *')
    }

    parameters {
        booleanParam(name: 'PUSH_TO_GHCR', defaultValue: true,
                     description: 'Push images to GitHub Container Registry (needs credentials with ID ghcr-creds)')
        string(name: 'KIND_CLUSTER', defaultValue: 'fa2',
               description: 'Only if your cluster is a kind cluster: its name, so images are loaded into it. Leave empty otherwise.')
        string(name: 'BACKEND_REPLICAS', defaultValue: '3',
               description: 'Backend replicas to scale to at the end of the pipeline')
    }

    environment {
        BACKEND_IMAGE  = 'ghcr.io/vbbbbbb/fa2-backend'
        FRONTEND_IMAGE = 'ghcr.io/vbbbbbb/fa2-frontend'
    }

    stages {

        stage('Checkout') {
            steps {
                script {
                    def scmVars = checkout scm
                    env.SHORT_SHA  = scmVars.GIT_COMMIT.take(7)
                    env.IMAGE_TAG  = "${env.BUILD_NUMBER}-${env.SHORT_SHA}"
                }
                echo "Commit ${env.SHORT_SHA}  ->  image tag ${env.IMAGE_TAG}"
            }
        }

        stage('Build') {
            steps {
                dir('docker/backend') {
                    bat 'node --version'
                    bat 'npm ci'
                }
            }
        }

        stage('Unit Test') {
            steps {
                dir('docker/backend') {
                    // Pipeline fails here (and later stages are skipped) if any test fails
                    bat 'npm test'
                }
            }
        }

        stage('Security Scan (DevSecOps)') {
            steps {
                // Dependency vulnerability scan. Marks the stage UNSTABLE (yellow)
                // instead of failing the whole pipeline.
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                    dir('docker/backend') {
                        bat 'npm audit --omit=dev --audit-level=high'
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest docker/backend'
                bat 'docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest docker/frontend'
                bat 'docker images --filter "reference=ghcr.io/vbbbbbb/fa2-*"'
            }
        }

        stage('Push Images to GHCR') {
            when { expression { return params.PUSH_TO_GHCR } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'ghcr-creds',
                                                  usernameVariable: 'GH_USER',
                                                  passwordVariable: 'GH_TOKEN')]) {
                    bat 'echo %GH_TOKEN%| docker login ghcr.io -u %GH_USER% --password-stdin'
                    bat 'docker push %BACKEND_IMAGE%:%IMAGE_TAG%'
                    bat 'docker push %BACKEND_IMAGE%:latest'
                    bat 'docker push %FRONTEND_IMAGE%:%IMAGE_TAG%'
                    bat 'docker push %FRONTEND_IMAGE%:latest'
                    bat 'docker logout ghcr.io'
                }
            }
        }

        stage('Load Images into kind') {
            when { expression { return params.KIND_CLUSTER?.trim() } }
            steps {
                bat "kind load docker-image %BACKEND_IMAGE%:%IMAGE_TAG% --name ${params.KIND_CLUSTER.trim()}"
                bat "kind load docker-image %FRONTEND_IMAGE%:%IMAGE_TAG% --name ${params.KIND_CLUSTER.trim()}"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                bat 'kubectl apply -f k8s/namespace.yaml'
                // Deploy the exact image tag built by THIS run -> triggers a rolling update
                bat '''powershell -NoProfile -Command "(Get-Content k8s/backend.yaml -Raw) -replace 'fa2-backend:latest','fa2-backend:%IMAGE_TAG%' | kubectl apply -f -"'''
                bat '''powershell -NoProfile -Command "(Get-Content k8s/frontend.yaml -Raw) -replace 'fa2-frontend:latest','fa2-frontend:%IMAGE_TAG%' | kubectl apply -f -"'''
                bat 'kubectl -n fa2 rollout status deployment/backend --timeout=180s'
                bat 'kubectl -n fa2 rollout status deployment/frontend --timeout=180s'
                bat 'kubectl -n fa2 get deployments,pods,services'
            }
        }

        stage('Smoke Test') {
            steps {
                // Requests travel frontend (Nginx) -> backend Service, inside the cluster
                bat 'kubectl -n fa2 run smoke-health-%BUILD_NUMBER% --rm -i --restart=Never --image=busybox:1.36 -- wget -qO- http://frontend/api/health'
                bat 'kubectl -n fa2 run smoke-status-%BUILD_NUMBER% --rm -i --restart=Never --image=busybox:1.36 -- wget -qO- http://frontend/api/status'
                bat '''kubectl -n fa2 run smoke-metrics-%BUILD_NUMBER% --rm -i --restart=Never --image=busybox:1.36 -- sh -c "wget -qO- http://backend-api:5000/metrics | grep process_cpu_seconds_total"'''
            }
        }

        stage('Scale') {
            steps {
                bat "kubectl -n fa2 scale deployment/backend --replicas=${params.BACKEND_REPLICAS}"
                bat 'kubectl -n fa2 rollout status deployment/backend --timeout=180s'
                bat 'kubectl -n fa2 get deployment backend'
                bat 'kubectl -n fa2 rollout history deployment/backend'
            }
        }
    }

    post {
        success {
            echo "SUCCESS: image tag ${env.IMAGE_TAG} built, tested and deployed to Kubernetes."
        }
        failure {
            echo 'FAILED: see the first red stage above. Later stages were skipped.'
            bat(returnStatus: true, script: 'kubectl -n fa2 get pods')
        }
    }
}

