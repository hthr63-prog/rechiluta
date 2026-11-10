import random, datetime as dt
random.seed(11)
ppl = ['שירן','בני','גיא','הדר','עידו','ליה','אורי','Sam']
fem = {'שירן','ליה','הדר'}
out=[]
def add(t,w,x): out.append((t,w,x))
st = dt.datetime(2021,5,1,20,0)
add(st,'שירן','‎הקבוצה נוצרה על ידי שירן'); add(st+dt.timedelta(seconds=30),'בני','‎צורפת')
lines = ['מה המצב אנשים','מישהו פנוי היום?','אני בפנים','לא יכול היום','מי מביא בירות','אני בדרך','איפה אתם','עוד 10 דקות','סגור','מתי נפגשים','ראיתם את המשחק?','איזה מטורף','מה קורה עם השישי','מי בא לים מחר','אני על זה','אחי תענה','חחח','חחחחחחח','די','מה הלו״ז','סבבה','בא לי שווארמה','מי מארגן','אני לא מאמין','וואי','יאללה','שמעתם על מה שקרה?','אני גמור מהעבודה','אחלה','מישהו ער?']
fem_lines = ['אני גמורה מהעבודה','אני בדרך, כמעט שם','אני עייפה','אני לא מאמינה','אני יודעת']
funny = ['קניתי מזגן ועכשיו אני חי בתוך המזגן','אמא שלי שאלה אם אני יוצא עם מישהי. אמרתי לה שאני יוצא עם הספה','הבוס אמר לי לחשוב מחוץ לקופסה. הלכתי הביתה','ניסיתי לעשות דיאטה. הדיאטה ניצחה','השכן שלי מנגן בתופים בשלוש בלילה, התחלתי לרקוד']
day=0
while day<900:
    d = st.replace(hour=0,minute=0)+dt.timedelta(days=day)
    month = d.month; summer = (d.year==2022 and month==8)
    n = random.randint(0,6) + (25 if summer else 0)
    t = d+dt.timedelta(hours=random.randint(8,12))
    for _ in range(n):
        t += dt.timedelta(minutes=random.randint(1,40))
        if t.day!=d.day: break
        w = random.choices(ppl, weights=[14,12,12,10,12,10,1,9])[0]
        x = random.choice(fem_lines if w in fem and random.random()<.25 else lines)
        if summer and random.random()<.5: x = random.choice(['מי לוקח את הצימר?','הקריוקי של אתמול היה היסטורי','אני לא שר יותר בקריוקי','הצימר בגליל מושלם','מי ישן בצימר הקטן','צריך לסגור את הצימר עד מחר','הבריכה בצימר קפואה'])
        if random.random()<.08: x = random.choice(['צ׳יקו, '+x, x+' צ׳יקו?','פופי, '+x,'שוקי? '+x])
        add(t,w,x)
        # duo: גיא and בני answer each other a lot
        if w in ('גיא','בני') and random.random()<.6: t+=dt.timedelta(minutes=1); add(t, 'בני' if w=='גיא' else 'גיא', random.choice(lines))
    if random.random()<.08:
        t += dt.timedelta(minutes=3); add(t,'עידו',random.choice(funny)); t+=dt.timedelta(minutes=1); add(t,'שירן','חחחחחחחחחחחח'); t+=dt.timedelta(minutes=1); add(t,'ליה','מתתי חחחחח')
    if day>60 and random.random()<.03: t+=dt.timedelta(minutes=5); add(t, random.choice(ppl[:6]), random.choice(['מים עם לימון','שוב מים עם לימון','מישהו הזמין מים עם לימון?']))
    if day==61: t=d+dt.timedelta(hours=21); add(t,'עידו','הזמנתי בבר מים עם לימון והברמן הסתכל עליי כאילו רצחתי מישהו'); add(t+dt.timedelta(minutes=1),'שירן','חחחחחחחחחחחחחחחחח מים עם לימון'); add(t+dt.timedelta(minutes=2),'בני','מים עם לימון זה הכינוי שלך מעכשיו')
    if day==400:
        t=d+dt.timedelta(hours=15,minutes=2); add(t,'ליה','אני מתחתנת!!! 💍')
        for k in range(40): t+=dt.timedelta(seconds=random.randint(10,40)); add(t, random.choice(ppl[:6]+['Sam']), random.choice(['מזל טוב!!!!','וואווו','אני בוכה','איזה כיף!!!','😍😍😍','מגיע לך הכי טוב בעולם','מתי החתונה?','אמרתי לכם!!!']))
    if day==520:
        t=d+dt.timedelta(hours=20); add(t,'בני','חבר׳ה, אבא שלי בבית חולים מאתמול. קשה לי מאוד')
        add(t+dt.timedelta(minutes=1),'שירן','אני פה בשבילך ❤️ מה צריך?'); add(t+dt.timedelta(minutes=2),'גיא','אחי אני מגיע אליך עכשיו'); add(t+dt.timedelta(minutes=3),'ליה','רפואה שלמה לאבא 🙏'); add(t+dt.timedelta(minutes=5),'עידו','אנחנו איתך, תחזיק חזק')
    if day==700:
        t=d+dt.timedelta(hours=21); add(t,'Sam','רציתי להגיד תודה לכולם על השנה הזאת. בזכותכם עברתי אותה'); add(t+dt.timedelta(minutes=2),'שירן','❤️❤️ תמיד'); add(t+dt.timedelta(minutes=3),'עידו','אוהבים אותך אחי')
    if day==620:
        t=d+dt.timedelta(hours=18); add(t,'שירן','עברנו דירה!!! הבית החדש שלנו 🏠'); add(t+dt.timedelta(minutes=1),'ליה','מזל טוב!!!'); add(t+dt.timedelta(minutes=2),'בני','איזה כיף!! מתי חנוכת בית?')
    if day==420: t=d+dt.timedelta(hours=22); add(t,'אורי','חבר׳ה אני רק רוצה להגיד שאני קורא הכל, גם אם אני לא כותב. אתם האנשים הכי טובים שיש לי')
    if day==300: t=d+dt.timedelta(hours=12); add(t,'ליה','‎הווידאו לא נכלל'); add(t,'בני','‎הערת הווידאו לא נכללה'); add(t,'Sam','‎מחקת את ההודעה'); add(t,'עידו','‎שיחה שלא נענתה'); add(t,'שירן','‎שירן הוסיף/ה את רותם')
    day+=1
out.sort()
import sys
with open(sys.argv[1],'w',encoding='utf-8') as f:
    for t,w,x in out: f.write(f"[{t.strftime('%d/%m/%Y, %H:%M:%S')}] {w}: {x}\n")
print(len(out))
