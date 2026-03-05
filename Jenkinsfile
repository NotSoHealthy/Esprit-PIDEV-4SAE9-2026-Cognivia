pipeline {
    agent any

    tools {
        maven "M2_HOME"
    }

    environment {
        DOCKER_CREDENTIALS= credentials('docker_hub')
        DOCKER_BUILDKIT = '1'
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
                      kubectl apply -f k8s/config.yaml
                      kubectl apply -f k8s/ -n pidev-deployment
                    """
                }
            }
        }
        stage('Restart Deployment') {
            steps {
                script {
                    sh 'kubectl rollout restart deployment --all -n pidev-deployment'
                }
            }
        }
    }
}