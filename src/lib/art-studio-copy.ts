import type { Locale } from "@/lib/types";

/**
 * Default selling copy for the Art Studio product type pages. Used when the type has no
 * Markdown `content` yet in the admin. Keyed by product_type.internal_name.
 */

export type ArtStudioBenefit = { title: string; text: string };
export type ArtStudioFaqItem = { question: string; answer: string };
export type ArtStudioTypeCopy = {
  eyebrow: string;
  lead: string;
  benefits: ArtStudioBenefit[];
  faq: ArtStudioFaqItem[];
  cta: string;
};

const generic: Record<Locale, ArtStudioTypeCopy> = {
  bg: {
    eyebrow: "Art Studio Банско",
    lead: "Авторски продукти с дизайни от Банско и Пирин. Поръчваш през формата, потвърждаваме по телефон или имейл и получаваш в галерията или с Еконт.",
    benefits: [
      { title: "Авторски дизайни", text: "Рисунки и снимки от Пирин, направени от нас, не от каталог." },
      { title: "Малки серии", text: "Печатаме с внимание към материала и цвета, без масово производство." },
      { title: "Взимане или доставка", text: "От галерията в Банско или с Еконт до офис в цялата страна." }
    ],
    faq: [
      { question: "Как се поръчва?", answer: "Попълни формата с желаните опции и данни за контакт. Ще се свържем с теб, за да потвърдим цената, срока и начина на получаване. Плащане няма преди потвърждението." },
      { question: "Мога ли да поръчам със своя снимка или идея?", answer: "Да. Качи снимката във формата или я опиши в бележката. Ще предложим формат, материал и цена." },
      { question: "Колко време отнема?", answer: "Зависи от продукта и наличностите. Ще получиш точен срок при потвърждението на поръчката." }
    ],
    cta: "Изпрати поръчката"
  },
  en: {
    eyebrow: "Art Studio Bansko",
    lead: "Original products with designs from Bansko and Pirin. Order through the form, we confirm by phone or email, and you collect at the gallery or receive by Econt.",
    benefits: [
      { title: "Original designs", text: "Drawings and photographs from Pirin, made by us, not from a catalogue." },
      { title: "Small batches", text: "Printed with care for material and colour, no mass production." },
      { title: "Pickup or delivery", text: "From the gallery in Bansko or by Econt to an office anywhere in Bulgaria." }
    ],
    faq: [
      { question: "How do I order?", answer: "Fill in the form with your options and contact details. We will get in touch to confirm the price, timing and pickup or delivery. No payment is taken before confirmation." },
      { question: "Can I order with my own photo or idea?", answer: "Yes. Upload the photo in the form or describe it in the note. We will suggest a format, material and price." },
      { question: "How long does it take?", answer: "It depends on the product and stock. You will get an exact timeline when we confirm the order." }
    ],
    cta: "Send the order"
  }
};

