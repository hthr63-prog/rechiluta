# ייצוא מטלפון שמוגדר באנגלית: תאריך אמריקאי (חודש/יום/שנה), שעון 12 שעות, הודעות מערכת באנגלית. שמות מומצאים.
import random, datetime as dt, sys
random.seed(5)
style = sys.argv[2] if len(sys.argv) > 2 else 'ios'
ppl = ['Maya', 'Ben', 'Noa', 'Tom']
lines = ['who is coming tonight?', 'on my way', 'lol', 'haha that is amazing', 'I am so tired', 'see you there', 'what time?', 'pizza?', 'yes!!', 'did you see the game', 'call me later', 'running late sorry']
out = []
t = dt.datetime(2024, 1, 3, 20, 15)
def add(when, who, text): out.append((when, who, text))
add(t, '', 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.')
add(t, 'Maya', '‎Maya created group "Weekend crew"')
add(t, 'Maya', '‎Maya added Ben')
for day in range(0, 200):
    d = dt.datetime(2024, 1, 3) + dt.timedelta(days=day)
    special = day in (40, 90)
    if random.random() < .45 and not special: continue
    t = d + dt.timedelta(hours=random.choice([9, 13, 18, 21, 23]), minutes=random.randint(0, 50))
    for _ in range(random.randint(3, 9)):
        t += dt.timedelta(minutes=random.randint(1, 15))
        w = random.choice(ppl); x = random.choice(lines)
        r = random.random()
        if r < .04: x = '‎image omitted' if style == 'ios' else '<Media omitted>'
        elif r < .06: x = 'This message was deleted'
        elif r < .07: x = '‎Missed voice call'
        add(t, w, x)
    if day == 40:
        t = d + dt.timedelta(hours=22); add(t, 'Ben', 'I got the job!!! 🎉'); add(t + dt.timedelta(minutes=1), 'Noa', 'congrats!!! so proud of you'); add(t + dt.timedelta(minutes=2), 'Maya', 'YESSS ❤️')
    if day == 90:
        t = d + dt.timedelta(hours=13); add(t, 'Tom', '‎Tom left')
out.sort(key=lambda x: x[0])
for when, who, text in out:
    if style == 'ios':
        h = when.strftime('%I').lstrip('0'); ampm = when.strftime('%p')
        ts = f"[{when.month}/{when.day}/{when.strftime('%y')}, {h}:{when.strftime('%M:%S')} {ampm}]"
        print(f"{ts} {who + ': ' if who else ''}{text}" if who else f"{ts} Weekend crew: {text}")
    else:
        h = when.strftime('%I').lstrip('0'); ampm = when.strftime('%p')
        ts = f"{when.month}/{when.day}/{when.strftime('%y')}, {h}:{when.strftime('%M')} {ampm}"
        print(f"{ts} - {who}: {text}" if who else f"{ts} - {text}")
