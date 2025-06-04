cmake_minimum_required(VERSION 3.10)
project(S13P11A102_ver.3 C)

set(CMAKE_C_STANDARD 99)

include_directories(include)

# main.c 기반 실행 파일
add_executable(main_app
    main.c
    src/storage.c
    src/led.c
    src/mqtt.c
    src/servo.c
    src/servo_sync.c
    src/valve.c
)

# test/main.c 기반 실행 파일
add_executable(test_app
    test/main.c
    src/storage.c
    src/led.c
    src/mqtt.c
    src/servo.c
    src/servo_sync.c
    src/valve.c
)

# 두 실행 파일 모두 필요한 라이브러리 링크
target_link_libraries(main_app
    mosquitto
    cjson
    gpiod 
)

target_link_libraries(test_app
    mosquitto
    cjson
    gpiod
)