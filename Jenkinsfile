pipeline {
    agent any
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME = 'myapi-image'
        FRONT_IMAGE_NAME = 'myfront-image'
    }
    stages {
        stage('Build API Docker Image') {
            steps {
                dir('server') {
                    script {
                        docker.build(env.IMAGE_NAME, '.')
                    }
                }
            }
        }
        stage('Build Frontend') {
            steps {
                dir('client') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
        stage('Build Frontend Docker Image') {
            steps {
                dir('client') {
                    script {
                        docker.build(env.FRONT_IMAGE_NAME, '.')
                    }
                }
            }
        }
        stage('Push Images to DockerHub') {
            steps {
                script {
                    docker.withRegistry('', env.DOCKERHUB_CREDENTIALS) {
                        docker.image(env.IMAGE_NAME).push('latest')
                        docker.image(env.FRONT_IMAGE_NAME).push('latest')
                    }
                }
            }
        }
        stage('Deploy with Docker Compose') {
            steps {
                sh 'docker-compose down || true'
                sh 'docker-compose up -d'
            }
        }
    }
}