from flask import Flask, render_template, request
import requests
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from RPLCD.i2c import CharLCD
import time


load_dotenv('../.env')

api_key = os.getenv('WEATHER_API_KEY')

# LCD 초기화
try:
    lcd = CharLCD('PCF8574', 0x27, cols=16, rows=2)
    lcd_available = True
    print("LCD 초기화 성공")
except Exception as e:
    print(f"LCD 초기화 실패: {e}")
    lcd_available = False
    lcd = None

def get_current_weather_params():
    """현재 시각에 맞는 base_date와 base_time 계산"""
    now = datetime.now()
    
    # 매시 30분에 발표되므로, 현재 시각이 30분 이전이면 이전 시간 사용
    if now.minute < 30:
        # 30분 이전이면 이전 시간의 데이터 사용
        target_hour = now.hour - 1
        target_date = now
        
        if target_hour < 0:
            # 00:30 이전이면 어제 23시 데이터 사용
            target_hour = 23
            target_date = now - timedelta(days=1)
    else:
        # 30분 이후면 현재 시간의 데이터 사용
        target_hour = now.hour
        target_date = now
    
    base_date = target_date.strftime('%Y%m%d')
    base_time = f"{target_hour:02d}00"
    
    return base_date, base_time


def get_weather_data():
    """현재 날씨 데이터를 가져오는 함수"""
    base_date, base_time = get_current_weather_params()

    url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst'
    params ={'serviceKey': api_key, 
            'pageNo': '1', 
            'numOfRows': '1000',
            'dataType': 'JSON',
            'base_date': base_date,
            'base_time': base_time,
            'nx': '61',
            'ny': '125'}

    response = requests.get(url, params=params)
    data = response.json().get('response').get("body").get("items").get("item")

    for obj in data:
        if obj['category'] == 'T1H':
            temperature = obj['obsrValue']
        elif obj['category'] == 'REH':
            humidity = obj['obsrValue']
        elif obj['category'] == 'RN1':
            precipitation = obj['obsrValue']
        elif obj['category'] == 'WSD':
            wind_speed = obj['obsrValue']
        elif obj['category'] == 'VEC':
            wind_direction = obj['obsrValue']

    return {
        'temperature': temperature,
        'humidity': humidity,
        'precipitation': precipitation,
        'wind_speed': wind_speed,
        'wind_direction': wind_direction
    }


def view_pie(data):
    """라즈베리 파이에 날씨 정보 표시"""

    if not lcd_available or not lcd:
        print("LCD를 사용할 수 없습니다.")
        return
    
    if not data:
        print("날씨 데이터가 없습니다.")
        return

    try:
        print("LCD에 데이터 표시 중...")
        
        # LCD 화면 지우기
        lcd.clear()
        
        # 첫 번째 줄에 온도 표시 (딕셔너리 접근 방식 수정)
        temp_str = f"Temp: {data['temperature']}°C"[:16]  # 16자 제한
        lcd.cursor_pos = (0, 0)
        lcd.write_string(temp_str)
        
        # 두 번째 줄에 강수량 표시  
        rain_str = f"Rain: {data['precipitation']}mm"[:16]  # 16자 제한
        lcd.cursor_pos = (1, 0)
        lcd.write_string(rain_str)
        
        print(f"LCD 표시: {temp_str} | {rain_str}")
        
        # 10초 동안 표시 (논블로킹으로 변경 고려)
        time.sleep(10)
        
    except Exception as e:
        print(f"LCD 표시 오류: {e}")
    finally:
        try:
            lcd.clear()
        except:
            pass


app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    """메인 페이지"""
    return render_template('index.html')

@app.route('/weather', methods=['POST'])
def weather():
    """날씨 정보 페이지"""
    weather_data = get_weather_data()
    view_pie(weather_data)  # 라즈베리 파이에 날씨 정보 표시

    return render_template('index.html', weather=weather_data)

# 앱 종료 시 LCD 정리
import atexit

def cleanup_lcd():
    if lcd_available and lcd:
        try:
            lcd.clear()
            print("LCD 정리 완료")
        except:
            pass

atexit.register(cleanup_lcd)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2222)