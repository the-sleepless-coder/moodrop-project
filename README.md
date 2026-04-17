### 프로젝트 개요
자신의 감정에 따른 원하는 향수를 만들 수 있는 IoT기기 및 기기 제어 어플리케이션 구현현

### 어플리케이션 주요 기능 
    · 향수의 주요 원료에서 나는 향에 따른 느낌을 분류한 무드를 기준으로, 향수에 대한 느낌 선택
    · 개별 사용자가 선택한 감정의 향수 느낌을 가장 잘 내는 원료 추천 
    · 채팅을 통해 상황에 맞는 향수 추천 받기
    · 내가 보유한 원료 기준으로 향수 만들 수 있는지 여부 보여주기
    · 추천한 배합의 원료를 IoT기기로 송신 후, 해당 원료로 수신한 기기에서 향수 제작

   1. 감정 선택하기
<img width="800" height="950" alt="Pasted image 20260114192250" src="https://github.com/user-attachments/assets/fb4dfbb5-6ea6-4502-856f-b5dec251a399" />

   2. 자신의 감정에 맞는 향수 추천 받기
<img width="800" height="950" alt="Pasted image 20260114192416" src="https://github.com/user-attachments/assets/8fa1f0d3-6ecc-4688-8674-1d661921be82" />

   3. 추천 받은 향수에 대한 정보 확인하기
<img width="1500" height="950" alt="Pasted image 20260114192532" src="https://github.com/user-attachments/assets/158553ab-3517-4b7e-b4c4-74c1bfa81576" />

  4. 추천 받은 향수에 대한 원료 비중 확인하기 
   <img width="1031" height="950" alt="image" src="https://github.com/user-attachments/assets/198c7edf-85fa-4369-8a88-b91f50e6286f" />
 
### 서버 아키텍처
<img width="525" height="464" alt="image" src="https://github.com/user-attachments/assets/46c15fe7-3af9-41b2-ac40-453bab79dd76" />

1) Spring Boot 
 
 -웹 백엔드 서버 구축
 
2) Elastic Search        

-읽기 모델로서 검색 성능 향상

-멀티 필드 조건 검색, 실시간 자동 완성 기능 구현

-우선순위에 따른 스코어링 시스템 도입, 검색 우선순위를 반영한 검색 시스템 구현.

3) QDrant

-벡터화된 향수 댓글/설명 데이터를 저장하는 역할

-메타데이터와 함께 향수 데이터를 저장하여, 의미 기반 검색 결과를 반환하게 함.

4) Ollama
 
nomic-embed-text 모델을 이용해 한국어/영어 향수 정보를 벡터화함. 영어 중심 모델이라서 한국어 임베딩에 조금 약하지만, 범용성 측면에서 쓰기 좋은 모델임.

5) MySQL
ERD 생성 / DB구축

6) React Native
모바일 앱 제작

7) Docker/Jenkins
-Docker를 활용한 백엔드 서버 이미지 컨테이너화 

-Jenkins를 활용한 EC2에 배포하는 CI/CD파이프라인 구축

### 본인 구현 사항
· 담당 역할 : 인프라 / 백엔드 코드 단독 구현 (100%)

· ES를 이용한, 한,영 설명 / 멀티 필드 조건 검색 구현 (100%)

· Redis를 이용한 실시간 조회 수 집계 / 레시피 랭킹 기능 구현 (100%)

· 향수 원 데이터 추가 시, 이미지 처리 · 번역 · 벡터화 · 저장 비동기 파이프라인 구현 (100%)

· Vector DB 기반,  의미 기반 검색 / 사용자 개인화 정보 반영 챗봇 구현 (100%)

· Docker & Jenkins기반, 빌드/운영 서버 리소스를 고려한 CI/CD설계 (100%)


### 기술적 세부 사항
[BackEnd]

·  Elastic Search 역 인덱스 검색 방식을 이용, 읽기 모델로서 검색 성능 향상

 - 모든 칼럼을 Elastic Search에 반정규화하여 저장, 역인덱스 검색을 통한 검색 속도 향상

·  Redis를 활용, 조회 수 반영 시 분산 처리 환경 및 Lost update에서 생기는 경쟁 상태를 분산락 / Double Buffering을 통해 해결

·  향수 원데이터 추가 시, 비동기 병렬 처리 방식으로 데이터 가공· 저장 파이프라인 구성

·  VectorDB 활용, 사용자의 개인화된 정보 기반 의미기반 검색 활용 향수 추천 챗봇 구현

[CI/CD]

·CI를 위한 통합 -> 테스트 -> 빌드하는 Jenkins 서버와 운영을 위한 EC2서버를 분리할 수 있게 CI/CD 파이프라인을 설계. 

·Jenkins에서 빌드한 Docker이미지를 Docker hub에 업로드. EC2서버에서 이미지를 pull 받아서 실행하는 방식으로, 빌드/운영 서버의 리소스를 고려하여 파이프라인 설계.

[AI]

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
