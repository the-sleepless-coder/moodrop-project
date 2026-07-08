## 프로젝트 개요
**Moodrop**은 감정을 향수로 바꾸는 IoT 백엔드입니다. 사용자가 무드를 고르면, 검색 엔진이 어울리는 향수를 찾고, 벡터 DB가 의미 기반으로 추천하고, 추천된 배합이 IoT 기기로 전송돼 실제 향수가 제작됩니다 — 데이터를 통해 향수를 추천하는 IoT제작 기기 제어 어플리케이션을 구현했습니다.

## Overview
 
자신의 감정에 따라 원하는 향수를 만들 수 있는 IoT 기기와 제어 애플리케이션의 백엔드입니다. 

무드 기반 원료 추천, 챗봇 향수 추천, 보유 원료 기준 제작 가능 여부 판단, IoT 기기로의 배합 송신까지를 담당합니다. 

## Key Features
 
- **무드 기반 추천** — 원료의 향 느낌을 분류한 무드를 기준으로, 선택한 감정에 맞는 원료 추천
- **다조건 향수 검색** — 멀티 필드 조건 검색 + Search as you type 실시간 자동 완성 + Boosting 필드별 가중치(이름/향조/원료 일치 시 우선 노출)
- **한국어 검색 정확도** — NoriTokenizer 형태소 분석·품사 태깅으로 한국어 질의 대응
- **개인화 추천 챗봇** — 벡터화된 향수 정보에 대한 의미 기반 검색 + 사용자 선호(향수/원료/검색 키워드) 반영
- **실시간 조회 수/랭킹** — 쿨다운 기반 중복 조회 방지, 분산 환경에서 정확한 집계
- **IoT 연동** — 추천 배합을 기기로 송신, 수신한 원료 비율로 향수 제작

   1. 감정 선택하기
<img width="819" height="1144" alt="image" src="https://github.com/user-attachments/assets/c5d29da9-ccb9-47d6-b504-b5b3764e0091" />

   2. 자신의 감정에 맞는 향수 추천 받기
<img width="923" height="1114" alt="image" src="https://github.com/user-attachments/assets/72c0b6b4-d6d4-4998-a73e-3c7fc7cdb738" />

   3. 추천 받은 향수에 대한 정보 확인하기
<img width="740" height="634" alt="image" src="https://github.com/user-attachments/assets/eacac7c1-9921-4a85-a96b-6dc652697404" />


  4. 추천 받은 향수에 대한 원료 비중 확인하기 
  <img width="1203" height="254" alt="image" src="https://github.com/user-attachments/assets/21141a1a-91dc-4279-8f43-7cd16b34c1a5" />

## Data Flow
 
**① 향수 데이터 적재 — 비동기 병렬 파이프라인**
 
```
Admin ──→ MySQL (향수 원 데이터 저장)
              ↓  비동기 병렬 처리
    ┌─────────┼──────────┐
썸네일 변환   영/한 번역   벡터화 (Ollama nomic-embed-text)
    └─────────┼──────────┘
              ↓
   ElasticSearch (반정규화 검색 문서)
   QDrant       (벡터 + 메타데이터)
```
 
**② 챗봇 추천 — 의미 기반 검색**
 
```
사용자 쿼리 ──→ 벡터화
      ↓
QDrant 코사인 유사도 Top 20 (후보)
      ↓  성별 일치 + 개인화 정보 반영
최종 5개 선정
      ↓
OpenAI API ──→ 총평 + 향수별 설명 생성 ──→ 응답
```
 
**③ 조회 수 집계 — 경쟁 상태 제어**
 
```
조회 발생 ──→ 쿨다운 검사 (일정 시간 내 중복 조회 차단)
      ↓
Redis 버퍼 집계 (분산 락 + Double Buffering)
      ↓
MySQL 반영 (Lost update 없이)
```

## Repository Structure
 
```
moodrop-project/            (branch: Final-Backend_Dev)
├── jmeter/                 # 부하 테스트 시나리오
├── spring-app/             # Spring Boot 백엔드 (단일 앱)
│   └── moodrop/
│       ├── controller/     # REST API 엔드포인트
│       ├── service/        # 비즈니스 로직
│       ├── repository/ · entity/ · DTO/ · Enums/   # 도메인 데이터 계층
│       ├── model/          # dao · domain · dto · repository · service — 별도 데이터 계층
│       ├── elasticsearch/  # 반정규화 검색 문서 · 질의 (읽기 모델)
│       ├── mqtt/           # inbound / outbound — IoT 기기 배합 송수신
│       ├── event/ · listener/   # 비동기 파이프라인 이벤트 발행/구독
│       ├── scheduler/      # 주기 작업 (집계 반영 등)
│       ├── interceptor/    # 요청 인터셉터
│       ├── security/       # JWT · UserDetails
│       ├── config/         # 인프라 연동 설정
│       ├── typehandler/    # MyBatis 타입 핸들러
│       ├── exception/ · utils/
│       └── ...
├── Jenkinsfile             # CI/CD — 빌드(Jenkins)/운영(EC2) 서버 분리 파이프라인
├── docker-compose.yml      # 인프라 구성
└── README.md
```

 ## My Contributions
 
