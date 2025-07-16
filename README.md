# S13P11A102 - AIoT 라즈베리 파이 웹 서버 연결 프로젝트

## 프로젝트 개요

AIoT 서브 프로젝트로 라즈베리 파이와 웹 서버의 연결을 간단하게 구현하는 프로젝트입니다.
Flask를 기반으로 한 세 가지 주요 애플리케이션을 통해 IoT 장치와 웹 인터페이스 간의 상호작용을 구현합니다.

## 주요 기능

### 1. 날씨 모니터링 시스템 (Sub_1)
- 기상청 API를 통한 실시간 날씨 정보 조회
- I2C LCD 디스플레이에 온도 및 강수량 표시
- 웹 인터페이스를 통한 날씨 정보 확인

### 2. GPIO 제어 서버 (IoTserver)
- 라즈베리 파이 GPIO 핀 제어
- 웹 인터페이스를 통한 하드웨어 ON/OFF 제어
- GPIO 핀 2번 제어 구현

### 3. 웹 계산기 (web)
- 약수 계산 기능
- 사용자 입력 처리 및 결과 표시

## 시스템 요구사항

### 하드웨어
- 라즈베리 파이 (GPIO 액세스 가능)
- 16x2 I2C LCD 디스플레이 (PCF8574 컨트롤러)
- 적절한 I2C 설정이 완료된 라즈베리 파이 OS

### 소프트웨어
- Python 3.10 이상
- Flask 3.1.1 이상
- 필요한 Python 패키지들 (pyproject.toml 참조)

## 설치 및 실행

### 1. 환경 설정
```bash
# 의존성 설치 (uv 사용)
uv sync

# 또는 pip 사용
pip install flask python-dotenv requests rpi-gpio rplcd smbus
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:
```bash
WEATHER_API_KEY=your_korean_weather_api_key
```

### 3. 애플리케이션 실행
각 애플리케이션은 포트 2222에서 실행되므로 개별적으로 실행해야 합니다.

```bash
# 날씨 모니터링 시스템
cd Sub_1
python app.py

# GPIO 제어 서버
cd IoTserver
python app.py

# 웹 계산기
cd web
python app.py
```

### 4. 하드웨어 테스트
```bash
# LCD 디스플레이 테스트
cd Sub_1
python test.py
```

## API 설정

### 한국 기상청 API
- 서비스: 초단기실황조회 (getUltraSrtNcst)
- 위치: nx=61, ny=125 (고정값, 역삼)
- 필요한 데이터: 기온(T1H), 습도(REH), 강수량(RN1), 풍속(WSD), 풍향(VEC)

## 프로젝트 구조

```
S13P11A102/
├── Sub_1/                  # 날씨 모니터링 시스템
│   ├── app.py             # 메인 Flask 애플리케이션
│   ├── test.py            # LCD 테스트 스크립트
│   └── templates/
│       └── index.html     # 웹 인터페이스
├── IoTserver/             # GPIO 제어 서버
│   ├── app.py             # GPIO 제어 애플리케이션
│   └── templates/
│       └── index.html     # 제어 인터페이스
├── web/                   # 웹 계산기
│   ├── app.py             # 계산기 애플리케이션
│   ├── templates/
│   │   └── index.html     # 계산기 인터페이스
│   └── static/
│       └── css/
│           └── style.css  # 스타일시트
├── pyproject.toml         # 프로젝트 의존성
└── README.md              # 프로젝트 문서
```

## 기술 스택

- **백엔드**: Flask (Python)
- **하드웨어 제어**: RPi.GPIO, RPLCD
- **외부 API**: 한국 기상청 날씨 API
- **환경 관리**: python-dotenv
- **HTTP 통신**: requests

## 주요 특징

### 에러 처리
- LCD 초기화 실패 시 graceful degradation
- API 요청 실패 시 에러 핸들링
- 하드웨어 미사용 시 소프트웨어 모드로 동작

### 하드웨어 추상화
- 하드웨어 사용 가능성 확인 후 기능 제공
- 애플리케이션 종료 시 GPIO 정리
- 모듈형 하드웨어 컴포넌트 초기화

## 개발 정보

- **개발 환경**: Python 3.10+
- **패키지 관리**: uv (또는 pip)
- **포트**: 2222 (모든 애플리케이션)
- **호스트**: 0.0.0.0 (외부 접근 허용)