# Sanad Tokens — مرجع سريع (Provisional: System C)

## القاعدة الذهبية
غيّر الهوية من `src/app/globals.css` فقط. ممنوع `bg-[#...]` أو `text-[#...]` في أي ملف آخر — استخدم الأسماء أدناه.

## shadcn (موجودة ومربوطة بهوية Sanad)
`background` Canvas — `foreground` النص — `card` سطح 1 — `popover` مرتفع —
`primary` الأساسي — `secondary` الثانوي — `muted` سطح 2 + نص باهت —
`accent` سطح 3 (لحالات المكونات فقط، ليس ذهبي الهوية) —
`destructive` للخطأ (+ `destructive-muted` لخلفيات التنبيه) —
`border` `input` `ring` (لون التركيز = الأساسي).

## Sanad المخصصة (لا يغطيها shadcn)
`brand-primary` (+ `hover`/`pressed`) — `brand-secondary` — `brand-accent` (+ نصه حبر داكن، للمسات فقط) —
`surface-1/2/3/elevated/overlay` (تدرج الهرم) —
`success/success-foreground/success-muted` — `warning/...` — `info/...` (الحالة ≠ لون الهوية أبدًا).

## الأسطح والارتفاع
الهرم: Canvas ← 1 ← 2 ← 3 ← مرتفع ← طبقة علوية. لا تعطِ كل حاوية سطحًا مختلفًا.
الارتفاع `shadow-elevation-0..4` (ظل فقط). في الداكن: التباين والحدود أهم من الظل.

## الخط والحجم
عربي Tajawal (بلا تباعد)، لاتيني/أرقام Inter. الأوزان 400/500/700/800 محملة؛ 600 للعربية يسقط على 700 (لا وزن 600 في Tajawal).
الأحجام: `text-display-lg` 36 — `text-heading-xl` 30 — `text-heading-lg` 24 — `text-heading-md` 20 — `text-heading-sm` 18 — `text-body-lg` 16 — `text-body-md` 14 — `text-body-sm` 13 — `text-caption` 12. أرقام KPI: Inter عريض 30–36.

## نصف القطر والمسافات والحاوية
الأساس 12px (كروت) عبر نفس مضاعفات shadcn. المسافات من Tailwind كما هي (4/6/8…64). الحاوية `.page-container` (حشوة 16/24/32 حسب الشاشة).

## وصول
تباين واضح، تركيز مرئي (ring)، تنقل لوحة مفاتيح، الحالة لا تعتمد على اللون وحده، دعم تقليل الحركة مدمج، أهداف لمس ≥ 44px في الشاشات الجديدة.
