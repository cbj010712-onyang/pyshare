/* =====================================================================
   주차 목록 (여기만 고치면 주차 카드, 이번 주 할 일, 예시 코드가 바뀌어요)
   - sheet   : 활동지 파일 이름. 비우면 "활동지 없음"
   - goal    : 이번 주 목표 한 줄
   - todo    : 이번 주 할 일 {t: 제목, d: 설명, sub: [세부], act: 'sheet'(활동지 버튼) | 'code'(코드 버튼)}
   - examples: 예시 코드 {id, field: 'data' | 'web' | 'sec' | 'all', title, desc, code, files}
               files: 예시가 읽는 CSV 파일 이름 (아래 PYSHARE_CSV 에 있는 것)
               학생이 [이 예시로 시작]을 누르면 이 코드로 새 프로젝트가 만들어져요
   예시 코드를 고칠 때는 code 글자 안의 \n(줄바꿈)과 \" (따옴표 앞 역슬래시)를 지켜요.
   ===================================================================== */
window.PYSHARE_FIELDS = { data: '① 데이터 분석', web: '② 미니 웹앱', sec: '③ AI 윤리·보안', all: '공통' };
window.PYSHARE_WEEKS = [
 {
  "no": 2,
  "title": "분야와 주제 정하기",
  "sheet": "week2.html",
  "goal": "내가 할 분야를 고르고, 프로젝트 주제를 한 문장으로 정해요.",
  "todo": [
   {
    "t": "활동지 1번: 분야 고르기",
    "d": "데이터 분석, 미니 웹앱, AI 윤리·보안 중 1~2개를 골라요. 두 개를 고르면 어떻게 섞을지도 한 줄로 적어요.",
    "act": "sheet"
   },
   {
    "t": "활동지 2번: 아이디어 2가지 꺼내기",
    "d": "평소에 불편했거나 궁금했던 것을 2가지 적어요. 예) 시험 기간에 공부 계획 세우기가 귀찮다."
   },
   {
    "t": "활동지 3번: 주제를 한 문장으로",
    "d": "\"누구를 위해 / 무엇을 만들어서 / 무엇을 알아내거나 해결\" 세 칸을 채우면 문장이 완성돼요. 막히면 \"주제 예시 보기\"를 열어 내 상황에 맞게 바꿔요."
   },
   {
    "t": "활동지 4번: 좋은 주제인지 점검",
    "d": "세 가지가 모두 체크되어야 통과예요.",
    "sub": [
     "한 문장으로 말할 수 있다 (설명이 길면 주제가 너무 커요)",
     "핵심 기능이 1~2개뿐이다",
     "재료를 직접 구할 수 있다 (반 친구 10~20명 설문이면 충분)"
    ]
   },
   {
    "t": "2주차 코드 제출: 내 프로젝트 소개 프로그램",
    "d": "아래 예시 코드로 시작해서 변수 3개를 내 주제로 바꾸고 ▶ 실행한 뒤 [저장]해요. 저장 메모에 무엇을 바꿨는지 적어요.",
    "act": "code"
   },
   {
    "t": "활동지 [제출하기]",
    "d": "맨 아래 [제출하기]를 누르면 항목별 답과 활동지 이미지가 멘토링 아카이브에 저장돼요. 이 이미지는 3주차에 AI 피드백을 받을 때 써요.",
    "act": "sheet"
   },
   {
    "t": "다음 시간까지 준비",
    "d": "활동지 5번에 나온 내 분야의 준비물을 해 와요.",
    "sub": [
     "데이터 분석: 설문 질문 3개 생각해 오기 (이름·학번은 묻지 않기)",
     "미니 웹앱: 화면을 종이에 그리고 \"입력 → 규칙 → 출력\"을 한 줄로 적기",
     "AI 윤리·보안: 문제점 2~3개와 해결 방법, 찾은 곳(출처) 적기"
    ]
   }
  ],
  "examples": [
   {
    "id": "w2",
    "field": "all",
    "title": "내 프로젝트 소개",
    "desc": "변수 3개와 print로 내 주제를 소개해요. 변수와 f-문자열을 연습해요.",
    "code": "# 할 일\n#  1) 아래 변수 3개를 내 프로젝트 내용으로 바꿔요\n#  2) ▶ 실행해서 소개 문장이 잘 나오는지 확인해요\n#  3) [저장]을 누르고 메모에 \"주제 소개 완성\"처럼 적어요\n\ntopic = \"우리 반 수면시간 그래프\"            # 주제: 무엇을 만들까?\ntarget = \"우리 반 친구들\"                    # 누구를 위해?\ngoal = \"잠을 많이 자면 덜 피곤한지 알아보기\"  # 무엇을 알아내거나 해결할까?\n\nprint(\"=== 내 프로젝트 소개 ===\")\nprint(\"주제:\", topic)\nprint(\"누구를 위해:\", target)\nprint(\"알아낼 것:\", goal)\nprint(f\"나는 {target}을(를) 위해 {topic}을(를) 만들어서 {goal}!\")\n\n# 도전: input()으로 친구 이름을 받아서\n#       \"○○야, 내 프로젝트를 소개할게!\"라고 먼저 출력해 보세요.\n"
   }
  ]
 },
 {
  "no": 3,
  "title": "AI 피드백 받고 설계하기",
  "sheet": "week3.html",
  "goal": "AI에게 주제 피드백을 받고, 내 분야의 설계를 마친 뒤 첫 코드를 직접 써요.",
  "todo": [
   {
    "t": "2주차 활동지 이미지 받기",
    "d": "활동지 1번 아래 [멘토링 아카이브에 제출한 2주차 활동지 이미지 받기]를 눌러 이미지를 내 기기에 받아요.",
    "act": "sheet"
   },
   {
    "t": "활동지 1번: AI에게 피드백 받기",
    "d": "Gemini나 ChatGPT에 이미지를 올리고, 활동지의 프롬프트를 복사해서 함께 보내요. AI의 답을 붙여 넣고, 그중 반영할 것 한 가지를 골라요."
   },
   {
    "t": "활동지 2번: 분야와 주제 다듬기",
    "d": "AI 피드백을 반영해서 주제를 한 문장으로 다시 적어요. 활동지 위쪽 [2주차 불러오기]를 누르면 2주차 분야와 주제가 채워지고, 2주차 답이 옆에 떠서 보면서 고칠 수 있어요."
   },
   {
    "t": "활동지 3번: 분야별 할 일",
    "d": "할 일을 누르면 방법과 링크가 나오고, 맨 아래 칸을 채우면 저절로 체크돼요.",
    "sub": [
     "데이터 분석: 설문 질문 3개 · 개인정보 점검 · 구글폼 만들기(배포는 다음 주)",
     "미니 웹앱: 입력 → 규칙 → 출력 정리 · 규칙 표 3줄 이상 · 웹앱 화면 설명",
     "AI 윤리·보안: 문제점 2개와 출처 · 해결 방법 2개 · 캠페인 웹앱 핵심 기능 고르기"
    ]
   },
   {
    "t": "3주차 코드 제출: 직접 코딩",
    "d": "활동지의 \"직접 코딩\" 할 일을 Colab 대신 멘토링 아카이브에서 해도 돼요. 내 분야 예시 코드로 시작해서 보기·규칙·질문을 내 주제로 바꾸고 ▶ 실행한 뒤 [저장]해요.",
    "act": "code",
    "sub": [
     "데이터 분석: answers 를 내 설문 보기로 바꾸고 count 로 세기",
     "미니 웹앱: 내 규칙 표를 if / elif / else 로",
     "AI 윤리·보안: 내 캠페인 O/X 퀴즈 한 문제"
    ]
   },
   {
    "t": "코드와 실행 결과를 활동지에 붙여 넣고 [제출하기]",
    "d": "멘토링 아카이브에서 쓴 코드를 복사해 활동지의 \"내가 쓴 코드\" 칸에 붙여 넣고, 실행 결과도 적어요. 그다음 [제출하기].",
    "act": "sheet"
   },
   {
    "t": "다음 주 준비",
    "d": "활동지 4번의 준비할 일과 발표까지의 로드맵을 확인해요. 막힌 점은 질문 칸에 남겨요."
   }
  ],
  "examples": [
   {
    "id": "w3-data",
    "field": "data",
    "title": "설문 응답 개수 세기",
    "desc": "리스트와 count, for 반복문으로 보기마다 몇 명인지 세요.",
    "code": "# 할 일\n#  1) answers 를 내 설문 보기로 바꿔요 (반 친구 10명이 대답했다고 생각하고)\n#  2) options 에 보기 종류를 모두 적어요\n#  3) ▶ 실행해서 보기마다 몇 명인지 확인해요\n\nanswers = [\"학원\", \"집\", \"학원\", \"독서실\", \"학원\", \"집\", \"도서관\", \"학원\", \"집\", \"독서실\"]\noptions = [\"학원\", \"집\", \"독서실\", \"도서관\"]\n\nprint(\"전체 응답:\", len(answers), \"명\")\nfor option in options:\n    count = answers.count(option)    # 리스트 안에 option 이 몇 번 있는지 세요\n    print(option, \":\", count, \"명\")\n\n# 도전: 가장 많이 나온 보기를 찾아서 \"가장 많은 답은 ○○예요\"라고 출력해 보세요.\n#       힌트) max(options, key=answers.count)\n"
   },
   {
    "id": "w3-csv",
    "field": "data",
    "title": "CSV 파일 열어 보기",
    "desc": "pandas로 설문 CSV를 불러와서 응답 수, 질문 이름, 보기별 응답 수를 봐요. 다음 주 read_csv 연습이에요.",
    "files": [
     "study_survey.csv"
    ],
    "code": "# 할 일\n#  1) ▶ 실행해서 CSV 파일 안에 무엇이 있는지 봐요\n#  2) 열 이름 하나를 골라 value_counts() 줄의 열 이름을 바꿔 실행해 봐요\n#  3) 다음 주에는 \"study_survey.csv\"를 내 설문 CSV 파일 이름으로 바꿔요\n# 쓰는 파일: study_survey.csv (편집기 위 [📄 데이터]에서 미리 볼 수 있어요)\n\nimport pandas as pd\n\ndf = pd.read_csv(\"study_survey.csv\")     # CSV 파일 → 표(DataFrame)\n\nprint(\"응답 수:\", len(df), \"명\")\nprint(\"질문(열) 이름:\")\nfor col in df.columns:\n    print(\" -\", col)\n\nprint()\nprint(\"[첫 번째 응답]\")\nprint(df.iloc[0])                          # 0번 줄(첫 응답)을 세로로 보기\n\nprint()\nprint(\"[공부하는 곳별 응답 수]\")\nprint(df[\"주로 어디에서 공부하나요?\"].value_counts())\n\n# 도전: 휴대폰 사용 시간의 평균을 구해 보세요.\n#       힌트) df[\"하루 휴대폰 사용 시간 (시간)\"].mean()\n"
   },
   {
    "id": "w3-web",
    "field": "web",
    "title": "규칙을 if문으로",
    "desc": "기온을 입력받아 규칙에 맞는 옷을 알려 줘요. input, int, if / elif / else.",
    "code": "# 할 일\n#  1) 아래 규칙을 내 규칙 표로 바꿔요 (조건 → 결과 3줄 이상)\n#  2) ▶ 실행하고 여러 값을 넣어서 결과가 맞는지 확인해요\n#  3) 생각해 보기: 기준이 높은 것부터 검사해야 해요. 순서를 바꾸면 어떻게 될까요?\n\ntemp = int(input(\"오늘 기온은 몇 도인가요? \"))\n\nif temp >= 28:          # 규칙 1\n    print(\"반팔을 입어요\")\nelif temp >= 17:        # 규칙 2\n    print(\"맨투맨을 입어요\")\nelse:                   # 어떤 규칙에도 맞지 않을 때\n    print(\"패딩을 입어요\")\n\n# 도전: 비가 오는지도 input()으로 물어보고, 비가 오면 \"우산도 챙겨요\"를 출력해 보세요.\n"
   },
   {
    "id": "w3-sec",
    "field": "sec",
    "title": "O/X 퀴즈 한 문제",
    "desc": "질문을 보여 주고 O/X를 받아 정답과 해설을 알려 줘요.",
    "code": "# 할 일\n#  1) question, answer, why 를 내 캠페인 내용으로 바꿔요\n#  2) ▶ 실행해서 O와 X를 둘 다 넣어 보고 결과를 확인해요\n\nquestion = \"같은 비밀번호를 여러 사이트에 써도 괜찮을까요?\"\nanswer = \"X\"\nwhy = \"한 곳에서 비밀번호가 새면 다른 계정도 함께 털려요. 사이트마다 다르게 써요.\"\n\nreply = input(question + \" (O/X) \").strip().upper()   # 소문자 o, x 도 받아 줘요\n\nif reply == answer:\n    print(\"정답! 👍\")\nelse:\n    print(\"아쉬워요! 정답은\", answer)\nprint(\"해설:\", why)\n\n# 도전: O나 X가 아닌 글자를 넣으면 \"O 또는 X로 답해 주세요\"라고 알려 주세요.\n"
   }
  ]
 },
 {
  "no": 4,
  "title": "파이썬 실전노트로 코드 만들기",
  "sheet": "week4.html",
  "goal": "지난주 코드를 돌아보고, 실전노트를 따라 내 분야의 핵심 코드를 만들어요.",
  "todo": [
   {
    "t": "활동지 1번: 지난주 코드 돌아보기",
    "d": "4문항에 솔직하게 답하면 나에게 필요한 보강 할 일이 추천돼요.",
    "act": "sheet"
   },
   {
    "t": "활동지 2번: 3주차 활동지로 AI 피드백 받기",
    "d": "[멘토링 아카이브에 제출한 3주차 활동지 이미지 받기]로 이미지를 받아 AI에게 올리고, 피드백 중 반영할 것 한 가지를 적어요. 활동지 위쪽 [3주차 불러오기]로 3주차 답을 옆에 띄워 놓고 주제와 설계를 보충해요."
   },
   {
    "t": "보강 할 일 (추천된 경우)",
    "d": "파이썬 실전노트 \"0. 기초 다지기\"를 실행하고, grade 함수에 70점 규칙을 추가한 뒤 # 주석을 달아요."
   },
   {
    "t": "분야별 실전노트",
    "d": "선생님이 공유한 Colab 실전노트를 차례로 실행해요.",
    "sub": [
     "데이터 분석: 설문 배포·응답 수 확인 → 실전노트 1-1 ~ 1-4 → 내 설문 응답 CSV 불러와 정리 (멘토링 아카이브 편집기의 [📄 데이터]에서 내 CSV를 올리면 멘토링 아카이브에서도 read_csv로 읽을 수 있어요)",
     "미니 웹앱: 실전노트 2-1 ~ 2-4 → RULES 를 내 규칙 표로 → assert 테스트 만들기",
     "AI 윤리·보안: 실전노트 3-1 ~ 3-4 → 퀴즈를 내 문제 5개로 → 결과 메시지 바꾸기"
    ]
   },
   {
    "t": "4주차 코드 제출: 함수와 주석",
    "d": "내 분야 예시 코드로 시작해서 내 데이터·규칙·문제로 바꿔요. 함수 위에는 # [무엇을] [입력] [출력] 주석을 꼭 달아요. 저장할 때 메모도 남겨요. 3주차 코드에 이어서 하려면 [↻ 지난 코드 불러오기]를 눌러요. 3주차 코드는 그대로 남아요.",
    "act": "code"
   },
   {
    "t": "활동지 [제출하기]",
    "d": "활동지의 코드 칸에도 멘토링 아카이브 코드를 붙여 넣고 제출해요.",
    "act": "sheet"
   },
   {
    "t": "다음 주 준비",
    "d": "실전노트 맨 끝 \"선생님께 전달할 내용\" 표를 채워요. 선생님이 이걸 보고 웹앱 첫 버전을 만들어요."
   }
  ],
  "examples": [
   {
    "id": "w4-data",
    "field": "data",
    "title": "그룹별 평균 구하기",
    "desc": "딕셔너리 목록으로 응답을 정리하고, 함수로 그룹별 평균과 결과 문장을 만들어요.",
    "code": "# 할 일\n#  1) rows 를 내 설문 응답으로 바꿔요 (구글폼 응답을 보고 옮겨 적어도 돼요)\n#  2) group_average 로 그룹별 평균을 확인해요\n#  3) 함수 위의 # 주석을 내 말로 다시 써 보세요\n\nrows = [\n    {\"place\": \"학원\", \"hours\": 3},\n    {\"place\": \"집\", \"hours\": 1},\n    {\"place\": \"독서실\", \"hours\": 4},\n    {\"place\": \"학원\", \"hours\": 2},\n    {\"place\": \"집\", \"hours\": 2},\n    {\"place\": \"독서실\", \"hours\": 5},\n    {\"place\": \"학원\", \"hours\": 3},\n]\n\n# [무엇을] 그룹별 평균을 구해요\n# [입력] 응답 목록, 그룹으로 나눌 칸 이름, 평균 낼 칸 이름\n# [출력] {그룹: 평균} 딕셔너리\ndef group_average(rows, key, value):\n    total = {}\n    count = {}\n    for row in rows:\n        k = row[key]\n        total[k] = total.get(k, 0) + row[value]\n        count[k] = count.get(k, 0) + 1\n    return {k: total[k] / count[k] for k in total}\n\nresult = group_average(rows, \"place\", \"hours\")\nfor place, avg in result.items():\n    print(f\"{place}: 평균 {avg:.1f}시간\")\n\nbest = max(result, key=result.get)\nprint(f\"결과: 평균 공부 시간이 가장 긴 곳 → {best} ({result[best]:.1f}시간)\")\n\n# 도전: 그룹별 응답 수도 함께 출력해 보세요. (예: 학원 3명)\n"
   },
   {
    "id": "w4-csv",
    "field": "data",
    "title": "CSV로 그룹별 평균",
    "desc": "설문 CSV를 불러와 열 이름을 짧게 바꾸고, 장소별 평균 공부 시간을 구해 결과 문장을 만들어요.",
    "files": [
     "study_survey.csv"
    ],
    "code": "# 할 일\n#  1) 파일 이름을 내 설문 CSV로 바꿔요 ([📄 데이터]에서 내 CSV를 올리면 이름이 보여요)\n#  2) 열 이름 바꾸기: columns 의 이름을 내 질문 순서에 맞게 짧게 바꿔요\n#  3) groupby 줄의 \"무엇별로\"와 \"무엇의 평균\"을 내 주제로 바꿔요\n# 쓰는 파일: study_survey.csv\n\nimport pandas as pd\n\n# 1. 불러오기\ndf = pd.read_csv(\"study_survey.csv\")\n\n# 2. 열 이름을 짧게 바꾸기 (구글폼 질문은 너무 길어요)\ndf.columns = [\"시간\", \"장소\", \"공부\", \"수면\", \"휴대폰\", \"아침\"]\n\n# 3. 정리하기: 빈칸이 있는 응답은 빼요\ndf = df.dropna()\nprint(\"정리한 응답:\", len(df), \"명\")\nprint()\n\n# 4. 그룹별 평균: 장소별 평균 공부 시간 (높은 순)\navg = df.groupby(\"장소\")[\"공부\"].mean().sort_values(ascending=False)\ncount = df[\"장소\"].value_counts()\nfor place, hours in avg.items():\n    print(f\"{place}: 평균 {hours:.1f}시간 ({count[place]}명)\")\n\nbest = avg.index[0]\nprint()\nprint(f\"결과: 평균 공부 시간이 가장 긴 곳은 {best}({avg.iloc[0]:.1f}시간)이에요.\")\n\n# 도전: 아침을 먹은 사람과 안 먹은 사람의 평균 수면 시간을 비교해 보세요.\n#       힌트) df.groupby(\"아침\")[\"수면\"].mean()\n"
   },
   {
    "id": "w4-web",
    "field": "web",
    "title": "규칙 표 + 함수 + 테스트",
    "desc": "RULES 표와 recommend 함수, assert 테스트로 규칙이 맞는지 확인해요.",
    "code": "# 할 일\n#  1) RULES 를 내 규칙 표로 바꿔요. 기준이 높은 것부터 적어요!\n#  2) DEFAULT 는 어떤 규칙에도 맞지 않을 때의 결과예요\n#  3) ▶ 실행해서 테스트가 모두 통과하는지 봐요. 실패하면 규칙과 테스트 중 무엇이 틀렸는지 따져 봐요\n\nRULES = [\n    (28, \"반팔\"),\n    (20, \"긴팔\"),\n    (12, \"자켓\"),\n]\nDEFAULT = \"패딩\"\n\n# [무엇을] 기온에 맞는 옷을 골라요\n# [입력] 기온(숫자)\n# [출력] 옷 이름\ndef recommend(temp):\n    for limit, clothes in RULES:\n        if temp >= limit:\n            return clothes\n    return DEFAULT\n\n# 테스트: 규칙이 바뀌는 숫자(경계값)와 그 바로 아래 값을 꼭 시험해요\nassert recommend(30) == \"반팔\"\nassert recommend(28) == \"반팔\"\nassert recommend(27) == \"긴팔\"\nassert recommend(12) == \"자켓\"\nassert recommend(5) == \"패딩\"\nprint(\"모든 테스트 통과!\")\n\ntemp = int(input(\"기온을 입력하세요: \"))\nprint(f\"{temp}도에는 {recommend(temp)}을(를) 추천해요.\")\n"
   },
   {
    "id": "w4-sec",
    "field": "sec",
    "title": "퀴즈 여러 문제와 점수",
    "desc": "문제 목록을 반복하며 채점하고, 점수에 맞는 메시지를 보여 줘요.",
    "code": "# 할 일\n#  1) quiz 를 내 캠페인 문제 5개로 바꿔요 (O 문제와 X 문제를 섞어요)\n#  2) why(해설)에는 지난주에 조사한 해결 방법을 넣어요\n#  3) result_message 의 메시지를 내 캠페인에 맞게 바꿔요\n\nquiz = [\n    {\"q\": \"같은 비밀번호를 여러 사이트에 써도 된다.\", \"a\": \"X\", \"why\": \"한 곳이 털리면 다 털려요. 사이트마다 다르게!\"},\n    {\"q\": \"2단계 인증을 켜면 더 안전하다.\", \"a\": \"O\", \"why\": \"비밀번호가 새도 한 번 더 막아 줘요.\"},\n    {\"q\": \"공용 PC에서는 로그아웃하지 않아도 된다.\", \"a\": \"X\", \"why\": \"다음 사람이 내 계정을 그대로 쓸 수 있어요.\"},\n]\n\n# [무엇을] 점수에 맞는 한마디를 골라요\n# [입력] 맞힌 수, 전체 문제 수\n# [출력] 메시지\ndef result_message(score, total):\n    if score == total:\n        return \"완벽해요! 친구들에게도 알려 주세요 🎉\"\n    elif score / total >= 0.6:\n        return \"잘했어요! 틀린 문제의 해설을 다시 읽어 봐요.\"\n    else:\n        return \"조심할 점이 많아요. 해설을 꼭 읽어 봐요.\"\n\nscore = 0\nfor i, item in enumerate(quiz, start=1):\n    reply = input(f\"{i}. {item['q']} (O/X) \").strip().upper()\n    if reply == item[\"a\"]:\n        score += 1\n        print(\"  정답!\")\n    else:\n        print(\"  오답! 정답은\", item[\"a\"])\n    print(\"  해설:\", item[\"why\"])\n\nprint(f\"{len(quiz)}문제 중 {score}문제 정답 ({score * 100 // len(quiz)}%)\")\nprint(result_message(score, len(quiz)))\n"
   }
  ]
 },
 {
  "no": 5,
  "title": "완성하고 다듬기",
  "sheet": "",
  "goal": "멘토 피드백을 반영해 코드를 완성하고, 선생님이 만든 웹앱을 확인해요.",
  "todo": [
   {
    "t": "멘토 피드백 확인하고 반영",
    "d": "4주차 코드에 달린 멘토 피드백을 읽고, 고친 코드를 새 버전으로 저장해요. 예전 버전은 기록에 남아 있어서 언제든 되돌릴 수 있어요."
   },
   {
    "t": "분야별 완성",
    "d": "작은 것부터 하나씩 완성하고, 될 때마다 저장해요.",
    "sub": [
     "데이터 분석: 응답 마감 → 보기별 개수와 비율 → 그래프 → 결과 문장 한 줄",
     "미니 웹앱: 규칙을 함수로 묶기 → 잘못된 입력 막기 → 여러 값으로 테스트",
     "AI 윤리·보안: 친구 결과 모으기 → 가장 많이 틀린 문제 찾기 → 해설 다듬기"
    ]
   },
   {
    "t": "5주차 코드 제출: 완성작으로 내기",
    "d": "내 분야 예시 코드를 참고해서 최종 코드를 저장하고, 프로젝트 화면의 [★ 완성작으로 내기]를 눌러요. 친구들에게는 완성작만 보여요. 더 고치면 다시 눌러서 바꿀 수 있어요. 4주차 코드에 이어서 하려면 [↻ 지난 코드 불러오기]로 시작해요.",
    "act": "code"
   },
   {
    "t": "선생님이 만든 웹앱 확인",
    "d": "웹앱 첫 버전을 직접 써 보고, 고칠 점 2가지를 정리해서 멘토에게 알려요."
   },
   {
    "t": "발표 순서 정리",
    "d": "3분 시연 순서를 적어 와요: 문제 → 내가 직접 쓴 코드 → 결과(웹앱) → 배운 점."
   }
  ],
  "examples": [
   {
    "id": "w5-data",
    "field": "data",
    "title": "막대그래프와 결과 문장",
    "desc": "보기별 개수를 많은 순으로 세고, 글자 막대그래프와 결과 문장을 만들어요. matplotlib 예시도 들어 있어요.",
    "code": "# 할 일\n#  1) answers 를 마감한 내 설문의 진짜 응답으로 바꿔요\n#  2) ▶ 실행해서 막대그래프와 결과 문장을 확인해요\n#  3) 결과 문장을 내가 발표 때 말할 한 문장으로 고쳐요\n\nanswers = [\"학원\", \"집\", \"학원\", \"독서실\", \"학원\", \"집\", \"도서관\", \"학원\", \"집\", \"독서실\", \"학원\", \"집\"]\n\n# [무엇을] 보기마다 몇 명인지 세요  [입력] 응답 리스트  [출력] {보기: 명수} (많은 순)\ndef count_answers(answers):\n    counts = {}\n    for a in answers:\n        counts[a] = counts.get(a, 0) + 1\n    return dict(sorted(counts.items(), key=lambda kv: kv[1], reverse=True))\n\ncounts = count_answers(answers)\ntotal = len(answers)\n\nprint(f\"응답 {total}명 · 보기별 막대그래프\")\nfor option, n in counts.items():\n    bar = \"█\" * n                                 # 한 명에 한 칸\n    print(f\"{option:<4} {bar} {n}명 ({n * 100 // total}%)\")\n\ntop = next(iter(counts))\nprint()\nprint(f\"결과: 우리 반에서 가장 많은 답은 '{top}'({counts[top]}명)이에요.\")\n\n# 도전: matplotlib 으로 진짜 그래프 그리기 (그래프 글자는 영어로 써요)\n# import matplotlib.pyplot as plt\n# plt.bar([\"academy\", \"home\", \"reading room\", \"library\"], [5, 4, 2, 1])\n# plt.title(\"Where do we study?\")\n# plt.show()\n"
   },
   {
    "id": "w5-csv",
    "field": "data",
    "title": "CSV로 그래프와 결과 문장",
    "desc": "급식 별점 CSV로 메뉴별 평균을 구해 글자 막대그래프와 진짜 그래프(matplotlib)를 그리고 결과 문장을 써요.",
    "files": [
     "lunch_rating.csv"
    ],
    "code": "# 할 일\n#  1) 파일 이름과 열 이름(\"메뉴\", \"별점\")을 내 설문에 맞게 바꿔요\n#  2) ▶ 실행해서 글자 막대그래프와 진짜 그래프를 확인해요\n#  3) 마지막 결과 문장을 발표 때 말할 한 문장으로 고쳐요\n# 쓰는 파일: lunch_rating.csv\n\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\ndf = pd.read_csv(\"lunch_rating.csv\")\nprint(\"별점 수:\", len(df), \"개\")\n\n# 메뉴별 평균 별점 (높은 순)\navg = df.groupby(\"메뉴\")[\"별점\"].mean().sort_values(ascending=False)\n\nprint()\nprint(\"[메뉴별 평균 별점]\")\nfor menu, star in avg.items():\n    bar = \"★\" * round(star)                   # 반올림한 별 개수만큼\n    print(f\"{menu} {bar} {star:.1f}점\")\n\n# 진짜 그래프: 그래프 안 글자는 영어로 써요 (한글 글꼴이 없어서 네모로 나와요)\nnames = {\"돈가스\": \"Pork cutlet\", \"카레라이스\": \"Curry\", \"짜장면\": \"Jajangmyeon\",\n         \"비빔밥\": \"Bibimbap\", \"떡볶이\": \"Tteokbokki\", \"김치찌개\": \"Kimchi stew\"}\nlabels = [names.get(m, m) for m in avg.index]\n\nplt.figure(figsize=(7, 4))\nplt.bar(labels, avg.values, color=\"#1d6ff2\")\nplt.ylim(0, 5)\nplt.title(\"Average rating by lunch menu\")\nplt.ylabel(\"stars (1-5)\")\nplt.xticks(rotation=20)\nplt.tight_layout()\nplt.show()\n\ntop, low = avg.index[0], avg.index[-1]\nprint()\nprint(f\"결과: 우리 반이 가장 좋아한 메뉴는 '{top}'({avg.iloc[0]:.1f}점), 가장 아쉬운 메뉴는 '{low}'({avg.iloc[-1]:.1f}점)이에요.\")\n\n# 도전: \"남긴 양\"이 \"많이\"인 응답이 가장 많은 메뉴를 찾아보세요.\n#       힌트) df[df[\"남긴 양\"] == \"많이\"][\"메뉴\"].value_counts()\n"
   },
   {
    "id": "w5-web",
    "field": "web",
    "title": "반복 메뉴와 입력 검사",
    "desc": "숫자가 아닌 값을 넣어도 멈추지 않게 하고, q 를 넣을 때까지 계속 추천해요.",
    "code": "# 할 일\n#  1) RULES 와 recommend 를 지난주에 만든 내 규칙으로 바꿔요\n#  2) ask_number 덕분에 숫자가 아닌 값을 넣어도 멈추지 않아요. 직접 \"abc\"를 넣어 확인해요\n#  3) q 를 넣으면 끝나요. 여러 값을 연달아 넣어 보며 테스트해요\n\nRULES = [(28, \"반팔\"), (20, \"긴팔\"), (12, \"자켓\")]\nDEFAULT = \"패딩\"\n\n# [무엇을] 기온에 맞는 옷  [입력] 기온  [출력] 옷 이름\ndef recommend(temp):\n    for limit, clothes in RULES:\n        if temp >= limit:\n            return clothes\n    return DEFAULT\n\n# [무엇을] 숫자를 제대로 받을 때까지 다시 물어봐요  [입력] 질문 글  [출력] 숫자 또는 None(끝내기)\ndef ask_number(message):\n    while True:\n        text = input(message).strip()\n        if text.lower() == \"q\":\n            return None\n        if text.lstrip(\"-\").isdigit():\n            return int(text)\n        print(\"  숫자로 입력해 주세요! (끝내려면 q)\")\n\nprint(\"기온별 옷차림 추천기 · 끝내려면 q\")\nwhile True:\n    temp = ask_number(\"기온: \")\n    if temp is None:\n        print(\"이용해 줘서 고마워요!\")\n        break\n    print(f\"  → {temp}도에는 {recommend(temp)}\")\n"
   },
   {
    "id": "w5-sec",
    "field": "sec",
    "title": "가장 많이 틀린 문제 찾기",
    "desc": "친구들의 퀴즈 결과로 문제별 오답 수를 세고, 캠페인에서 강조할 문제를 찾아요.",
    "code": "# 할 일\n#  1) questions 를 내 퀴즈 문제(짧은 이름)로 바꿔요\n#  2) results 에 친구들이 푼 결과를 적어요 (맞으면 True, 틀리면 False)\n#  3) ▶ 실행해서 가장 많이 틀린 문제를 찾고, 캠페인에서 무엇을 강조할지 정해요\n\nquestions = [\"같은 비밀번호\", \"2단계 인증\", \"공용 PC 로그아웃\"]\nresults = [            # 친구 한 명 = 한 줄\n    [True, True, False],\n    [False, True, False],\n    [True, True, True],\n    [False, True, False],\n]\n\nwrong = [0] * len(questions)\nfor one in results:\n    for i, ok in enumerate(one):\n        if not ok:\n            wrong[i] += 1\n\nprint(f\"친구 {len(results)}명의 결과\")\nfor q, w in zip(questions, wrong):\n    print(f\"  {q}: {w}명 틀림 \" + \"✗\" * w)\n\nmost = questions[wrong.index(max(wrong))]\nprint(f\"가장 많이 틀린 문제 → '{most}' · 캠페인에서 이걸 강조해요!\")\n"
   }
  ]
 },
 {
  "no": 6,
  "title": "발표회",
  "sheet": "",
  "goal": "내가 만든 결과를 보여 주고, 만들면서 배운 점을 나눠요.",
  "todo": [
   {
    "t": "발표 전 점검",
    "d": "완성작을 한 번 더 실행해 봐요. 아직 완성작을 안 냈다면 프로젝트 화면에서 [★ 완성작으로 내기]를 눌러요."
   },
   {
    "t": "3분 시연",
    "d": "주제와 대상 → 내가 직접 쓴 코드의 핵심 부분 설명 → 웹앱으로 시연."
   },
   {
    "t": "2분 이야기",
    "d": "만들면서 막혔던 점과 어떻게 해결했는지, AI에게 물어볼 때 어떻게 질문했는지 이야기해요."
   },
   {
    "t": "친구 프로젝트 둘러보기",
    "d": "친구 발표를 듣고, 첫 화면의 \"친구들 완성작\"에서 친구 프로젝트 하나를 열어 실행해 본 뒤 한 줄 소감을 말해요."
   },
   {
    "t": "6주차 코드 제출: 회고 카드",
    "d": "예시 코드로 내 프로젝트 소개와 배운 점을 정리해서 저장해요. 발표 첫 화면으로 써도 좋아요.",
    "act": "code"
   },
   {
    "t": "내 결과물 내려받기",
    "d": "이 화면의 [⬇ 내 결과물 내려받기]를 눌러 완성작 코드(.py)와 웹앱(.html), 주차별 코드, 활동지를 zip 하나로 받아 보관해요."
   }
  ],
  "examples": [
   {
    "id": "w6",
    "field": "all",
    "title": "프로젝트 소개·회고 카드",
    "desc": "딕셔너리와 리스트, 함수로 내 프로젝트와 배운 점을 상자 모양으로 보여 줘요.",
    "code": "# 할 일\n#  1) project 와 learned 를 내 이야기로 바꿔요\n#  2) ▶ 실행한 화면을 발표 첫 화면으로 보여 줘도 좋아요\n#  3) [저장]할 때 메모에 \"발표용\"이라고 적어요\n\nproject = {\n    \"제목\": \"기온별 옷차림 추천기\",\n    \"분야\": \"미니 웹앱\",\n    \"누구를 위해\": \"아침마다 옷 고르기 힘든 친구들\",\n    \"직접 짠 코드\": \"RULES 규칙 표와 recommend 함수\",\n    \"웹앱\": \"선생님이 AI로 만든 화면에 내 규칙을 넣음\",\n}\n\nlearned = [\n    \"if 문은 위에서부터 검사해서, 기준이 높은 것부터 적어야 한다\",\n    \"테스트(assert)로 경계값을 확인하면 실수를 빨리 찾는다\",\n    \"AI에게 물어볼 때는 내가 원하는 것을 구체적으로 적어야 한다\",\n]\n\n# [무엇을] 제목과 내용을 상자 모양으로 보여 줘요  [입력] 제목, 줄 목록  [출력] 없음(화면에 출력)\ndef show_box(title, lines):\n    print(\"┌─ \" + title)\n    for line in lines:\n        print(\"│ \" + line)\n    print(\"└\" + \"─\" * 20)\n\nshow_box(\"내 프로젝트\", [f\"{k}: {v}\" for k, v in project.items()])\nshow_box(\"만들면서 배운 점\", [f\"{i}. {t}\" for i, t in enumerate(learned, start=1)])\nprint(\"들어 줘서 고마워요! 🙌\")\n"
   }
  ]
 }
];

// 예시 CSV 파일 (csv 폴더에 있어요). 코드에서 pd.read_csv("이름.csv") 로 읽어요.
// 새 파일을 넣으려면 csv 폴더에 파일을 올리고 여기에 한 줄 추가해요.
window.PYSHARE_CSV = [
  { name: 'study_survey.csv', title: '공부 습관 설문 (24명)', desc: '구글폼 응답을 CSV로 내려받은 모양이에요. 공부 장소, 공부·수면·휴대폰 시간, 아침 식사를 물었어요.' },
  { name: 'lunch_rating.csv', title: '급식 메뉴 별점 (37개)', desc: '날짜, 요일, 메뉴, 별점(1~5), 남긴 양을 적은 표예요.' },
];
