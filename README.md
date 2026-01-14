[ 공통 프로젝트 ]

### 프로젝트 개요
자신의 감정에 따른 원하는 향수를 만들 수 있는 IoT기기 및 기기 제어 어플리케이션 구현현

### 어플리케이션 주요 기능 
    · **향수의 주요 원료에서 나는 향에 따른 느낌을 분류한 무드를 기준으로, 향수에 대한 느낌 선택**
    · 개별 사용자가 선택한 감정의 향수 느낌을 가장 잘 내는 원료 추천 
    · **내가 보유한 원료 기준으로 향수 만들 수 있는지 여부 보여주기**
    · 추천한 배합의 원료를 IoT기기로 송신 후, 해당 원료로 수신한 기기에서 향수 제작

   1. 감정 선택하기
<img width="800" height="650" alt="Pasted image 20260114192250" src="https://github.com/user-attachments/assets/fb4dfbb5-6ea6-4502-856f-b5dec251a399" />

   2. 자신의 감정에 맞는 향수 추천 받기
<img width="800" height="650" alt="Pasted image 20260114192416" src="https://github.com/user-attachments/assets/8fa1f0d3-6ecc-4688-8674-1d661921be82" />

   3. 추천 받은 향수에 대한 정보 확인하기
<img width="1500" height="850" alt="Pasted image 20260114192532" src="https://github.com/user-attachments/assets/158553ab-3517-4b7e-b4c4-74c1bfa81576" />

  4. 추천 받은 향수에 대한 원료 비중 확인하기 
   <img width="1031" height="750" alt="image" src="https://github.com/user-attachments/assets/198c7edf-85fa-4369-8a88-b91f50e6286f" />
 
### 주요 기술 스택
<img width="3675" height="2009" alt="Pasted image 20251224142443" src="https://github.com/user-attachments/assets/020c1818-f71a-4b11-80b3-99ece4a4fe15" />

1) Spring Boot 
 웹 백엔드 서버 구축
 
2) Python        
Fragrantica 향수 데이터 웹 스크래핑

3) C               
IoT기기 제어

4) MySQL
ERD 생성 및 DB구축

5) React Native
모바일 앱 제작

6) Docker/Jenkins
Docker를 활용한 백엔드 서버 이미지 컨테이너화 
Jenkins를 활용한 EC2에 배포하는 CI/CD파이프라인 구축

### 본인 구현 사항
-ERD 구축 및 반정규화를 통한 DB 성능 최적화

: 평균 평점 계산에서 읽기 성능 최적화를 위한 DB 반정규화 

-Docker 이미지 컨테이너화 및 Jenkins를 활용한 CI/CD 파이프라인 구축

-Fragrantica에서 7000개에 달하는 대량 향수 데이터 웹 스크래핑

: 향수의 향조(향수가 내는 대표적인 향의 계열), 브랜드, 평점, 댓글 등 세부 정보까지 저장


### 기술적 세부 사항
[BackEnd]
<br>
-ERD 구축 및 반정규화를 통한 DB 성능 최적화

: 평균 평점 계산에서 읽기 성능 최적화를 위한 DB 반정규화 

-평균 계산 최적화 전략

: 전체 평점 데이터를 매번 집계하지 않고, 평점 추가 시 델타(delta) 값만 반영하여 평균을 갱신

: 삽입 시점에 평균을 계산하여, 사용자–향수 관계 테이블에 **평균 평점 컬럼을 반정규화하여 저장**

: 조회 시에는 복잡한 `AVG`, `GROUP BY` 연산 없이 **사전 계산된 평균 값만 읽도록 설계**

[CI/CD]
<br>
-Docker Compose를 활용해 Spring Boot 및 MySQL 컨테이너화를 통한, 서버 실행 환경 구축

-GitLab Webhook을 이용한, Jenkins 기반의 Spring Boot 코드 CI/CD 파이프라인 구성

[AI]
<br>
- 느낌 <-> 향조 <-> 원료 비율 추천

사용자가 고른 느낌에 따라 상관 관계가 높은 향조(향수가 내는 대표적인 향의 계열)를 3개 추출.

그리고 IoT기기에 전송되는 원료를 뽑아내기 위해서 해당 향조와 상관 관계가 높은 원료를 Top,Middle,Base(원료에 따른 향의 지속 시간과 원료의 역할에 따른 분류)의 비율을 계산해서 추천.

각 원료 별로 골라진 향조를 가장 잘 나타내는 것을 상관관계 수치에 따라서 높은 순으로 뽑아낸다.

- 구체적인 원료 비율 추천 방식
  
기본적으로 Top, Middle, Base(20%, 40%, 20%)를 배정한다. 그리고 나머지 20%의 원료는 위에서 계산한 향조-원료 상관관계 수치를 이용해, 해당 비중을 이용한 가중평균 수치를 이용해 남은 비율(20%)을 배정한다. 

사용자는 추천 받은 원료의 양을 자기 자신이 원하는 배합에 따라 조정할 수 있다.

### ERD
<img width="1177" height="800" alt="Pasted image 20260114151612" src="https://github.com/user-attachments/assets/c109c6e2-3905-4262-a5e4-c16a5a56ceb6" />

- 참고 사이트
[1] https://www.fragrantica.com/
