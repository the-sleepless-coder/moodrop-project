#google cloud에서 translator api 활용.
import pandas as pd
from google.cloud import translate_v2 as translate
import math

INPUT_CSV = "comments_info.csv"
OUT_CSV = "comments_info_ko_out.csv"
FAILED_CSV = "comments_info_failed.csv"

MAX_CHARS = 2_000_000  # 무료 Character 수 한도 보호

client = translate.Client.from_service_account_json(
    "C:/Users/JS/Desktop/Git/S13P11A102/spring-app/moodrop.json"
)

df = pd.read_csv(INPUT_CSV)

def is_empty(x):
    return pd.isna(x) or str(x).strip() == ""

targets = df[df["comment_ko"].apply(is_empty)].copy()

#10K 넘을 때마다, character/row 수를 출력한다.
LOG_STEP = 10_000
next_log_point = LOG_STEP
results = []
failed = []

used_chars = 0

tot_row_count = 0
for _,row in targets.iterrow():
    tot_row_count+=1    


for _, row in targets.iterrows():
    cid = int(row["id"])
    text = str(row["comment"]).strip()

    if not text:
        continue

    # 무료 한도 보호
    if used_chars + len(text) > MAX_CHARS:
        print("Reached free tier limit. Stop batch.")
        print(f"[STOP] limit reached. used_chars={used_chars:,}, rows = {len(results)}")
        break

    try:
        resp = client.translate(text, source_language="en", target_language="ko")
        ko = resp["translatedText"]
        results.append({"id": cid, "comment_ko": ko})
        used_chars += len(text)
        
        # used_chars가 next_log_poing이상이면 한번 찍어주고, 
        # LOG_STEP를 더한만큼 next_log_point를 늘려준다.
        if used_chars>next_log_point:
            print(f"[Progress] used_chars ={used_chars:,} chars, rows = {len(results)}")
            next_log_point +=LOG_STEP

    except Exception as e:
        failed.append({"id": cid, "error": str(e)})

print(f"Translated chars: {used_chars}")
print(f"Translated rows: {len(results)}, Failed: {len(failed)}")

pd.DataFrame(results).to_csv(OUT_CSV, index=False, encoding="utf-8-sig")
pd.DataFrame(failed).to_csv(FAILED_CSV, index=False, encoding="utf-8-sig")