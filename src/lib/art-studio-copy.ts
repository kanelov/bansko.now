import type { Json, Locale } from "@/lib/types";

/**
 * Default selling copy for the Art Studio product type pages. Used when the type has no
 * Markdown `content` yet in the admin. Keyed by product_type.internal_name.
 */

export type ArtStudioBenefit = { title: string; text: string };
export type ArtStudioFaqItem = { question: string; answer: string };
export type ArtStudioTypeCopy = {
  eyebrow: string;
  lead: string;
  /** SEO paragraphs shown under the benefits when the type has no custom Markdown content. */
  intro: string[];
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
    cta: "Изпрати поръчката",
    intro: [
      "Art Studio е ателието на галерия Kanelov Art в Банско. Тук печатаме и изработваме на място продукти с авторски дизайни от Банско и Пирин или с твоя снимка и текст, така че всеки подарък или спомен от планината да е личен.",
      "Поръчката става през формата на страницата: избираш опциите, качваш снимка при желание и оставяш телефон и имейл. Ние потвърждаваме цената и срока, а после взимаш готовия продукт от галерията в Банско или го получаваш с Еконт в цялата страна."
    ]
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
    cta: "Send the order",
    intro: [
      "Art Studio is the workshop of the Kanelov Art gallery in Bansko. We print and make products on site with original designs from Bansko and Pirin, or with your own photo and text, so every gift or mountain memory is personal.",
      "Ordering happens through the form on the page: pick the options, upload a photo if you like and leave your phone and email. We confirm the price and timing, then you collect the finished product at the gallery in Bansko or receive it by Econt anywhere in Bulgaria."
    ]
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

const introByType: Record<string, Record<Locale, string[]>> = {
  "custom-tshirts": {
    bg: [
      "Тениските по поръчка са най-търсеният продукт в Art Studio Банско. Печатаме на място дамски, унисекс, детски и бебешки модели със същите размери, с които работим в галерията, така че поръчаното от сайта е точно това, което получаваш.",
      "Можеш да избереш готов дизайн от Банско и Пирин, да качиш своя снимка или да опишеш идея за надпис, например за рожден ден, моминско парти, семейна почивка в планината или фирмено събитие. При поръчка на няколко тениски за група уточняваме цена за количество.",
      "След като изпратиш формата, се свързваме с теб, за да потвърдим модела, размера, цвета и срока. Готовите тениски взимаш от галерията в центъра на Банско или ти ги изпращаме с Еконт до офис или автомат."
    ],
    en: [
      "Custom T-shirts are the most requested product at Art Studio Bansko. We print women's, unisex, kids' and baby models on site, in the same sizes we work with at the gallery, so what you order online is exactly what you get.",
      "Choose a ready design from Bansko and Pirin, upload your own photo or describe an idea for a caption, for a birthday, a hen party, a family mountain holiday or a company event. For group orders we confirm a quantity price.",
      "After you send the form we get in touch to confirm the model, size, colour and timing. You collect the finished T-shirts at the gallery in the centre of Bansko or we ship them by Econt to an office or locker."
    ]
  },
  "fine-art-prints": {
    bg: [
      "Fine art принтовете и платната на Art Studio Банско пренасят пейзажите на Пирин у дома или в офиса: Вихрен, Бъндеришките езера, старите къщи на Банско и планината през четирите сезона. Всеки принт се прави по поръчка в размера, който избереш.",
      "Предлагаме печат на fine art хартия и на платно с подрамка в стандартните размери от каталога на галерията. Можеш да поръчаш авторска фотография или картина, или да качиш собствена снимка с висока резолюция, която да превърнем в принт за подарък или за интериора.",
      "Пишем ти с потвърждение на размера, материала и срока, а готовият принт взимаш от галерията или го получаваш внимателно опакован с Еконт."
    ],
    en: [
      "Fine art prints and canvases from Art Studio Bansko bring the Pirin landscapes home or to the office: Vihren, the Banderitsa lakes, the old houses of Bansko and the mountain through the four seasons. Every print is made to order in the size you choose.",
      "We print on fine art paper and on stretched canvas in the standard sizes from the gallery catalogue. Order an original photograph or painting, or upload your own high-resolution photo to turn into a print for a gift or your interior.",
      "We confirm the size, material and timing by email or phone, and you collect the finished print at the gallery or receive it carefully packed by Econt."
    ]
  },
  "mugs-drinkware": {
    bg: [
      "Чашите и термосите на Art Studio Банско са подарък, който се използва всеки ден: с авторски дизайн от Банско и Пирин, със снимка на любимец или семейството, или с име и кратък текст. Печатът е траен и подходящ за ежедневна употреба.",
      "Избери вида чаша във формата, качи снимка или опиши идеята си и остави данни за контакт. Потвърждаваме цената и срока, а после взимаш чашата от галерията в Банско или я получаваш с Еконт."
    ],
    en: [
      "Mugs and thermal mugs from Art Studio Bansko are a gift that gets used every day: with an original design from Bansko and Pirin, a photo of a pet or the family, or a name and a short message. The print is durable and made for daily use.",
      "Choose the mug type in the form, upload a photo or describe your idea and leave your contact details. We confirm the price and timing, then you collect the mug at the gallery in Bansko or receive it by Econt."
    ]
  },
  icons: {
    bg: [
      "Иконите на Art Studio Банско се изработват по поръчка за кръщене, сватба, имен ден или дом. Избираш образа, размера и техниката, а ние обсъждаме възможностите с теб и предлагаме варианти, преди да започнем.",
      "Опиши желаната икона във формата или качи снимка на образа, който харесваш. Срокът зависи от размера и техниката и го получаваш при потвърждението. Готовата икона взимаш от галерията или ти я изпращаме внимателно опакована с Еконт."
    ],
    en: [
      "Icons from Art Studio Bansko are made to order for a christening, wedding, name day or home. You choose the image, size and technique, and we discuss the options with you and suggest variants before we start.",
      "Describe the icon in the form or upload a photo of the image you like. The timing depends on size and technique and you get it when we confirm. Collect the finished icon at the gallery or receive it carefully packed by Econt."
    ]
  }
};

export function getArtStudioTypeCopy(internalName: string, locale: Locale): ArtStudioTypeCopy {
  const base = generic[locale];
  const specific = byType[internalName]?.[locale];
  const intro = introByType[internalName]?.[locale] ?? base.intro;
  return { ...base, ...(specific || {}), intro };
}

export type ArtStudioTrustItem = { icon: string; title: string; text: string };
export type ArtStudioStep = { title: string; text: string };
export type ArtStudioLandingCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  metaDescription: string;
  ctaGallery: string;
  ctaProducts: string;
  trust: ArtStudioTrustItem[];
  productsEyebrow: string;
  productsTitle: string;
  productsText: string;
  collectionsEyebrow: string;
  collectionsTitle: string;
  collectionsText: string;
  collectionsButton: string;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesButton: string;
  stepsEyebrow: string;
  stepsTitle: string;
  steps: ArtStudioStep[];
  customEyebrow: string;
  customTitle: string;
  customText: string;
  customButton: string;
  faqEyebrow: string;
  faqTitle: string;
  faq: ArtStudioFaqItem[];
  breadcrumbHome: string;
};

