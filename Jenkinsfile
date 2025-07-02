pipeline {
    agent any

    tools {
        nodejs "node_v24"
    }

    environment {
        API = credentials('MSG_API')
        CLIENT = credentials('MSG_CLIENT')
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

                    writeFile file: './server/.env', text: EAC
                    writeFile file: './client/.env', text: ECC
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