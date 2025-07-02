pipeline {
    agent any

    tools {
        nodejs "node_v24"
    }

    environment {
        API = credentials('MSG_API')
        CLIENT = credentials('MSG_CLIENT')
        DOCKER_ENV = credentials('MSG_DOCKER_ENV')
    }

    stages {

        stage('Detener contenedores'){
            steps {
                script {
                    sh 'docker compose down'
                }
            }
        }

        stage('Delete image if exists'){
            steps {
                script {
                    def imageName = 'api_chat:v1'
                    def images = sh(script: "docker images -q ${imageName}", returnStdout: true).trim()
                    if (images) {
                        sh "docker rmi ${images}"
                    }
                }
            }
        }

        stage('Copy .env files') {
            steps {
                script {
                    def EAC = readFile(API)
                    def ECC = readFile(CLIENT)
                    def EDO = readFile(DOCKER_ENV)

                    writeFile file: './server/.env', text: EAC
                    writeFile file: './client/.env', text: ECC
                    writeFile file: './.env', text: EDO
                }
            }
        }

        stage('Install dependencies and build -> Client') {
            steps {
                dir('client') {
                    sh 'bun install'
                    sh 'bun run build'
                }
            }
        }

        stage('run docker compose'){
            steps {
                script {
                    sh 'docker compose up -d'
                }
            }
        }
    }
}