import requests
from datetime import datetime
from requests import hooks
import xmltodict
from flask import Flask, render_template, request
import RPi.GPIO as GPIO
import pandas as pd

def get_current_date_string():
    current_date = datetime.now().date()
    return current_date.strftime("%Y%m%d")

def get_current_hour_string():
    now = datetime.now()
    if now.minute<45: # base_time와 base_date 구하는 함수
        if now.hour==0:
            base_time = "2330"
        else:
            pre_hour = now.hour-1
            if pre_hour<10:
                base_time = "0" + str(pre_hour) + "30"
            else:
                base_time = str(pre_hour) + "30"
    else:
        if now.hour < 10:
            base_time = "0" + str(now.hour) + "30"
        else:
            base_time = str(now.hour) + "30"

    return base_time


keys = '1TB56admXov7EJOyvUHA0Y9afFJtTC1jXACv4pix/tGV3v0y6dZmmA9SzpZTXZtSNxThhcaUTq2T01PSeoMoLg=='
url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst'
params ={'serviceKey' : keys, 
         'numOfRows' : '1000',
         'pageNo' : '1', 
         'dataType' : 'XML', 
         'base_date' : get_current_date_string(), 
         'base_time' : get_current_hour_string(), 
         'nx' : '55', 
         'ny' : '127' }

def forecast():
    res = requests.get(url, params = params)

    xml_data = res.text
    dict_data = xmltodict.parse(xml_data)

    weather_data = dict()
    for item in dict_data['response']['body']['items']['item']:
        if item['category'] == 'T1H':
            weather_data['tmp'] = item['fcstValue']
        # 습도
        if item['category'] == 'REH':
            weather_data['hum'] = item['fcstValue']
        if item['category'] == 'SKY':
            weather_data['sky'] = item['fcstValue']
        if item['category'] == 'PTY':
            weather_data['sky2'] = item['fcstValue']

    return weather_data

def proc_weather(loc):
    dict_sky = forecast()

    str_sky = loc + "\n"
    if dict_sky['sky'] != None or dict_sky['sky2'] != None:
        str_sky = str_sky + "날씨 : "
        if dict_sky['sky2'] == '0':
            if dict_sky['sky'] == '1':
                str_sky = str_sky + "맑음"
            elif dict_sky['sky'] == '3':
                str_sky = str_sky + "구름많음"
            elif dict_sky['sky'] == '4':
                str_sky = str_sky + "흐림"
        elif dict_sky['sky2'] == '1':
            str_sky = str_sky + "비"
        elif dict_sky['sky2'] == '2':
            str_sky = str_sky + "비와 눈"
        elif dict_sky['sky2'] == '3':
            str_sky = str_sky + "눈"
        elif dict_sky['sky2'] == '5':
            str_sky = str_sky + "빗방울이 떨어짐"
        elif dict_sky['sky2'] == '6':
            str_sky = str_sky + "빗방울과 눈이 날림"
        elif dict_sky['sky2'] == '7':
            str_sky = str_sky + "눈이 날림"
        str_sky = str_sky + "\n"
    if dict_sky['tmp'] != None:
        str_sky = str_sky + "온도 : " + dict_sky['tmp'] + 'ºC \n'
    if dict_sky['hum'] != None:
        str_sky = str_sky + "습도 : " + dict_sky['hum'] + '%'

    return str_sky

file_path = "./data/2411_locToXY.xlsx"
df = pd.read_excel(file_path)

def find_grid_position(location: str) -> tuple:
    parts = location.strip().split()

    cond = True
    if len(parts) >= 1:
        cond &= df["1단계"] == parts[0]
    if len(parts) >= 2:
        cond &= df["2단계"] == parts[1]
    if len(parts) >= 3:
        cond &= df["3단계"] == parts[2]

    result = df[cond]

    if not result.empty:
        x = result.iloc[0]["격자 X"]
        y = result.iloc[0]["격자 Y"]
        return int(x), int(y)
    else:
        return None

GPIO.setmode(GPIO.BCM)
GPIO.setup(2, GPIO.OUT)

app = Flask(__name__)
GPIO.output(2, False)
@app.route('/',methods=["GET"])
def index():
    return render_template("index.html")

@app.route('/button', methods=['POST'])
def button():
    user_input = request.form['inputText']
    print("위치", user_input)

    x, y = find_grid_position(user_input)
    print(x, y)
    params['nx'] = str(x)
    params['ny'] = str(y)
    params['base_date'] = get_current_date_string()
    params['base_time'] = get_current_hour_string()
    return render_template("index.html", user_input=proc_weather(user_input).replace("\n", "<br>"))

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)





