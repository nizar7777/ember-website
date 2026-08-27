# Ember — reusable ad template

One campaign skeleton. Swap the theme block for anime / gym / streetwear and
everything else stays put.

Status: **draft**. Meta writes are still blocked on the account (error 31,
subcode 3858385). Nothing here has been applied.

---

## 1. Who Ember actually is — from your own site

Not invented. This is lifted from the copy on the homepage:

> "Ember is the quiet fire inside the youth. A symbol of creativity, rebellion,
> and identity. Inspired by Arab heritage and the streets of Amman, Ember exists
> for artists, outsiders, and dreamers. We reject bland fashion and cultural
> emptiness."

Three things that matter for ads:

- **Heritage + street, together.** Not a Western streetwear copy, not a
  traditional brand. The tension between the two *is* the brand.
- **Outsiders, not status.** "Artists, outsiders, dreamers" — an identity buy,
  not a status buy. This matters below when we get to luxury targeting.
- **The customer is in the process.** Your own promise: "including the customer
  in the creative process." The custom-design tool is a brand statement.

**The register your customers actually use.** Your testimonials are Jordanian
dialect, not formal Arabic:

> "والله انو عجبني كثير وللامانه خامة القماش كثير حلوة عنجد اشي مرتب"

Your happiest customers write in عامية. Your current ad is in English.

---

## 2. What your own history says works

Read off your 45 campaigns. This is stronger evidence than anything I could tell
you about the Jordanian market in general, because it is your market.

Three themes recur across your best campaigns:

| Theme | Evidence in your account |
| --- | --- |
| **Anime** | sasageyo, Sukuna shirt, هجوم العمالقة, دروب الانمي, الك عالانمي |
| **Gym** | Gym Rat Oriented, تيشيرتات جيماوية, ادخل الجيم بقوة |
| **Heritage / national** | عيد الاستقلال, ادام الله عز الوطن, God King Homeland, Back to tradition |

Anime and gym are two of the three variants you asked for. You found them
yourself; this template just makes them repeatable.

**Heritage is your fourth variant** and it is the most on-brand of all of them —
it is literally the "Arab heritage + streets of Amman" line from your About
section. Independence Day (25 May) already worked for you twice.

---

## 3. On targeting affluent neighbourhoods

You asked for the highest-purchasing areas. Two answers, and the second is much
better than the first.

### The general answer (treat as background, not data)

West Amman skews affluent: **Abdoun, Deir Ghbar, Dabouq, Um Uthaina, Khalda,
Sweifieh, Al Rabieh, Tla' Al Ali, Shmeisani, Jabal Amman (1st–3rd Circle),
Abdali.** East Amman and the outer governorates skew lower income.

This is widely-known city geography, **not verified market research**, and I have
no Jordan-specific purchasing data to back it. Do not build a budget on it alone.

### The better answer — you already own the data

Every order that comes through checkout emails you a **delivery address**. Those
emails are sitting in your Gmail right now. Counting them tells you exactly which
neighbourhoods buy Ember — real customers, real money, your brand specifically.

Sort 30–50 past orders by area and you will have something no targeting guess can
match. Send me that tally and I will build the geo targeting from it.

### The honest warning

Your current broad setup is producing conversations at **$0.44**. Narrowing to
eight small radii around wealthy districts will:

- raise CPM (smaller, more contested audiences)
- slow learning (less data per day at $6/day)
- **probably raise your cost per conversation, not lower it**

If you want to test it, run it as a **second ad set**, not as a replacement.
Never replace the thing that is working with the thing you hope will work.

---

## 4. On "high-end" interests

Blunt version: **your price point is not luxury.** Tees at 18 JOD, hoodies at 32
JOD. The person shopping Gucci and Balenciaga is not your buyer, and targeting
those interests mostly buys expensive impressions from people who will not order.

It also contradicts your own brand. "Artists, outsiders and dreamers" who "reject
bland fashion" is an anti-status position. Chasing luxury-brand audiences puts
your ads in front of exactly the status buyers your About page rejects.

