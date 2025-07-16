from RPLCD.i2c import CharLCD
import time

lcd = CharLCD('PCF8574', 0x27, cols=16, rows=2)

try:
    # LCD 화면 지우기
    lcd.clear()
    
    # 첫 번째 줄에 온도 표시
    lcd.cursor_pos = (0, 0)
    lcd.write_string("Temp: 23.5°C")
    
    # 두 번째 줄에 강수량 표시  
    lcd.cursor_pos = (1, 0)
    lcd.write_string("Rain: 0.0mm")
    
    time.sleep(5)
    
except Exception as e:
    print(f"오류: {e}")
finally:
    lcd.clear()
