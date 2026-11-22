import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";

/**
 * Помощта за собственика: стъпки, които се изпълняват, а не справочник. Всяка
 * секция има „Накратко“ (какво е и какво правиш) и сгънато „Подробно“ (къде
 * живее това и какво се случва отдолу) - същият образец като /admin/guide.
 * Правило: промени ли се процес, се обновява и тази страница.
 */

export const metadata: Metadata = {
  title: "Помощ"
};

const updatedAt = "22 ноември 2026";

export default async function BusinessGuidePage() {
  const { business } = await requireBusinessOwner();

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Помощ</p>
        <h1 className={portalUi.h1}>Как се работи с портала</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Кратко ръководство за {business.name}. Актуализирано: {updatedAt}.
        </p>
      </header>

      <section className={portalUi.card}>
        <GuideSection number="1" title="Меню: категории и артикули" open>
          <GuideSummary>
            <p>Менюто е едно и се пише само тук. Каквото промениш, се вижда на QR менюто веднага.</p>
            <p>
              Първо създаваш категория („Топли напитки“), после добавяш артикули в нея. Артикул с една цена си я носи;
              артикул с размери („Малко“, „Голямо“) взема цените от вариантите.
            </p>
            <p>„Свърши“ показва артикула зачертан с етикет „Изчерпано“. „Скрий“ го маха от менюто, без да го изтрива.</p>
            <p>
              Всяка категория има иконка пред името (чашка за кафе, халба за бира, капка за вода). Страницата я познава сама по
              името; ако не ти харесва, избираш друга от списъка във формата на категорията. Иконката е една и съща на
              телевизора, в QR менюто и на печат.
            </p>
          </GuideSummary>
          <p>
            <Link href="/business/menu" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Меню“
            </Link>
          </p>
          <GuideDetails>
            <p>
              Редовете са в <code>business_menu_categories</code>, <code>business_menu_items</code> и{" "}
              <code>business_menu_item_variants</code>, а имената и описанията на двата езика - в таблиците{" "}
              <code>*_translations</code>. Липсва ли английско име, гостът на английски вижда българското.
            </p>
            <p>
              Иконката е в <code>business_menu_categories.icon_name</code> (име от Font Awesome, например{" "}
              <code>mug-saucer</code>); празно означава „познай по името“ - правилата са в{" "}
              <code>src/lib/business-platform/menu-icons.ts</code>. Видът на менюто на трите места (кремава хартия,
              кафяви линии, точки до цената) е един файл: <code>src/styles/menu-paper.css</code>.
            </p>
            <p>
              Цената е в евроцентове: „3,90“ и „3.90“ се приемат еднакво. Артикул с варианти няма собствена цена -
              базата сама я изчиства, за да няма две истини.
            </p>
            <p>
              Снимката отива направо в Cloudflare R2 под <code>business/&lt;бизнес&gt;/image/</code> в три размера
              (480/960/1600) и се пази в <code>business_media</code>.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="2" title="Работно време">
          <GuideSummary>
            <p>Попълваш часовете за всеки ден. Ден без часове значи почивен ден.</p>
            <p>Втората двойка часове е за почивка по обяд. Работа след полунощ се пише както си е: 18:00 – 02:00.</p>
            <p>За празник или инвентаризация добавяш промяна по дата - тя бие седмичното време.</p>
          </GuideSummary>
          <p>
            <Link href="/business/hours" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Часове“
            </Link>
          </p>
          <GuideDetails>
            <p>
              Седмицата е в <code>business_hours</code> (по един ред на интервал, ISO дни 1–7), а изключенията - в{" "}
              <code>business_hour_exceptions</code>. „Отворено сега“ се смята на сървъра в часовата зона Europe/Sofia,
              затова е вярно и когато гостът е в друга държава.
            </p>
            <p>
              Ръчният превключвател на таблото („Отворено сега“ / „Затворено сега“) бие часовете. Върни го на „По
              работно време“, когато денят свърши.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="3" title="QR код за масите">
          <GuideSummary>
            <p>Един код води към цялото меню. Кодът не се сменя при промяна на цена или при изчерпан артикул.</p>
            <p>Натискаш „Отпечатай“, изрязваш и слагаш на масите.</p>
          </GuideSummary>
          <p>
            <Link href="/business/menu/qr" className="font-semibold text-forest underline underline-offset-4">
              Отвори „QR код за менюто“
            </Link>
          </p>
          <GuideDetails>
            <p>
              Кодът е тъмнозелен, с кръгли точки и листо в средата (<code>src/lib/business-platform/qr.ts</code>, корекция на грешки H, за да не пречи листото). Сочи към <code>/places/&lt;адрес&gt;/menu?src=qr</code> и се рисува като вектор на сървъра, затова е
              остър и на стикер, и на лист А4. Английската версия е същата страница под <code>/en/…</code>.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="4" title="Какво вижда гостът">
          <GuideSummary>
            <p>Профилът на бизнеса в Bansko NOW показва откъс от менюто, работното време и „Отворено / Затворено“.</p>
            <p>QR менюто е отделна лека страница само с менюто - отваря се бързо и на слаб интернет.</p>
            <p>И двете се обновяват сами до минута след запис в портала. Телевизорите – с „Опресни телевизорите“ в „Екрани“.</p>
          </GuideSummary>
          <GuideDetails>
            <p>
              Страниците са статични с 15-минутно опресняване, но всеки запис в портала ги презарежда веднага. Скритите
              артикули и неактивните категории не стигат до публичната страница изобщо - спира ги самата база.
            </p>
            <p>
              Менюто влиза и в данните за Google (schema.org <code>Menu</code> с цени в евро), затова е добре имената да
              са както ги казвате на гостите.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="5" title="Екрани: телевизорите в заведението">
          <GuideSummary>
            <p>Всеки телевизор е „екран“ със свой адрес. Екранът не е второ меню: избираш само кои категории, кой шаблон и коя снимка или видео.</p>
            <p>
              Всеки телевизор има номер. На телевизора пишеш само <code>bansko.now/tv/</code> и номера, например <code>bansko.now/tv/001</code>
              (стига и <code>bansko.now/tv/1</code>). Той сам отваря дългия таен адрес. Номерът не се сменя.
            </p>
            <p>
              Телевизорите се зареждат сами само 3 пъти на ден – в 06:00, 12:00 и 18:00. След промяна в „Меню“ или в слайдовете отвори
              „Екрани“ и натисни <strong>„Опресни телевизорите“</strong> – всички телевизори на заведението я показват до 2 минути.
              Запис на екран ги опреснява сам.
            </p>
            <p>
              <strong>Шаблон „Слайдове“</strong> е за реклама без меню, например в галерия или магазин: снимки и видеа на цял екран, едно
              след друго, с заглавие и кратък ред отдолу.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>„Екрани“ → „Нов екран“ (или отвори съществуващ) → шаблон „Слайдове“.</li>
              <li>„Качи снимки или видеа“ – можеш да избереш няколко файла наведнъж. Всеки става слайд най-отдолу.</li>
              <li>На всеки слайд напиши заглавие (например „Пейзажна фотография“) и, ако искаш, ред отдолу.</li>
              <li>Снимката стои толкова секунди, колкото напишеш (от 3 до 120). Видеото върви до края си.</li>
              <li>Подреди със стрелките ↑ ↓, махни излишните с „Махни“ и натисни „Запази екрана“. Телевизорът се обновява сам до 2 минути.</li>
            </ol>
            <p>
              <strong>HTML слайд</strong> е готова анимирана страница, например банер, направен с Claude. Добавя се с „Добави HTML слайд“ на
              същото място. Помоли Claude за „HTML слайд за телевизор 1920 × 1080, един файл, ES5 JavaScript, снимки като адреси от
              интернет“, запази отговора като <code>.html</code> и го качи.
            </p>
            <p>„Преглед“ на страницата на екрана е точно това, което е на телевизора. Дълго меню първо се смалява само (до около 70 % от нормалния текст). Ако и така пише „не се събира“ – махни категория или изключи описанията.</p>
          </GuideSummary>
          <p>
            <Link href="/business/displays" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Екрани“
            </Link>
          </p>
          <GuideDetails title="Подробно: как се настройва телевизорът">
            <p>
              <strong>Обикновен Samsung и The Frame:</strong> Home на дистанционното → приложението „Internet“ → напиши{" "}
              <code>bansko.now/tv/</code> и номера → OK. В настройките спри скрийнсейвъра и автоматичното изключване; на The Frame спри и
              Art Mode. Тези телевизори не отварят сайта сами при включване – след спиране на тока се пуска пак на ръка. За постоянен
              екран е по-сигурна приставката по-долу.
            </p>
            <p>
              <strong>Samsung Business TV (серия BE) или Smart Signage (QB/QM):</strong> Меню → „URL Launcher“ (при по-новите: „Custom
              App“) → въведи адреса от страницата на екрана → включи „Auto start“ → изключи скрийнсейвъра и автоматичното изключване.
              При спиране на тока телевизорът се връща сам на менюто.
            </p>
            <p>
              <strong>LG webOS Signage:</strong> същото през „SI Server“ / „URL Loader“.
            </p>
            <p>
              <strong>Обикновен телевизор (всяка марка с HDMI):</strong> Android TV stick (около 40 €) с приложение „Fully Kiosk Browser“:
              въвеждаш адреса веднъж, включваш „старт при включване“ и „цял екран“. Преди покупка на нов телевизор провери дали
              моделът има „URL Launcher“ в менюто – тогава stick не трябва.
            </p>
            <p>
              Номерът е поредно число за всички бизнеси (<code>business_displays.short_code</code>, давa го базата); <code>/tv/&lt;номер&gt;</code>{" "}
              го търси през <code>display_token_by_code()</code> и пренасочва към <code>/display/&lt;таен адрес&gt;</code>. Номерата се
              познават лесно, затова екранът показва само публично съдържание. „Смени тайния адрес“ сменя само дългия адрес; телевизорът
              отваря номера отново. Без интернет телевизорът показва последното, което е заредил, и малка червена точка в ъгъла.
            </p>
            <p>
              <strong>Колко товари:</strong> един телевизор пита сайта само 3 пъти на ден (в 06, 12 и 18 ч.) и тогава се презарежда.
              На 2 минути поглежда малък файл <code>business/&lt;бизнес&gt;/tv-refresh.js</code> направо в Cloudflare (cdn.bansko.now) –
              той се сменя от „Опресни телевизорите“ и от запис на екран. Снимките и видеата също идват от Cloudflare и се пазят в
              телевизора.
            </p>
            <p>
              <strong>Файлове за слайдовете:</strong> снимки JPEG, PNG или WebP до 8 MB, най-добре хоризонтални 1920 × 1080; видео MP4 до
              150 MB, най-добре 1080p, до минута и без звук (телевизорът го пуска без звук). Банерите от Claude Design се свалят като
              PNG 1920 × 1080 и се качват като снимки. Видеото се зарежда чак когато е на ред, за да не пълни паметта на телевизора. Слайдовете
              са в таблицата <code>business_display_slides</code> (файл, заглавие, ред отдолу, секунди, ред); файловете са в Cloudflare R2
              под <code>business/&lt;бизнес&gt;/</code>, в <code>business_media</code> с вид <code>display</code>.
            </p>
            <p>
              Видео и снимка за „Меню + видео“ / „Меню + снимка“ вече качваш ти от същата страница (по-рано видеото качваше само Bansko NOW).
            </p>
            <p>
              <strong>HTML слайдове:</strong> до 200 KB всеки и около 3 MB общо на екран. Кодът се пази в базата
              (<code>business_display_slides.html</code>, вид <code>html</code>) и на телевизора върви в затворена рамка
              (<code>&lt;iframe sandbox=&quot;allow-scripts&quot;&gt;</code>): скриптовете работят, но нямат достъп до сайта и не могат да
              сменят страницата. При всяко показване слайдът се зарежда отначало. Браузърът на телевизора е стар (Chromium 85), затова
              JavaScript трябва да е ES5. Примери и задача за Claude: <code>docs/tv-slides/</code> в кода на сайта. Таблицата в базата е <code>business_displays</code>, категориите на
              екрана - <code>business_display_categories</code>; телевизорът пита <code>/api/display/&lt;адрес&gt;/version</code> само преди зареждане по график.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="6" title="Печат: меню на хартия">
          <GuideSummary>
            <p>В „Печат“ избираш размер (A4, A3, A5, DL), език (български, английски или двуезично), светъл или тъмен вид и фон-снимка, после „Отвори за печат“.</p>
            <p>На отворената страница натискаш „Печат / Запази като PDF“. В диалога: полета „Няма“, мащаб 100 %. Размерът на листа идва от страницата.</p>
            <p>Цените са тези от „Меню“ в момента на отваряне. „Свърши“ не се печата като зачертано – хартията живее седмици, изчерпаното е за деня.</p>
          </GuideSummary>
          <p>
            <Link href="/business/print" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Печат“
            </Link>
          </p>
          <GuideDetails title="Подробно: офис принтер, печатница и фонът">
            <p>
              <strong>Офис принтер:</strong> листът е с точния размер. Повечето принтери оставят бяла ивица по ръба – това е от
              принтера, не от файла.
            </p>
            <p>
              <strong>Печатница:</strong> избери „Печатница“ – файлът става с 3 mm по-голям от всяка страна (за рязане), а текстът
              стои навътре. Прати PDF-а, както е.
            </p>
            <p>
              <strong>Фон:</strong> снимката се пази в пълен размер (за A4 стигат 2 500 px по дългата страна, за A3 – 3 500 px) и
              върху нея има воал, за да се чете текстът. Шрифтовете са вградени в страницата, затова PDF-ът изглежда еднакво на
              всеки компютър. QR кодът долу вдясно води към актуалното меню.
            </p>
            <p>
              Нищо от настройките не се пази в базата – всеки път избираш отново. Фоновете са в <code>business_media</code> с вид{" "}
              <code>print_background</code>. Дълго меню минава само на втора страница; категория никога не се къса по средата.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="7" title="Бранд: лого, цветове и шрифтове">
          <GuideSummary>
            <p>
              Една тема за всичките ти изгледи: QR менюто, телевизорите и менюто за печат. Страницата на бизнеса в bansko.now не се
              променя – тя е във вида на сайта.
            </p>
            <p>
              Избираш тема от картите („Хартия“, „Гора“, „Мастило“, „Пясък“, „Маслина“, „Роза“) – всяка носи свои цветове, шрифтове
              и хартия. Ако искаш фирмения си цвят, махаш отметката „по темата“ при „Акцент“ и го избираш от палитрата.
            </p>
            <p>
              Качваш лого (PNG с прозрачен фон, поне 400 px широко) и при „Орнамент“ избираш „Логото на бизнеса“ – то застава над
              името в менюто вместо листото.
            </p>
            <p>
              „Иконка в QR кода“ е малкият знак в средата на кода: чаша за кафене, ножица за фризьорски салон, ски или сноуборд за
              ски училище, лифт, хотел, такси и още. Списъкът е по типове бизнеси в Банско; кодът се чете еднакво добре с всяка.
            </p>
            <p>
              „Запази бранда“ – QR менюто се обновява веднага; телевизорите – след „Опресни телевизорите“ в „Екрани“ или при следващото зареждане по график. Прегледът под формата е
              първият включен екран, точно както е на телевизора.
            </p>
          </GuideSummary>
          <p>
            <Link href="/business/branding" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Бранд“
            </Link>
          </p>
          <GuideDetails title="Подробно: къде живее темата">
            <p>
              Темата е един запис в <code>business_platform_settings.branding</code> (jsonb: тема, три цвята, два шрифта, зърно,
              орнамент, лого). Кодът я чете само през <code>resolveTheme()</code> в{" "}
              <code>src/lib/business-platform/theme.ts</code>, така че невалидна стойност става подразбиране, а не стига до
              страницата. Списъкът с темите и цветовете им е в същия файл.
            </p>
            <p>
              Цветовете влизат в менюто като CSS променливи (<code>--paper-bg</code>, <code>--paper-accent</code>…) върху{" "}
              <code>src/styles/menu-paper.css</code>; телевизорът ги получава заедно с екрана през <code>display_by_token()</code>{" "}
              и не пита базата отделно. Смяната на темата вдига <code>content_version</code>, затова телевизорите се презареждат
              сами.
            </p>
            <p>
              Свой фон или текст важи за светлия вид; тъмният вид на екрана пази тъмните цветове на темата, за да остане четим.
              Телевизорът няма Georgia – там заглавията са Playfair Display; Lora, Inter и Montserrat са вградени в страниците.
            </p>
            <p>
              Логото е ред в <code>business_media</code> с вид <code>logo</code> (три размера WebP в R2, прозрачността се пази);
              „Махни логото“ трие реда и файловете. QR кодът взема цвета на акцента, ако е достатъчно тъмен за четене.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="9" title="Профил: страницата в каталога">
          <GuideSummary>
            <p>„Профил“ е страницата на заведението в каталога на Bansko NOW. Сменяш я сам:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Снимки: качи няколко, най-добре хоризонтални. Първата е главната – тя е в картата в каталога и горе в страницата. „Направи главна“ сменя коя е първа.</li>
              <li>Описание на български и на английски. Без английско описание страницата на английски не се показва.</li>
              <li>Адрес, телефон, имейл за гостите, сайт, Facebook и Instagram, после „Запази профила“.</li>
            </ol>
            <p>Името, адресът на страницата, категорията, премиум мястото и специално оформената част на страницата ги сменя Bansko NOW.</p>
          </GuideSummary>
          <p>
            <Link href="/business/profile" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Профил“
            </Link>
          </p>
          <GuideDetails title="Подробно: къде се пазят">
            <p>
              Текстовете са в <code>businesses</code> и <code>business_translations</code> (по език); снимките се качват в Cloudflare R2 под{" "}
              <code>business/&lt;бизнес&gt;/</code> (три размера WebP, в <code>business_media</code> с вид <code>gallery</code>), а в профила влиза големият
              (1600 px). Без своя снимка страницата показва общата илюстрация на категорията. Специално оформената част е в{" "}
              <code>business_translations.custom_html</code> и базата не позволява на собственика да я сменя.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="8" title="Абонамент">
          <GuideSummary>
            <p>План „Бизнес“ струва 10 € на месец и отключва всичко в портала. В менюто вляво до „Абонамент“ пише до кога е платен.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Отвори „Абонамент“ и натисни „Абонирай се“.</li>
              <li>Избери „Месечен абонамент“ (картата се таксува сама всеки месец) или „Плати един месец“ (веднъж).</li>
              <li>Плащаш на страницата на Stripe и се връщаш в портала. Там пише „Платен до …“.</li>
              <li>Месечният абонамент се спира с „Спри абонамента“. Остава активен до края на платения месец.</li>
            </ol>
            <p>Ако си платил в брой или по банка, Bansko NOW го отбелязва и то също се вижда в „Плащания“.</p>
          </GuideSummary>
          <p>
            <Link href="/business/subscription" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Абонамент“
            </Link>
          </p>
          <GuideDetails title="Подробно: как се записва плащането">
            <p>
              Плащането е през Stripe Checkout (картата не минава през Bansko NOW). След плащане порталът проверява сесията в Stripe и
              записва плащането в <code>business_payments</code>; „платен до“ е в <code>business_billing.paid_until</code>. Новият месец
              почва от днес или от края на текущия платен период. Месечните подновявания идват от Stripe през{" "}
              <code>/api/stripe/business-billing</code>. Засега нищо не се заключва, ако абонаментът изтече.
            </p>
          </GuideDetails>
        </GuideSection>
      </section>

      <p className="text-sm text-stone-650">
        Акаунтът ти е създаден от Bansko NOW с временна парола – смени я от{" "}
        <Link href="/business/account" className="font-semibold text-forest underline underline-offset-4">
          „Парола“
        </Link>{" "}
        горе вдясно. Забравиш ли я, пиши ни и получаваш нова.
      </p>

      <p className="text-sm text-stone-650">
        Нещо не работи или липсва? Пиши на Bansko NOW:{" "}
        <a href="mailto:mail@kanelov.com" className="font-semibold text-forest underline underline-offset-4">
          mail@kanelov.com
        </a>
        .
      </p>
    </div>
  );
}

function GuideSummary({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-2xl border border-sage bg-sage/30 p-4">
      <p className="text-xs font-semibold uppercase text-forest">Накратко</p>
      <div className="mt-2 grid gap-1.5">{children}</div>
    </div>
  );
}

function GuideDetails({ title = "Подробно: къде живее това", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group/details mt-5 rounded-2xl border border-[var(--stone)] bg-paper p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-stone-950">
        <span aria-hidden="true" className="mr-2 inline-block text-moss transition group-open/details:rotate-90">
          ▸
        </span>
        {title}
      </summary>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-stone-650">{children}</div>
    </details>
  );
}

function GuideSection({ number, title, children, open = false }: { number: string; title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-[var(--stone)] py-2 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-4 py-4">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-forest">
          {number}
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <span aria-hidden="true" className="ml-auto text-xl text-moss transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-7 text-sm leading-7 text-stone-650 sm:pl-12">{children}</div>
    </details>
  );
}
