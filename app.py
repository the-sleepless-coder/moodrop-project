from flask import Flask, render_template, request
from weather import get_weather

app = Flask(__name__)

# 날씨 정보 받아서 화면에 띄운다.
@app.route('/', methods = ["GET"])
def index():
    weather_info = get_weather(1)
    #weather_forecast = get_weather(2)
    return render_template("index.html", weather = weather_info)

if __name__=='__main__':
    app.run(host = "0.0.0.0", port = 1234, debug = True)