/** Default texts of the /art-studio landing page; the admin "Текстове" tab overrides them. */
export const landingDefaults: Record<Locale, ArtStudioLandingCopy> = {
  bg: {
    eyebrow: "Art Studio Банско",
    title: "Art Studio Банско: авторски тениски, арт принтове и чаши",
    lead: "Дизайни, вдъхновени от Банско и Пирин, отпечатани с внимание в малко студио в града. Поръчай онлайн или заяви за взимане от галерията.",
    metaDescription:
      "Art Studio в Банско: авторски тениски, fine art принтове, платна и чаши с дизайни от Пирин. Онлайн поръчка или взимане от галерията в Банско, доставка с Еконт.",
    ctaGallery: "Разгледай галерията",
    ctaProducts: "Виж продуктите",
    trust: [
      { icon: "mountain", title: "Дизайни от Пирин", text: "Планината, дивите животни и Банско, нарисувани и снимани от нас." },
      { icon: "store", title: "Галерия в Банско", text: "Виж продуктите на живо и вземи поръчката си от галерията." },
      { icon: "truck", title: "Доставка с Еконт", text: "Поръчай онлайн и получи в удобен офис в цялата страна." },
      { icon: "pen-nib", title: "Лични поръчки", text: "Твоя снимка или идея върху платно, тениска или чаша." }
    ],
    productsEyebrow: "Какво правим",
    productsTitle: "Избери продукт",
    productsText: "Всяка категория има собствени модели, размери и цени. Плащаш онлайн или заявяваш за взимане от галерията.",
    collectionsEyebrow: "Галерията в Банско",
    collectionsTitle: "Колекции с готови дизайни",
    collectionsText: "Актуалните колекции от галерията, синхронизирани с наличностите в магазина. Заяви продукт и го вземи от Банско.",
    collectionsButton: "Отвори цялата галерия",
    servicesEyebrow: "Услуги",
    servicesTitle: "Печат и визуални услуги",
    servicesButton: "Индивидуална заявка",
    stepsEyebrow: "Как се поръчва",
    stepsTitle: "Три стъпки до готовия продукт",
    steps: [
      { title: "Избери", text: "Разгледай продуктите на Art Studio или колекциите в галерията и избери дизайн, размер и вариант." },
      { title: "Поръчай или заяви", text: "Плати онлайн или остави име и телефон за заявка. Ще потвърдим наличността и срока." },
      { title: "Получи", text: "Вземи поръчката от галерията в Банско или я получи в офис на Еконт." }
    ],
    customEyebrow: "Лични проекти",
    customTitle: "Твоя снимка или идея върху продукт",
    customText: "Правим индивидуални поръчки: принт на платно от твоя снимка, тениска с текст или рисунка, подарък за екип или събитие. Пиши ни какво искаш и ще предложим формат, материал и цена.",
    customButton: "Пиши ни",
    faqEyebrow: "Въпроси",
    faqTitle: "Често задавани въпроси",
    faq: [
      {
        question: "Как получавам поръчката си?",
        answer: "Можеш да я вземеш лично от галерията в Банско или да я получиш в офис на Еконт в цялата страна. Начинът на получаване се избира при поръчката."
      },
      {
        question: "Мога ли да поръчам със своя снимка или дизайн?",
        answer: "Да. Правим лични поръчки за принт на платно, тениска или чаша по твоя снимка, текст или идея. Пиши ни през страницата за контакт и ще уточним размер, материал и цена."
      },
      {
        question: "Какви размери и модели тениски има?",
        answer: "Дамски, унисекс, детски и бебешки модели. Наличните размери за всеки дизайн са показани в страницата на продукта или в галерията."
      },
      {
        question: "Как да се грижа за принта?",
        answer: "Пери тениските обърнати наопаки на ниска температура и без сушилня. Платната и принтовете се пазят от пряка слънчева светлина и влага."
      },
      {
        question: "Мога ли да видя продуктите на живо?",
        answer: "Да. Колекциите са изложени в галерията в Банско. В галерията онлайн виждаш кои продукти са налични в момента и можеш да ги заявиш за взимане."
      }
    ],
    breadcrumbHome: "Начало"
  },
  en: {
    eyebrow: "Art Studio Bansko",
    title: "Art Studio Bansko: original T-shirts, art prints and mugs",
    lead: "Designs inspired by Bansko and Pirin, printed with care in a small studio in town. Order online or reserve for pickup at the gallery.",
    metaDescription:
      "Art Studio in Bansko: original T-shirts, fine art prints, canvas and mugs with Pirin designs. Order online or pick up at the gallery in Bansko, delivery by Econt.",
    ctaGallery: "Browse the gallery",
    ctaProducts: "View products",
    trust: [
      { icon: "mountain", title: "Designs from Pirin", text: "The mountain, its wildlife and Bansko, drawn and photographed by us." },
      { icon: "store", title: "Gallery in Bansko", text: "See the products in person and collect your order at the gallery." },
      { icon: "truck", title: "Econt delivery", text: "Order online and receive it at a convenient office anywhere in Bulgaria." },
      { icon: "pen-nib", title: "Custom orders", text: "Your photo or idea on canvas, a T-shirt or a mug." }
    ],
    productsEyebrow: "What we make",
    productsTitle: "Choose a product",
    productsText: "Each category has its own models, sizes and prices. Pay online or reserve for pickup at the gallery.",
    collectionsEyebrow: "The gallery in Bansko",
    collectionsTitle: "Collections with ready designs",
    collectionsText: "Current collections from the gallery, synced with the shop stock. Reserve a product and collect it in Bansko.",
    collectionsButton: "Open the full gallery",
    servicesEyebrow: "Services",
    servicesTitle: "Printing and visual services",
    servicesButton: "Custom enquiry",
    stepsEyebrow: "How to order",
    stepsTitle: "Three steps to your product",
    steps: [
      { title: "Choose", text: "Browse the Art Studio products or the gallery collections and pick a design, size and variant." },
      { title: "Order or reserve", text: "Pay online or leave your name and phone to reserve. We confirm availability and timing." },
      { title: "Receive", text: "Collect your order at the gallery in Bansko or receive it at an Econt office." }
    ],
    customEyebrow: "Custom projects",
    customTitle: "Your photo or idea on a product",
    customText: "We take custom orders: a canvas print from your photo, a T-shirt with text or artwork, gifts for a team or an event. Tell us what you have in mind and we will suggest a format, material and price.",
    customButton: "Contact us",
    faqEyebrow: "Questions",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        question: "How do I receive my order?",
        answer: "You can collect it in person at the gallery in Bansko or receive it at an Econt office anywhere in Bulgaria. You choose the method when ordering."
      },
      {
        question: "Can I order with my own photo or design?",
        answer: "Yes. We make custom canvas prints, T-shirts and mugs from your photo, text or idea. Contact us and we will agree on size, material and price."
      },
      {
        question: "Which T-shirt sizes and models are available?",
        answer: "Women's, unisex, kids' and baby models. The available sizes for each design are shown on the product page or in the gallery."
      },
      {
        question: "How do I care for the print?",
        answer: "Wash T-shirts inside out at a low temperature and skip the dryer. Keep canvas and prints away from direct sunlight and moisture."
      },
      {
        question: "Can I see the products in person?",
        answer: "Yes. The collections are on display at the gallery in Bansko. The online gallery shows what is in stock right now and lets you reserve for pickup."
      }
    ],
    breadcrumbHome: "Home"
  }
};

