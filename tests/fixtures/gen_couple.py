import random, datetime as dt
random.seed(7)
Y, G = 'אלון', 'שני'
out = []
def add(t, who, text): out.append((t, who, text))
start = dt.datetime(2024,3,14,21,12)
# --- origin
t = start
for who, text, gap in [(Y,'היי, זה אלון מהחתונה של עדי 🙂',0),(G,'חחח היי! כבר חשבתי שלא תכתוב',3),(Y,'הייתי צריך שלושה ימים של אומץ',2),(G,'ושווה היה?',1),(Y,'עוד לא יודע. תלוי מה תעני לי עכשיו',4),(G,'נראה לי ששווה 😊',2)]:
    t += dt.timedelta(minutes=gap); add(t, who, text)
day_pool_G = ['מה אתה עושה?','אני בעבודה, משוגע פה','קנית חלב?','מתי אתה מגיע?','אני מכינה שקשוקה','שכחת שוב את הכביסה','דיברתי עם אמא שלך','נו באמת','אני גמורה','מה בא לך לאכול?','ראית את ההודעה של נועה?','אני מתה עליך','חח','אוקי','לא מאמינה','איזה יום ארוך','אני בדרך הביתה','יש לנו מחר את הארוחה אצל ההורים','נו באמת אלון','אתה רציני?','חחחחח','אוהבת','סבבה']
day_pool_Y = ['בדרך בדרך','אני עייף מת','סבבה','כן','קניתי','עוד חצי שעה','מה אמרה?','אחלה','בא לי פיצה','אני בפקק','תכף','אוהב אותך','לא יודע','את צודקת','טוב','חח','פקק מטורף באיילון','מה נסגר עם השבת?','יאללה']
funny_Y = ['אני חושב שהחתול של השכנים מתחיל לזהות אותי ומתאכזב כל פעם מחדש','הבוס שלי שלח מייל עם "בברכה" ואני מרגיש מאוים','עשיתי היום כושר. כלומר חשבתי על כושר חזק מאוד','הספה ואני במערכת יחסים רצינית, תכבדי את זה','אמא שלך שאלה אם אני אוכל מספיק. עניתי שאני אוכל רק מספיק','הזמנתי סלט. אני רוצה שתדעי שזה עלה לי בבריאות הנפשית']
laugh_G = ['חחחחחחחחחח','חחחחחחחחחחחחחחחח אני מתה','😂😂😂','חחחחחחח די','מתתי חחחחחח']
night_Y = ['את ערה? לא מצליח להירדם','חושב על כל מה שקרה היום','שמעתי עכשיו את השיר שלנו ברדיו של המונית','יש לי רעיון מטורף לחופשה']
day = 1
while day < 560:
    d = start.replace(hour=0, minute=0) + dt.timedelta(days=day)
    if 300 <= day < 309: day += 1; continue          # the silence (trip abroad, no messages)
    n = random.randint(2, 9)
    t = d + dt.timedelta(hours=random.randint(7,10), minutes=random.randint(0,59))
    if random.random() < .55: add(t, G, random.choice(['בוקר טוב ☀️','בוקר טוב מאמי','בוקר טוב'])); t += dt.timedelta(minutes=random.randint(20,70)); add(t, Y, random.choice(['בוקר','בוקר טוב','בוקר 😴']))
    for _ in range(n):
        t += dt.timedelta(minutes=random.randint(15,120))
        if t.hour >= 23: break
        if random.random() < .5:
            add(t, G, random.choice(day_pool_G)); t += dt.timedelta(minutes=random.randint(12,55)); add(t, Y, random.choice(day_pool_Y))
        else:
            add(t, Y, random.choice(day_pool_Y)); t += dt.timedelta(minutes=random.randint(0,3), seconds=random.randint(10,50)); add(t, G, random.choice(day_pool_G))
        if random.random() < .07: t += dt.timedelta(minutes=random.randint(1,4)); add(t, G, '<המדיה לא נכללה>')
    if random.random() < .12:
        t += dt.timedelta(minutes=5); add(t, Y, random.choice(funny_Y)); t += dt.timedelta(minutes=1); add(t, G, random.choice(laugh_G))
    if day > 20 and random.random() < .06:
        t += dt.timedelta(minutes=7); add(t, random.choice([Y,G]), random.choice(['פינגווין מבולבל','נו פינגווין','הפינגווין חזר מהעבודה','פינגווין מבולבל שלי ❤️']))
    if random.random() < .5:
        t2 = d + dt.timedelta(hours=23, minutes=random.randint(0,40)); add(t2, Y, random.choice(['לילה טוב ❤️','לילה טוב','לילה מאמי']))
    if random.random() < .05:
        t3 = d + dt.timedelta(days=1, hours=random.randint(1,3), minutes=random.randint(0,59)); add(t3, Y, random.choice(night_Y))
    # --- scripted events
    if day == 20:
        b = d + dt.timedelta(hours=20)
        for who, text, gap in [(Y,'אני במסעדה הזאת ולא מבין את התפריט, יש פה מילים שאני לא מכיר',0),(G,'אתה נשמע כמו פינגווין מבולבל',1),(Y,'חחחחחחחחחח פינגווין מבולבל זה הכינוי החדש שלי',1),(G,'חחחחחחחחחחחחחחחחחחחחחחח',0)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if day == 200:
        b = d + dt.timedelta(hours=19)
        for who, text, gap in [(G,'אני לא מאמינה ששכחת שוב',0),(G,'זה היה חשוב לי!! אמרתי לך שבוע מראש',1),(Y,'את צודקת. פישלתי',25),(G,'פישלת?? זה כל מה שיש לך להגיד?',1),(Y,'סליחה. באמת. אני מצטער שלא הייתי שם בשבילך, זה לא יקרה שוב',300),(G,'אני אוהבת אותך, טמבל ❤️',40),(Y,'אני יותר ❤️',2)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if day == 309:
        b = d + dt.timedelta(hours=6, minutes=40)
        for who, text, gap in [(G,'נחתתי!!! מתגעגעת אליך כל כך',0),(Y,'סוף סוף!!! אני כבר בדרך לנתב"ג',1),(G,'תביא את הפינגווין 🐧',1)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if day == 330:
        b = d + dt.timedelta(hours=0, minutes=1)
        for who, text, gap in [(Y,'יום הולדת שמח לאישה הכי מדהימה שאני מכיר. לפני שנה כתבתי לך אחרי שלושה ימים של אומץ, והיום אני לא מבין איך חייתי בלי זה. תודה שאת סובלת את הבדיחות שלי, את הפקקים, ואת הפינגווין המבולבל שאני. אני אוהב אותך יותר ממה שאני יודע לכתוב פה ❤️',0),(G,'אני בוכה 😭❤️',2),(G,'אתה הדבר הכי טוב שקרה לי',0),(G,'אוהבת אותך כל כך',1)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if random.random() < .025:
        t += dt.timedelta(minutes=9); add(t, random.choice([Y,G]), random.choice(['השיר שלנו 🎶 https://youtu.be/dQw4w9WgXcQ','תקשיבי לזה https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc123','https://www.youtube.com/watch?v=kJQP7kiw5Fk&t=30s','שיר לנסיעה https://open.spotify.com/intl-he/track/7qiZfU4dY1lWllzX7mPBI3']))
    if day == 40:
        b = d + dt.timedelta(hours=23, minutes=10)
        for who, text, gap in [(Y,'אני יודע שזה מוקדם, אבל אני חושב שאני אוהב אותך',0),(G,'...',3),(G,'גם אני אוהבת אותך ❤️ חיכיתי שתגיד את זה',1),(Y,'סוף סוף 😅❤️',1)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if day == 250:
        b = d + dt.timedelta(hours=7, minutes=30)
        for who, text, gap in [(G,'סבתא שלי נפטרה הלילה. אני לא מסוגלת לנשום',0),(Y,'אני בדרך אלייך. אני פה בשבילך ❤️',2),(Y,'אל תהיי לבד עכשיו, תכף אני שם',1),(G,'תודה. אני צריכה אותך',3)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if day == 470:
        b = d + dt.timedelta(hours=16)
        for who, text, gap in [(G,'התקבלתי!!!!! קיבלתי את העבודה!!! 🎉',0),(Y,'אמרתי לך!!!! אני כל כך גאה בך',1),(Y,'מזל טוב מלכה שלי 🥳',0),(G,'אני לא מאמינה שזה קורה',1)]:
            b += dt.timedelta(minutes=gap); add(b, who, text)
    if day == 420:   # moving day: busiest day
        b = d + dt.timedelta(hours=7)
        lines = ['המובילים הגיעו','איפה הארגז של המטבח?','כתבתי עליו מטבח!!','כתבת "מטבח?" עם סימן שאלה','למה יש ארגז שכתוב עליו "דברים"','המקרר לא נכנס במעלית','אני בוכה מצחוק והמובילים מסתכלים עליי','חחחחחח','איפה המפתחות','הם אצלך','לא','כן','מצאתי אותם בארגז "דברים"','חחחחחחחחחח הארגז הזה מכיל את כל התשובות','הזמנתי פיצה לדירה החדשה 🍕','הבית שלנו ❤️']
        for i in range(150):
            b += dt.timedelta(minutes=random.randint(1,5)); add(b, Y if i%2 else G, lines[i % len(lines)])
    day += 1
out.sort()
import sys
with open(sys.argv[1],'w',encoding='utf-8') as f:
    for t, who, text in out: f.write(f"{t.strftime('%d/%m/%Y, %H:%M')} - {who}: {text}\n")
print(len(out))
