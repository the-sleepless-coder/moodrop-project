# 1. Liberica 17이 포함된 베이스 이미지 사용
FROM bellsoft/liberica-openjdk-debian:17

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 호스트의 jar 파일을 컨테이너로 복사
# 자동으로 jar 파일 을 app.jar로 복사한다.
COPY target/*.jar app.jar

# 4. 실행 명령
CMD ["java", "-jar", "app.jar"]