export const landingTextKeys = [
  "eyebrow", "title", "lead", "metaDescription", "ctaGallery", "ctaProducts",
  "productsEyebrow", "productsTitle", "productsText",
  "collectionsEyebrow", "collectionsTitle", "collectionsText", "collectionsButton",
  "servicesEyebrow", "servicesTitle", "servicesButton",
  "stepsEyebrow", "stepsTitle",
  "customEyebrow", "customTitle", "customText", "customButton",
  "faqEyebrow", "faqTitle"
] as const;
export type LandingTextKey = (typeof landingTextKeys)[number];
export const typeTextKeys = ["eyebrow", "lead", "cta"] as const;
export type TypeTextKey = (typeof typeTextKeys)[number];

type CopyOverrides = {
  landing?: Record<string, Record<string, unknown>>;
  types?: Record<string, Record<string, Record<string, unknown>>>;
};

function readOverrides(pageCopy: Json | null | undefined): CopyOverrides {
  return pageCopy && typeof pageCopy === "object" && !Array.isArray(pageCopy) ? (pageCopy as CopyOverrides) : {};
}

function overrideText(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function overridePairs(value: unknown): ArtStudioStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : null))
    .map((item) => (item ? { title: overrideText(item.title, 200), text: overrideText(item.text, 1000) } : null))
    .filter((item): item is ArtStudioStep => Boolean(item && item.title))
    .slice(0, 12);
}

