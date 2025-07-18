import requests
from datetime import datetime

print(requests.__version__)

def get_weather(num):
    #1 초단기 실황
    # 초단기실황정보는 예보 구역에 대한 대표 AWS 관측값
    url1 = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"

    #2 초단기 예보
    # 초단기예보는 예보시점부터 6시간까지의 예보
    url2 = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst"

    #3 단기 예보
    # 단기예보는 예보기간을 글피까지 확장 및 예보단위를 상세화(3시간→1시간)하여 시공간적으로 세분화한 예보
    
    today = datetime.today().strftime("%Y%m%d")
    
    params = {
        "serviceKey": "w8rfMcJCprtDvYBGFXkcIMRtIVBx1dAcMKfGzYY5Lq/9En6xfL9hpK6yJwRrpByiL0WuBILCGxTB0mZeTCC2kQ==",
        "numOfRows": "10",
        "pageNo": "1",
        "base_date": today,
        "base_time": "0600",
        "nx": "61",
        "ny": "125",
        "dataType" : "JSON"
    }

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}

    #num = int(input("1: 초단기 실황, 2:초단기 예보 \n"))
    if(num == 1):
        url = url1
    elif(num==2):
        url = url2

    response = requests.get(url, params = params, headers = headers)

    # 상태코드가 200이 아닌 경우에만, 상태코드를 출력한다.
    if(response.status_code != 200):
        print("Status Code")
        print(response.status_code)

    print("Response")
    # 초단기 실황
    # T1H : 기온, RN1: 1시간 강수량, REH: 습도, WSD: 풍속
    # WSD: 1 = ~ 4m/s, 2 = 4 ~ 9m/s, 3 = 9m/s ~
    if(url == url1):
        data = response.json()['response']['body']['items']['item'] 
        result = {}
        for item in data:
            # print(f"{item['category']} {item['obsrValue']}")
            # 필요한 항목에는 이름을 붙이고, 
            # 필요 없는 항목은 버린다.
            cat = item['category']
            if(cat == 'T1H'):
                cat = '기온'
            elif(cat == 'RN1'):
                cat = '강수량'
            elif(cat == 'REH'):
                cat = '습도'
            elif(cat == 'WSD'):
                cat = '풍속'
            else:
                continue

            value = item['obsrValue']
            result[cat] = value
        
        print(result)
        #print(dict.iteritems())

    return result

    # header_info = response.headers
    # print("Header info")
    # if(url == url1):
    #     print(header_info)


get_weather(1)