# Sanad Tokens — مرجع سريع (Provisional: System C)

## القاعدة الذهبية
غيّر الهوية من `src/app/globals.css` فقط. ممنوع `bg-[#...]` أو `text-[#...]` في أي ملف آخر — استخدم الأسماء أدناه.

## shadcn (موجودة ومربوطة بهوية Sanad)
`background` Canvas — `foreground` النص — `card` سطح 1 — `popover` مرتفع —
`primary` الأساسي — `secondary` الثانوي — `muted` سطح 2 + نص باهت —
`accent` سطح hover محايد (`#EDF1F2` / `#1C3139` — للقوائم والـ Select وGhost) —
`destructive` للخطأ (+ `destructive-muted` لخلفيات التنبيه + `destructive-muted-foreground` للنص فوقها) —
`border` (`#D5DDE0` / `#27404A`) — `border-subtle` للفواصل الهادئة —
`input` حد واضح قوي (`#7F939C` / `#5C7782`) — `ring` (لون التركيز) —
`text-tertiary` للنص الثالث و`text-disabled` للمعطّل.

## Sanad المخصصة (لا يغطيها shadcn)
`brand-primary` (+ `hover`/`pressed`) — `brand-secondary` — `brand-accent` (+ نصه حبر داكن، للمسات فقط) —
`surface-1/2/3/elevated/overlay` (تدرج الهرم) —
`success/success-foreground/success-muted/success-muted-foreground` — `warning/...` — `info/...` (الحالة ≠ لون الهوية أبدًا — أربع خانات لكل حالة: مصمت / نص فوقه / خلفية هادئة / نص فوقها).

## الأسطح والارتفاع
الهرم: Canvas ← 1 ← 2 ← 3 ← مرتفع ← طبقة علوية (تساوي المرتفع؛ الـ scrim خلف الـ modal طبقة مستقلة تُعرَّف عند الحاجة). لا تعطِ كل حاوية سطحًا مختلفًا.
الارتفاع `shadow-elevation-0..4` (ظل فقط، والتمييز = سطح + حد + ظل). في الداكن: التباين والحدود أهم من الظل.

## الخط والحجم
عربي Tajawal (بلا تباعد)، لاتيني/أرقام Inter. الأوزان 400/500/700/800 محملة؛ 600 للعربية يسقط على 700 (لا وزن 600 في Tajawal).
الأحجام: `text-display-lg` 36 — `text-heading-xl` 30 — `text-heading-lg` 24 — `text-heading-md` 20 — `text-heading-sm` 18 — `text-body-lg` 16 — `text-body-md` 14 — `text-body-sm` 13 — `text-caption` 12. الأوزان: الكبيرة 700، و`heading-md/sm` وزن 500، ولا 600 أبدًا. أرقام البيانات: `font-data` (Inter + tabular-nums).

## نصف القطر والمسافات والحاوية
صريح: sm ‏6 / md ‏8 / lg ‏12 / xl ‏16 / full ‏999 (للشارات فقط بمعنى). ‏2xl+‎ بنفس مضاعفات shadcn كما هي وستُراجع مع المكونات. المسافات من Tailwind كما هي (4/6/8…64). الحاوية `.page-container` (حشوة 16/24/32 حسب الشاشة). أهداف اللمس مرجعية: ديسكتوب 36–40 حسب المكوّن، موبايل ≥ 44 (`--touch-target-min`).

## وصول
تباين واضح، تركيز مرئي (ring)، تنقل لوحة مفاتيح، الحالة لا تعتمد على اللون وحده، دعم تقليل الحركة مدمج، أهداف لمس ≥ 44px في الشاشات الجديدة.
