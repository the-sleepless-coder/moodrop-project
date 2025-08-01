from adafruit_servokit import ServoKit
import time
import smbus2
import busio
import board

i2c_bus = busio.I2C(board.SCL, board.SDA)

def i2c_scan(i2c):
    while not i2c.try_lock():
        pass
    devices = i2c.scan()
    i2c.unlock()
    return devices


try:
    print("Scanning I2C bus...")
    devices = i2c_scan(i2c_bus)
    print(f"I2C devices found: {[hex(device) for device in devices]}")

    if not devices:
        raise ValueError("No I2C devices found on the bus.")

    try:
        kit = ServoKit(channels=16, i2c=i2c_bus, address=0x60)
        print("PCA9685 initialized at address 0x60.")
    except Exception as e:
        print(f"Error initializing PCA9685: {e}")
        raise

    bottle_close = 0
    bottle_open = 120
    kit.servo[0].angle = bottle_close
    input("If initializing the angle ls complete, push the enter button.")

    print("Servo motors initialized.")
    print("Starting servo control test...")

    for i in range(bottle_close, bottle_open, 5):  
        kit.servo[0].angle = i
        #print(f"Servo 0 angle: {i}")
        time.sleep(0.1)
        
    kit.servo[0].angle = bottle_open
    time.sleep(3)
    
    for i in range(bottle_open, bottle_close, -5):
        kit.servo[0].angle = i
        #print(f"Servo 0 angle: {i}")
        time.sleep(0.1)
        
    kit.servo[0].angle = bottle_close
	
    print("Servo control test completed.")

except Exception as e:
    print(f"An error occurred: {e}")
