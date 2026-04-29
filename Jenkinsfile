pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS= credentials('docker_hub')
        DOCKER_BUILDKIT = '1'
        PIDEV26_DB_URL = credentials('PIDEV26_DB_URL')
        PIDEV26_DB_USERNAME = credentials('PIDEV26_DB_USERNAME')
        PIDEV26_DB_PASSWORD = credentials('PIDEV26_DB_PASSWORD')
        PIDEV26_KEYCLOAK_CLIENT_SECRET = credentials('PIDEV26_KEYCLOAK_CLIENT_SECRET')
        IMGBB_API_KEY = credentials('IMGBB_API_KEY')
        DEEPSEEK_API_KEY = credentials('DEEPSEEK_API_KEY')
        GOOGLE_AI_API_KEY = credentials('GOOGLE_AI_API_KEY')
    }

    tools { 
        nodejs 'NodeJS 24.15.0 LTS' 
    }

    stages {
        stage("Code Checkout") {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                script {
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        def rootServices = ["gateway", "eureka"]
                        for (s in rootServices) {
                            dir("BackEnd/${s}") {
                                // sh 'chmod +x mvnw'
                                sh './mvnw -B test'
                            }
                        }

                        def microservices = ["appointment-service", "care", "dpchat", "forum-service","games","monitoring","notifications","pharmacy","surveillance-and-equipment"]
                        for (s in microservices) {
                            dir("BackEnd/Microservices/${s}") {
                                // sh 'chmod +x mvnw'
                                sh './mvnw -B test'
                            }
                        }
                    }
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                script {
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        dir('FrontEnd/pidev-26') {
                            sh 'npm config get registry'

                            sh 'npm config set fund false'
                            sh 'npm config set audit false'
                            sh 'npm config set progress true'
                            sh 'npm config set loglevel info'

                            timeout(time: 10, unit: 'MINUTES') {
                                retry(2) {
                                    sh 'npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline --loglevel=info'
                                }
                            }
                            sh 'npm test -- --browsers=ChromeHeadless'
                        }
                    }
                }
            }
        }

        stage('Frontend Build and Push') {
            steps {
                script {
                    sh 'echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin'
                    sh '''
                        docker build -f FrontEnd/pidev-26/Dockerfile -t notsohealthy/pidev-frontend:dev FrontEnd/pidev-26/
                        docker push notsohealthy/pidev-frontend:dev
                    '''
                }
            }
        }

        stage('Gateway and Eureka Build and Push') {
            steps {
                script {
                    sh 'echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin'
                    def services = ["gateway", "eureka"]

                    for (s in services) {
                        sh """
                        docker build -f BackEnd/${s}/Dockerfile -t notsohealthy/pidev-${s}:dev BackEnd/${s}/
                        docker push notsohealthy/pidev-${s}:dev
                        """
                    }
                }
            }
        }
        stage('Microservices Build and Push') {
            steps {
                script {
                    sh 'echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin'
                    def microservices = ["appointment-service", "care", "dpchat", "forum-service","games","monitoring","notifications","pharmacy","surveillance-and-equipment"]

                    for (s in microservices) {
                        sh """
                        docker build -f BackEnd/Microservices/${s}/Dockerfile -t notsohealthy/pidev-${s}:dev BackEnd/Microservices/${s}/
                        docker push notsohealthy/pidev-${s}:dev
                        """
                    }
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh '''
                        kubectl -n pidev-deployment create secret generic secret \
                            --from-literal=PIDEV26_DB_URL="$PIDEV26_DB_URL" \
                            --from-literal=PIDEV26_DB_USERNAME="$PIDEV26_DB_USERNAME" \
                            --from-literal=PIDEV26_DB_PASSWORD="$PIDEV26_DB_PASSWORD" \
                            --from-literal=PIDEV26_KEYCLOAK_CLIENT_SECRET="$PIDEV26_KEYCLOAK_CLIENT_SECRET" \
                            --from-literal=IMGBB_API_KEY="$IMGBB_API_KEY" \
                            --from-literal=DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" \
                            --from-literal=GOOGLE_AI_API_KEY="$GOOGLE_AI_API_KEY" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        for f in k8s/*.yaml; do
                            [ "$f" = "k8s/secret.yaml" ] && continue
                            kubectl apply -f "$f"
                        done
                    '''
                }
            }
        }
        stage('Restart Deployments') {
            steps {
                script {
                    sh '''
                        kubectl get deployments -n pidev-deployment -o name | while read -r deploy; do
                            kubectl rollout restart -n pidev-deployment "$deploy"
                        done
                    '''
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
        }
    }
}