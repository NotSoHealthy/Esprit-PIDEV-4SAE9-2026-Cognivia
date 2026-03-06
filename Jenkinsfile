pipeline {
    agent any

    tools {
        maven "M2_HOME"
    }

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

    stages {
        stage("Code Checkout") {
            steps {
                git branch: 'main',
                    url: 'https://github.com/NotSoHealthy/Esprit-PIDEV-4SAE9-2026-Cognivia.git'
            }
        }
        stage('Gateway and Eureka Build and Push') {
            steps {
                script {
                    sh 'echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin'
                    def services = ["gateway", "eureka"]

                    for (s in services) {
                        sh """
                        docker build -t notsohealthy/pidev-${s}:dev BackEnd/${s}/
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
                    def microservices = ["appointment-service", "care", "dpchat", "forum-service","games","monitoring","pharmacy","surveillance-and-equipment"]

                    for (s in microservices) {
                        sh """
                        docker build -t notsohealthy/pidev-${s}:dev BackEnd/Microservices/${s}/
                        docker push notsohealthy/pidev-${s}:dev
                        """
                    }
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh """
                      kubectl get namespace pidev-deployment >/dev/null 2>&1 || kubectl create namespace pidev-deployment
                      kubectl apply -f k8s/ -n pidev-deployment
                    """
                }
            }
        }
        stage('Restart Deployments') {
            steps {
                script {
                    sh """
                        kubectl get deployments -n pidev-deployment -o name | while read -r deploy; do
                            kubectl rollout restart -n pidev-deployment "$deploy"
                        done
                    """
                }
            }
        }
    }
}