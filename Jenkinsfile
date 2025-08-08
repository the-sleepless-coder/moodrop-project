pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        git credentialsId: 'moodrop-gitlab-key-final', url: 'https://lab.ssafy.com/s13-webmobile3-sub1/S13P11A102.git'
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