const byType: Record<string, Record<Locale, Partial<ArtStudioTypeCopy>>> = {
  "custom-tshirts": {
    bg: {
      lead: "Тениски с авторски дизайни от Банско и Пирин или с твоя снимка и текст. Дамски, унисекс, детски и бебешки модели, печат с трайни цветове.",
      benefits: [
        { title: "Твоят дизайн или наш", text: "Избери готов мотив от галерията или ни дай снимка, текст и идея." },
        { title: "Модели за всички", text: "Дамски, дамски вталени, унисекс, детски и бебешки размери." },
        { title: "Трайен печат", text: "Ярки цветове, които издържат пране след пране при 30 градуса." },
        { title: "Подарък с история", text: "Тениска от Банско е спомен, който се носи." }
      ],
      faq: [
        { question: "Кой размер да избера?", answer: "Избери модел и размер във формата. Ако се колебаеш между два размера, напиши го в бележката и ще те посъветваме по телефона." },
        { question: "Мога ли да поръчам тениска със своя снимка?", answer: "Да. Качи снимката във формата. Най-добре работят ясни снимки с добра резолюция. Ще ти покажем как ще изглежда преди печата." },
        { question: "Как да пера тениската?", answer: "Обърната наопаки, на 30 градуса, без сушилня и без гладене директно върху печата." },
        { question: "Правите ли тениски за екип или събитие?", answer: "Да, за групи и събития. Напиши броя и идеята в бележката, ще подготвим оферта." }
      ]
    },
    en: {
      lead: "T-shirts with original designs from Bansko and Pirin, or with your photo and text. Women's, unisex, kids' and baby models with durable print.",
      benefits: [
        { title: "Your design or ours", text: "Pick a ready design from the gallery or give us a photo, text and idea." },
        { title: "Models for everyone", text: "Women's, fitted, unisex, kids' and baby sizes." },
        { title: "Durable print", text: "Bright colours that survive wash after wash at 30 degrees." },
        { title: "A gift with a story", text: "A T-shirt from Bansko is a memory you can wear." }
      ],
      faq: [
        { question: "Which size should I pick?", answer: "Choose a model and size in the form. If you hesitate between two sizes, mention it in the note and we will advise you by phone." },
        { question: "Can I order a T-shirt with my own photo?", answer: "Yes. Upload the photo in the form. Clear, high-resolution photos work best. We show you a preview before printing." },
        { question: "How do I wash it?", answer: "Inside out, at 30 degrees, no dryer and no ironing directly on the print." },
        { question: "Do you make T-shirts for teams or events?", answer: "Yes. Write the quantity and idea in the note and we will prepare an offer." }
      ]
    }
  },
  "fine-art-prints": {
    bg: {
      lead: "Fine art принтове и платна с пейзажи от Пирин и Банско, или от твоя снимка. Печат с архивни мастила върху качествена хартия или canvas.",
      benefits: [
        { title: "Авторски пейзажи", text: "Изгреви над Пирин, Тодорка, Кончето и старото Банско, снимани от нас." },
        { title: "Архивно качество", text: "Мастила и хартия, които пазят цветовете десетилетия." },
        { title: "Всеки размер", text: "От A4 за бюрото до 60 × 90 см за стената. Платно с подрамка по желание." },
        { title: "Твоя снимка", text: "Изпрати снимката си и ще я подготвим за печат." }
      ],
      faq: [
        { question: "Каква е разликата между хартия и платно?", answer: "Fine art хартията дава фини детайли и матова повърхност, подходяща за рамкиране. Платното е опънато на подрамка и е готово за окачване без рамка." },
        { question: "Мога ли да поръчам принт от своя снимка?", answer: "Да. Качи файла във формата. За големи размери е нужна снимка с висока резолюция; ще ти кажем, ако тя не е достатъчна." },
        { question: "Има ли рамка?", answer: "Принтовете на хартия се доставят без рамка, а платното е с подрамка. Ако искаш рамка, напиши го в бележката." },
        { question: "Как да пазя принта?", answer: "Далеч от пряка слънчева светлина и влага. За хартия препоръчваме стъкло или рамка." }
      ]
    },
    en: {
      lead: "Fine art prints and canvases with landscapes from Pirin and Bansko, or from your own photo. Archival inks on quality paper or canvas.",
      benefits: [
        { title: "Original landscapes", text: "Sunrises over Pirin, Todorka, Koncheto and old Bansko, photographed by us." },
        { title: "Archival quality", text: "Inks and paper that keep their colours for decades." },
        { title: "Any size", text: "From A4 for the desk to 60 × 90 cm for the wall. Stretched canvas on request." },
        { title: "Your photo", text: "Send us your photo and we will prepare it for print." }
      ],
      faq: [
        { question: "Paper or canvas?", answer: "Fine art paper gives fine detail and a matte surface, ideal for framing. Canvas comes stretched on a frame and is ready to hang." },
        { question: "Can I order a print of my own photo?", answer: "Yes. Upload the file in the form. Large sizes need a high-resolution photo; we will tell you if it is not enough." },
        { question: "Is a frame included?", answer: "Paper prints ship unframed; canvas comes on a stretcher frame. If you want a frame, mention it in the note." },
        { question: "How do I care for the print?", answer: "Keep it away from direct sunlight and moisture. For paper we recommend glass or a frame." }
      ]
    }
  },
  "mugs-drinkware": {
    bg: {
      lead: "Чаши и термочаши с дизайни от Банско и Пирин или с твоя снимка. Подарък, който се използва всеки ден.",
      benefits: [
        { title: "Всекидневен подарък", text: "Чашата е сувенирът, който хората наистина използват." },
        { title: "Твоя снимка или текст", text: "Семейна снимка, име, дата или любим мотив от галерията." },
        { title: "Трайност", text: "Печатът издържа миялна машина при ежедневна употреба." }
      ],
      faq: [
        { question: "Може ли чаша със снимка?", answer: "Да. Качи снимката във формата и ще я подготвим за печат. Ще ти покажем как ще изглежда." },
        { question: "Мие ли се в миялна машина?", answer: "Да, керамичните чаши са подходящи за миялна. Термочашите се мият на ръка." },
        { question: "Правите ли чаши за фирми и събития?", answer: "Да. Напиши броя и идеята в бележката и ще получиш оферта." }
      ]
    },
    en: {
      lead: "Mugs and thermal mugs with designs from Bansko and Pirin or with your own photo. A gift that gets used every day.",
      benefits: [
        { title: "An everyday gift", text: "The mug is the souvenir people actually use." },
        { title: "Your photo or text", text: "A family photo, a name, a date or a favourite design from the gallery." },
        { title: "Durable", text: "The print survives the dishwasher with daily use." }
      ],
      faq: [
        { question: "Can I have a mug with a photo?", answer: "Yes. Upload the photo in the form and we will prepare it for print. We show you a preview first." },
        { question: "Is it dishwasher safe?", answer: "Yes, the ceramic mugs are dishwasher safe. Thermal mugs are hand wash only." },
        { question: "Do you make mugs for companies and events?", answer: "Yes. Write the quantity and idea in the note and you will get an offer." }
      ]
    }
  },
  icons: {
    bg: {
      lead: "Икони и духовни образи, изработени по поръчка в Банско. Размер, техника и образ по твое желание.",
      benefits: [
        { title: "По поръчка", text: "Всяка икона се изработва специално за теб." },
        { title: "Личен подарък", text: "За кръщене, сватба, имен ден или дом." },
        { title: "Съвет за избора", text: "Ще ти помогнем с образа, размера и техниката." }
      ],
      faq: [
        { question: "Как да избера образа?", answer: "Напиши в бележката или качи снимка на желаната икона. Ще обсъдим възможностите и ще предложим варианти." },
        { question: "Колко време отнема изработката?", answer: "Иконите се правят ръчно и срокът зависи от размера и техниката. Ще получиш точен срок при потвърждението." },
        { question: "Може ли доставка?", answer: "Да, с Еконт до офис в цялата страна, внимателно опаковани. Или взимане от галерията в Банско." }
      ]
    },
    en: {
      lead: "Icons and spiritual images made to order in Bansko. Size, technique and image as you wish.",
      benefits: [
        { title: "Made to order", text: "Each icon is made especially for you." },
        { title: "A personal gift", text: "For a christening, wedding, name day or home." },
        { title: "Advice on the choice", text: "We help you choose the image, size and technique." }
      ],
      faq: [
        { question: "How do I choose the image?", answer: "Describe it in the note or upload a photo of the icon you have in mind. We will discuss options and suggest variants." },
        { question: "How long does it take?", answer: "Icons are made by hand and the timing depends on size and technique. You get an exact timeline when we confirm." },
        { question: "Can it be delivered?", answer: "Yes, by Econt to an office anywhere in Bulgaria, carefully packed. Or collect at the gallery in Bansko." }
      ]
    }
  }
};

export function getArtStudioTypeCopy(internalName: string, locale: Locale): ArtStudioTypeCopy {
  const base = generic[locale];
  const specific = byType[internalName]?.[locale];
  return { ...base, ...(specific || {}) };
}