**Tier 1 — matches your price and your brand (use these)**
Nike · Adidas · Puma · Vans · Converse · New Balance · Streetwear

**Tier 2 — theme, swapped per variant**
Anime: Anime · Manga · Attack on Titan · Jujutsu Kaisen · Naruto · One Piece
Gym: Gym · Bodybuilding · Physical fitness · Physical exercise
Streetwear: Streetwear · Hip hop fashion · Sneaker collecting

**Tier 3 — skip**
Gucci, Off-White, Balenciaga, Supreme. Wrong price, wrong posture.

**A better affluence proxy than luxury interests:** device targeting. iOS users in
Jordan skew higher income, and it is a single clean filter rather than a stack of
guesses. Cheaper to test, easier to read.

---

## 5. The template

Everything below is constant except the block marked **SWAP**.

### Campaign
- Objective: **Engagement**
- Conversion location: **Messaging apps → Instagram Direct**
- Name: `Ember | IG DM | <THEME> | <month>`

### Ad set
- Name: `Amman +30km | 18-34 | <THEME>`
- Performance goal: Maximise conversations
- Budget: daily, whatever the test is worth. Do not stack interests below ~$6/day.
- Geo: Amman +30km (default) — swap to the affluent pin-drops only as a test ad set
- Age 18–34, all genders, no language restriction
- Detailed targeting: **empty** at low budget. Add Tier 1 + Tier 2 only above ~$15/day.

### Ad
- Format: **carousel** (what you are running now, and it works)
- CTA: **Send Message**
- Destination: Instagram Direct

### Copy — Arabic first

Your audience is Jordanian and your reviews are in dialect. Arabic leads, English
follows for the bilingual half of West Amman.

**Constant brand block** (goes under every theme hook):

```
إمبر — الجمرة الهادية اللي جوّا كل شاب.
من شوارع عمّان، لكل واحد بيرسم طريقه لحاله 🔥

بعتلنا رسالة وخبّرنا مقاسك.
التوصيل لكل عمّان، والدفع عند الاستلام.
```

**SWAP — theme hook, first line only:**

| Variant | Arabic hook | English line |
| --- | --- | --- |
| **Anime** | `دروب الأنمي رجع 🔥 من هجوم العمالقة لجوجوتسو كايسن — كميات محدودة` | The anime drop is back — limited pieces |
| **Gym** | `تيشيرتات جيم خامة تقيلة 💪 قصّة مضبوطة وبتتحمّل كل تمرين` | Gym tees built to survive the session |
| **Streetwear** | `ستريتوير من عمّان، مش تقليد لحدا 🔥 تصاميم بتحكي عنك` | Streetwear from Amman. Not a copy of anyone. |
| **Heritage** | `تراثنا بستايل الشارع 🔥 تشكيلة محدودة` | Heritage meets the street — limited pieces |

**Headline:** `<THEME> — متوفر للطلب الآن`

Register note: your existing Arabic creative says "تيشيرت مع اكسسوار يكمل
الاوتفت" — casual, borrowed English words, no formal Arabic. The copy above
matches that. Do not let anyone "correct" it into فصحى; it would sound like a
bank advert.

---

## 6. What I would change on the live ad

Ranked. Only the first is clearly worth doing.

1. **Add an Arabic-copy carousel** alongside the current English one, same ad set.
   Your customers speak dialect and your ad does not. This is the one real gap
   between the brand on your site and the ad running now.
2. **Leave everything else alone.** $0.44 per conversation is the best number in
   your account's recent history. Budget, schedule, audience and format are all
   fine.
3. **Later, above ~$15/day:** a second ad set on affluent geo or Tier 1+2
   interests, as a test, never as a replacement.

### What I explicitly do not recommend

- Luxury-brand interest targeting — wrong price point, wrong brand posture
- Replacing broad targeting with stacked neighbourhoods at current budget
- Rewriting the copy into formal Arabic
- Any budget or schedule change while cost per conversation is still falling
