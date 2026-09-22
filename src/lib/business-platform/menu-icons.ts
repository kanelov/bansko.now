/**
 * Иконките на категориите в менюто (телевизор, QR меню, печат). Собственикът
 * избира от този списък в портала; без избор страницата познава иконката по
 * името на категорията - „Кафе“ получава чашка, „Бира“ халба. Чист модул, без
 * зависимости, за да го ползват и сървърът, и формите.
 */

export type MenuIconOption = { name: string; label: string };

export const menuCategoryIconOptions: MenuIconOption[] = [
  { name: "mug-saucer", label: "Кафе" },
  { name: "mug-hot", label: "Чай и топли напитки" },
  { name: "lemon", label: "Лимонади и фреш" },
  { name: "glass-water", label: "Напитки в чаша" },
  { name: "bottle-water", label: "Безалкохолни в бутилка" },
  { name: "droplet", label: "Вода" },
  { name: "beer-mug-empty", label: "Бира" },
  { name: "apple-whole", label: "Сайдер и плодове" },
  { name: "wine-glass", label: "Вино" },
  { name: "champagne-glasses", label: "Шампанско и просеко" },
  { name: "martini-glass-citrus", label: "Коктейли" },
  { name: "whiskey-glass", label: "Алкохол" },
  { name: "bread-slice", label: "Сандвичи и чабати" },
  { name: "wheat-awn", label: "Кроасани и печива" },
  { name: "bacon", label: "Закуска" },
  { name: "egg", label: "Яйца" },
  { name: "cheese", label: "Сирена и платà" },
  { name: "burger", label: "Бургери" },
  { name: "hotdog", label: "Хотдог" },
  { name: "pizza-slice", label: "Пица" },
  { name: "bowl-food", label: "Супи, паста, основни" },
  { name: "bowl-rice", label: "Ориз и боул" },
  { name: "drumstick-bite", label: "Месо и скара" },
  { name: "fish", label: "Риба" },
  { name: "shrimp", label: "Морски дарове" },
  { name: "leaf", label: "Салати и веган" },
  { name: "seedling", label: "Здравословно" },
  { name: "carrot", label: "Зеленчуци и гарнитури" },
  { name: "pepper-hot", label: "Люто" },
  { name: "cookie-bite", label: "Сладки и бисквити" },
  { name: "cake-candles", label: "Десерти и торти" },
  { name: "ice-cream", label: "Сладолед" },
  { name: "candy-cane", label: "За децата" },
  { name: "utensils", label: "Общо (прибори)" }
];

const knownIcons = new Set(menuCategoryIconOptions.map((option) => option.name));

/* Редът е важен: първо по-точните думи („лимонад“ преди „напитк“). */
const guesses: Array<[RegExp, string]> = [
  [/кафе|coffee|еспресо|espresso|капучин|latte/i, "mug-saucer"],
  [/чай|tea\b|топли/i, "mug-hot"],
  [/лимонад|lemonade|фреш|fresh|juice|сок/i, "lemon"],
  [/сайдер|cider/i, "apple-whole"],
  [/бира|beer|бири/i, "beer-mug-empty"],
  [/шампан|champagne|просеко|prosecco|пенлив/i, "champagne-glasses"],
  [/вино|wine|вина/i, "wine-glass"],
  [/коктейл|cocktail/i, "martini-glass-citrus"],
  [/ракия|уиски|whisk|алкохол|spirits|водка|джин|ром\b/i, "whiskey-glass"],
  [/вода|water/i, "droplet"],
  [/безалкохол|soft|газиран|soda|напитк|drinks/i, "bottle-water"],
  [/кроасан|croissant|печив|pastr|bakery|закуск/i, "wheat-awn"],
  [/сандвич|sandwich|чабат|ciabatta|панини|panini|тост|toast|хляб|bread|брускет/i, "bread-slice"],
  [/бургер|burger/i, "burger"],
  [/хотдог|hot ?dog/i, "hotdog"],
  [/пица|pizza/i, "pizza-slice"],
  [/сладолед|ice ?cream|gelato/i, "ice-cream"],
  [/десерт|dessert|торт|cake|сладк|палачинк|pancake|waffle|гофрет/i, "cake-candles"],
  [/бисквит|cookie/i, "cookie-bite"],
  [/салат|salad|веган|vegan|вегетар/i, "leaf"],
  [/риба|fish/i, "fish"],
  [/морск|seafood|скарид|shrimp/i, "shrimp"],
  [/месо|скара|grill|meat|пиле|chicken|steak|стек|кебап|кюфте/i, "drumstick-bite"],
  [/бекон|bacon|breakfast/i, "bacon"],
  [/яйц|egg|омлет|omelet/i, "egg"],
  [/сирен|cheese|плато|platter/i, "cheese"],
  [/супа|soup|паста|pasta|основн|main|ястия|dishes|ризото|risotto/i, "bowl-food"],
  [/ориз|rice|bowl|боул|noodle|нудъл/i, "bowl-rice"],
  [/зеленчу|vegetable|гарнитур|side/i, "carrot"],
  [/люто|spicy|hot/i, "pepper-hot"],
  [/дец|kids|children/i, "candy-cane"]
];

export function guessMenuCategoryIcon(names: { bg?: string | null; en?: string | null }) {
  const text = `${names.bg ?? ""} ${names.en ?? ""}`;
  for (const [pattern, icon] of guesses) {
    if (pattern.test(text)) return icon;
  }
  return "utensils";
}

/** Избраната иконка, ако е от списъка; иначе познатата по името. */
export function resolveMenuCategoryIcon(iconName: string | null | undefined, names: { bg?: string | null; en?: string | null }) {
  return iconName && knownIcons.has(iconName) ? iconName : guessMenuCategoryIcon(names);
}