function overrideTrust(value: unknown): ArtStudioTrustItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : null))
    .map((item) => (item ? { icon: overrideText(item.icon, 40) || "check", title: overrideText(item.title, 200), text: overrideText(item.text, 600) } : null))
    .filter((item): item is ArtStudioTrustItem => Boolean(item && item.title))
    .slice(0, 8);
}

function overrideFaq(value: unknown): ArtStudioFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : null))
    .map((item) => (item ? { question: overrideText(item.question, 300), answer: overrideText(item.answer, 2000) } : null))
    .filter((item): item is ArtStudioFaqItem => Boolean(item && item.question && item.answer))
    .slice(0, 20);
}

function overrideParagraphs(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => overrideText(item, 2000)).filter(Boolean).slice(0, 8) : [];
}

/** Landing texts: admin overrides from art_studio_public_settings.page_copy over the defaults. */
export function resolveArtStudioLandingCopy(pageCopy: Json | null | undefined, locale: Locale): ArtStudioLandingCopy {
  const base = landingDefaults[locale];
  const raw = readOverrides(pageCopy).landing?.[locale] ?? {};
  const result: ArtStudioLandingCopy = { ...base, trust: [...base.trust], steps: [...base.steps], faq: [...base.faq] };
  for (const key of landingTextKeys) {
    const value = overrideText(raw[key]);
    if (value) result[key] = value;
  }
  const trust = overrideTrust(raw.trust);
  if (trust.length) result.trust = trust;
  const steps = overridePairs(raw.steps);
  if (steps.length) result.steps = steps;
  const faq = overrideFaq(raw.faq);
  if (faq.length) result.faq = faq;
  return result;
}

