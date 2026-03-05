pipeline {
    agent any

    tools {
        maven "M2_HOME"
    }

    environment {
        DOCKER_CREDENTIALS= credentials('docker_hub')
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
    }
}