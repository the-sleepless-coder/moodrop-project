import pandas as pd
import boto3
import time

INPUT_CSV = "comments_info.csv"
OUT_CSV = "comments_info_ko_out.csv"

REGION = "ap-northeast-2"  # 너 aws configure에서 설정한 리전과 맞추면 좋음

translate = boto3.client("translate", region_name=REGION)

df = pd.read_csv(INPUT_CSV, encoding="cp949")

# comment_ko가 비어있는 것만 번역 대상
def is_empty(x):
    return pd.isna(x) or str(x).strip() == ""

targets = df[df["comment_ko"].apply(is_empty)].copy()

results = []
failed = []

for i, row in targets.iterrows():
    cid = int(row["id"])
    text = str(row["comment"])

    # 너무 긴 텍스트 방지(대충 안전하게 자름: 필요하면 조정)
    if len(text) > 4000:
        text = text[:4000]

    try:
        resp = translate.translate_text(
            Text=text,
            SourceLanguageCode="en",
            TargetLanguageCode="ko"
        )
        ko = resp["TranslatedText"]
        results.append({"id": cid, "comment_ko": ko})
    except Exception as e:
        failed.append({"id": cid, "error": str(e)})
    
    # 레이트리밋/안정성용 아주 짧은 텀(필요 시 조절)
    if len(results) % 200 == 0:
        print(f"translated {len(results)}")
        time.sleep(0.2)

pd.DataFrame(results).to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
pd.DataFrame(failed).to_csv("comments_info_failed.csv", index=False, encoding="utf-8-sig")

print("done:", len(results), "failed:", len(failed))