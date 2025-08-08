pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        git credentialsId: 'cc767be2-4e03-488f-bb28-ee1889028c7b', url: 'https://lab.ssafy.com/hellojaeseok/testproject.git'
      }
    }

    stage('Build Spring Boot Jar') {
      steps {
        dir('spring-app') {
        sh 'chmod +x mvnw'
        sh './mvnw clean package -DskipTests'
        }
      }
    }

    stage('Check Docker') {
        steps {
            sh 'docker ps'
        }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker compose build'
      }
    }

    stage('Run Docker Containers') {
      steps {
        sh 'docker compose up -d'
      }
    }

    // stage('Deploy') {
    //     steps {
    //         sshagent(['ec2-key']) {
    //         sh 'ssh ubuntu@3.39.229.189 "cd /home/ubuntu/app && docker-compose pull && docker-compose up -d"'
    //         }
    //     }
    // }

    }
}