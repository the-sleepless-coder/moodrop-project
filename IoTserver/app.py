from flask import Flask, render_template, request

import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)

GPIO.setup(2, GPIO.OUT)

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/on', methods=['POST'])
def on():
    print("Turning on GPIO pin 2")
    GPIO.output(2, True)
    return render_template('index.html')

@app.route('/off', methods=['POST'])
def off():
    print("Turning off GPIO pin 2")
    GPIO.output(2, False)
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2222)