인프라 / 백엔드 코드 **단독 구현 (100%)**
 
| 구현 항목 | 기여도 |
|---|---|
| ES 기반 한/영 설명·멀티 필드 조건 검색 | 100% |
| Redis 기반 실시간 조회 수 집계·레시피 랭킹 | 100% |
| 이미지 처리·번역·벡터화·저장 비동기 파이프라인 | 100% |
| VectorDB 기반 의미 검색·개인화 챗봇 | 100% |
| Docker & Jenkins 기반 CI/CD 설계 | 100% |
| 향수 백엔드 도메인 ERD 설계 | 100% |
 
**CI/CD 세부**: 통합→테스트→빌드하는 Jenkins 서버와 운영 EC2 서버를 분리. Jenkins가 빌드한 Docker 이미지를 Docker Hub에 업로드하고 EC2가 pull 받아 실행 — 빌드/운영 서버의 리소스 분리를 고려한 설계.

## 서버 아키텍처
<img width="525" height="464" alt="image" src="https://github.com/user-attachments/assets/46c15fe7-3af9-41b2-ac40-453bab79dd76" />

## Tech Stack
 
```
Backend   : Spring Boot (Java) · MySQL · ElasticSearch · QDrant · Redis
AI        : Ollama (nomic-embed-text) · OpenAI API
Client    : React Native · IoT Device
Infra     : Docker · Docker Hub · Jenkins · AWS EC2 · JMeter
```
 
## License
 
None declared — personal project.
 

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

향수 원 데이터 저장

6) React Native

모바일 앱 제작

7) Docker/Jenkins
   
-Docker를 활용한 백엔드 서버 이미지 컨테이너화 

-Jenkins를 활용한 EC2에 배포하는 CI/CD파이프라인 구축



### 기술적 세부 사항
[BackEnd]

·  Elastic Search 역 인덱스 검색 방식을 이용, 읽기 모델로서 검색 성능 향상

 -모든 칼럼을 Elastic Search에 반정규화하여 저장, 역인덱스 검색을 통한 검색 속도 향상

·  Redis를 활용, 조회 수 반영 시 분산 처리 환경 및 Lost update에서 생기는 경쟁 상태를 분산락 / Double Buffering을 통해 해결

·  향수 원데이터 추가 시, 비동기 병렬 처리 방식으로 데이터 가공· 저장 파이프라인 구성

·  VectorDB 활용, 사용자의 개인화된 정보 기반 의미기반 검색 활용 향수 추천 챗봇 구현

·  향수 백엔드 도메인에 대한 ERD 구조 설계

[CI/CD]

·CI를 위한 통합 -> 테스트 -> 빌드하는 Jenkins 서버와 운영을 위한 EC2서버를 분리할 수 있게 CI/CD 파이프라인을 설계. 

·Jenkins에서 빌드한 Docker이미지를 Docker hub에 업로드. EC2서버에서 이미지를 pull 받아서 실행하는 방식으로, 빌드/운영 서버의 리소스를 고려하여 파이프라인 설계.

[AI]

- 의미 검색 기반 사용자 개인화된 정보를 반영한 향수 추천

 사용자의 쿼리에 대해 가장 높은 코사인 유사도 수치를 보인 향수 20개를 향수 후보로 지정.

 사용자 쿼리의 성별과 일치할 경우, 사용자의 개인화된 정보를 반영한 향수 5개를 최종적으로 추천. 

 Open AI API호출을 통해, 최종적으로 추천된 향수 5개에 대한 총평 및 각각의 향수에 대한 설명을 응답으로 반환.
 

- 구체적인 원료 비율 추천 방식
  
기본적으로 Top, Middle, Base(20%, 40%, 20%)를 배정한다. 그리고 나머지 20%의 원료는 위에서 계산한 향조-원료 상관관계 수치를 이용해, 해당 비중을 이용한 가중평균 수치를 이용해 남은 비율(20%)을 배정한다. 

사용자는 추천 받은 원료의 양을 자기 자신이 원하는 배합에 따라 조정할 수 있다.

### ERD
<img width="1397" height="900" alt="image" src="https://github.com/user-attachments/assets/e1382aa8-d820-452b-a650-aa9178a4f93d" />

- 참고 사이트
[1] https://www.fragrantica.com/