/** Product type texts: admin overrides over the defaults keyed by internal_name. */
export function resolveArtStudioTypeCopy(pageCopy: Json | null | undefined, internalName: string, locale: Locale): ArtStudioTypeCopy {
  const base = getArtStudioTypeCopy(internalName, locale);
  const raw = readOverrides(pageCopy).types?.[internalName]?.[locale] ?? {};
  const result: ArtStudioTypeCopy = { ...base, benefits: [...base.benefits], intro: [...base.intro], faq: [...base.faq] };
  for (const key of typeTextKeys) {
    const value = overrideText(raw[key]);
    if (value) result[key] = value;
  }
  const benefits = overridePairs(raw.benefits);
  if (benefits.length) result.benefits = benefits;
  const intro = overrideParagraphs(raw.intro);
  if (intro.length) result.intro = intro;
  const faq = overrideFaq(raw.faq);
  if (faq.length) result.faq = faq;
  return result;
}

// Line formats used by the admin textareas: "Заглавие | Текст" per line, paragraphs split by blank lines.
function splitLine(line: string) {
  return line.split("|").map((part) => part.trim());
}

export function parsePairLines(text: string): ArtStudioStep[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = splitLine(line);
      return { title: title || "", text: rest.join(" | ") };
    })
    .filter((item) => item.title)
    .slice(0, 12);
}

export function parseTrustLines(text: string): ArtStudioTrustItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = splitLine(line);
      if (parts.length >= 3) return { icon: parts[0] || "check", title: parts[1], text: parts.slice(2).join(" | ") };
      return { icon: "check", title: parts[0] || "", text: parts[1] || "" };
    })
    .filter((item) => item.title)
    .slice(0, 8);
}

export function parseFaqLines(text: string): ArtStudioFaqItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...rest] = splitLine(line);
      return { question: question || "", answer: rest.join(" | ") };
    })
    .filter((item) => item.question && item.answer)
    .slice(0, 20);
}

export function parseParagraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function formatPairLines(items: ArtStudioStep[]) {
  return items.map((item) => `${item.title} | ${item.text}`).join("\n");
}

export function formatTrustLines(items: ArtStudioTrustItem[]) {
  return items.map((item) => `${item.icon} | ${item.title} | ${item.text}`).join("\n");
}

export function formatFaqLines(items: ArtStudioFaqItem[]) {
  return items.map((item) => `${item.question} | ${item.answer}`).join("\n");
}

export function formatParagraphs(paragraphs: string[]) {
  return paragraphs.join("\n\n");
}
