import datetime
from flask import Flask, render_template
import RPi_I2C_driver
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
load_dotenv()

my_lcd = RPi_I2C_driver.lcd()

api_key = os.getenv("API_KEY")
url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

@app.route('/', methods=["GET"])
def index():
    now = datetime.datetime.now()
    base_date = now.strftime('%Y%m%d')

    base_time = 2310
    while base_time > int(now.strftime('%H%M')):
        base_time -= 300
    base_time -= 10
    base_time_str = f"{base_time:04}"

    params = {
        'serviceKey': api_key,
        'numOfRows': 48,
        'pageNo': 1,
        'dataType': 'JSON',
        'base_date': base_date,
        'base_time': base_time_str,
        'nx': 60,
        'ny': 125,
    }

    response = requests.get(url=url, params=params)
    data = response.json()
    items = data["response"]["body"]["items"]["item"]

    target_categories = ["POP", "PCP"]
    forecast = {}

    for item in items:
        category = item["category"]
        if category in target_categories:
            time_key = f"{item['fcstDate']} {item['fcstTime']}"
            if time_key not in forecast:
                forecast[time_key] = {}
            forecast[time_key][category] = item["fcstValue"]

    next_forecast = None
    now_str = now.strftime('%Y%m%d %H%M')
    for time_key in sorted(forecast.keys()):
        if time_key > now_str:
            next_forecast = forecast[time_key]
            break

    if next_forecast:
        pop = int(next_forecast.get('POP', 0))
        pcp = next_forecast.get('PCP', '0')
        try:
            pcp_val = float(pcp.replace('mm', '')) if 'mm' in pcp else float(pcp)
        except:
            pcp_val = 0.0

        if pop >= 50:
            if pcp_val > 4.0:
                mode = "heavy_rain"
            else:
                mode = "light_rain"
        else:
            mode = "sunny"
    else:
        mode = "sunny"

    my_lcd.lcd_clear()
    if mode == "sunny":
        my_lcd.lcd_display_string("   - O -    ", 1)
        my_lcd.lcd_display_string("  /  |  \\   ", 2)
    elif mode == "light_rain":
        my_lcd.lcd_display_string("  (     )   ", 1)
        my_lcd.lcd_display_string("    .   .   ", 2)
    elif mode == "heavy_rain":
        my_lcd.lcd_display_string(" ( ) ( ) ( )", 1)
        my_lcd.lcd_display_string("' ' ' ' ' '", 2)

    return render_template("index.html", forecast=forecast)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
