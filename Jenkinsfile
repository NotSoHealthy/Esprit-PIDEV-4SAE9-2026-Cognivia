pipeline {
    agent any

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
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

    stages {
        stage("Code Checkout") {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests and SonarQube Analysis') {
            steps {
                withSonarQubeEnv('jenkins-sonar') {
                    script {
                        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                            def rootServices = ["gateway", "eureka"]
                            for (s in rootServices) {
                                dir("BackEnd/${s}") {
                                    sh 'chmod +x mvnw'
                                    // sh './mvnw -B test'
                                    sh './mvnw -B verify sonar:sonar'
                                }
                            }

                            def microservices = ["appointment-service", "care", "dpchat", "forum-service","games","monitoring","notifications","pharmacy","surveillance-and-equipment"]
                            for (s in microservices) {
                                dir("BackEnd/Microservices/${s}") {
                                    sh 'chmod +x mvnw'
                                    // sh './mvnw -B test'
                                    sh './mvnw -B verify sonar:sonar'
                                }
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
                        // Jenkins agents often lack a Chrome binary; run tests in a container and install Chromium.
                        // NOTE: Requires Docker Pipeline plugin + a Jenkins agent that can run Docker.
                        sh 'docker version'
                        docker.image('node:24-bullseye').inside('-u root:root --shm-size=1g') {
                            dir('FrontEnd/pidev-26') {
                                sh '''
                                    set -e
                                    node -v
                                    npm -v

                                    apt-get update
                                    apt-get install -y --no-install-recommends chromium
                                    rm -rf /var/lib/apt/lists/*

                                    export CI=true
                                    export CHROME_BIN=/usr/bin/chromium

                                    npm config set fund false
                                    npm config set audit false
                                    npm ci --legacy-peer-deps --no-audit --no-fund
                                    npm test -- --code-coverage
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('Frontend SonarQube Analysis') {
            steps {
                withSonarQubeEnv('jenkins-sonar') {
                    dir('FrontEnd/pidev-26') {
                        sh '''
                            set -e
                            "${SCANNER_HOME}/bin/sonar-scanner" \
                              -Dsonar.projectKey=pidev-26-frontend \
                              -Dsonar.projectName="PIDEV-26 Frontend" \
                              -Dsonar.sources=src \
                              -Dsonar.tests=src \
                              -Dsonar.test.inclusions="src/**/*.spec.ts" \
                              -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/coverage/**" \
                              -Dsonar.javascript.lcov.reportPaths="coverage/**/lcov.info" \
                              -Dsonar.sourceEncoding=UTF-8
                        '''
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

                        kubectl apply -f k8s/ -n pidev-deployment
                    '''
                }
            }
        }
        stage('Restart Deployments') {
            steps {
                script {
                    sh 'kubectl rollout restart deployment -n pidev-deployment'
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