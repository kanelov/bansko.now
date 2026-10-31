import re,html,json,csv,sys,os
work = sys.argv[1] if len(sys.argv) > 1 else 'work'
os.chdir(work)
from collections import Counter
listing={r['slug']:r for r in json.load(open('listing.json',encoding='utf-8'))}
def cf(h):
    k=int(h[:2],16); return ''.join(chr(int(h[i:i+2],16)^k) for i in range(2,len(h),2))
def text(s): return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s))).strip()
MAP={ # bansko.bg term -> our slug
 'hotels':['Хотели пет звезди','Хотели четири звезди','Хотели три звезди','Хотели две звезди','Хотели една звезда','Хотели','Апартаменти','Апартхотели','Апарт хотели','Семейни хотели'],
 'guest-houses':['Къщи за гости','Вили','Стаи за гости','Бунгала','Хижи'],
 'restaurants':['Ресторанти','Механи','Пицарии','Бързо хранене','Заведения за хранене'],
 'cafes':['Кафенета и барове','Сладкарници','Пекарни','Кафета'],
 'culture':['Галерии и изложби','Музеи','Читалища','Библиотеки','Културни центрове','Исторически обекти','Църкви и манастири'],
 'activities':['Летни атракции','Детски центрове','Туристически услуги','Туроператори','Туристически агенции','Ски и сноуборд услуги','Ски училища','Атракции','Развлечения','Конна езда','Екскурзии','Планински водачи'],
 'health-sport':['Гастроентерология и вътрешни болести','Акушерство и гинекология','Ендокринология и болести на обмяната','Фитнес центрове','Домове за възрастни','Спортни клубове','Дентални кабинети','Аптеки и дрогерии','Общопрактикуващ лекар','Медицински центрове','Лекари специалисти','Фитнес','Спа и уелнес','Ветеринарни клиники','Здравеопазване','Оптики','Лаборатории'],
 'shops':['Магазини за сувенири','Електроника и компютри','Дограма и щори','Ел. материали','Зоомагазини','Цветарски магазини','Оръжеен магазин','Облекло и обувки','Дрехи и обувки','Хранителни магазини','Ски и сноуборд екипировка','Мебели','Търговия на едро','Магазини','Сувенири','Бижута','Книжарници','Техника','Строителни материали','Цветя','Спортни стоки','Козметика','Търговия'],
 'transport':['Транспортни услуги','Такси','Бензиностанции','Автобусни превози','Рент-а-кар','Коли под наем','Паркинги'],
 'services':['Мобилни услуги','Сватбени агенции','Преводи и легализация','Компютърни услуги','Строителен надзор и консултантска дейност','Маркетинг и реклама','Ключарски услуги','Услуги','Административни услуги','Куриерски услуги','Банки','Застрахователни услуги','Счетоводни услуги','Недвижими имоти','Строителство','Производство','Други','Салони за красота','Красота и мода','Фризьорски салони','Козметични салони','Училища','Детски градини','Образователни центрове','Интериорен дизайн','Автосервизи','Автомивки','Автошколи','Авто-мото','Юридически услуги','Печатни услуги','Реклама','ИТ услуги','Телекомуникации','Пощи','Чистене','Ремонти','Шивашки услуги','Нотариуси','Адвокати','Фотографи','Туризъм']}
TERM={t:s for s,ts in MAP.items() for t in ts}
PARENTS={'Туризъм','Красота и мода','Производство','Услуги','Авто-мото'}
TERM['Здравеопазване']='health-sport'
def our_category(terms):
    subs=[t for t in terms if t not in PARENTS]
    for t in subs:
        if t in TERM: return TERM[t], ''
    for t in terms:
        if t in TERM: return TERM[t], ''
    return 'services', 'НЕПОЗНАТА: '+', '.join(terms)
rows=[]; unmapped=Counter()
for slug,l in listing.items():
    b=open(f'pages/{slug}.html',encoding='utf-8',errors='replace').read()
    h=b.find('<h1'); body=b[h:] if h>0 else b
    cut=body.find('За бизнеса'); body=body[:cut] if cut>0 else body
    addr=re.findall(r'e-fas-map-marker-alt.*?elementor-icon-list-text">([^<]*)<',body,re.S)
    phones=[html.unescape(p) for p in re.findall(r'href="tel:([^"]+)"',body)]
    phones=sorted(set(re.sub(r'%20|\s','',p) for p in phones if '74988622' not in p.replace(' ','').replace('%20','')))
    mails=[cf(h) for h in re.findall(r'data-cfemail="([0-9a-f]+)"',body)]
    socials=re.findall(r'elementor-social-icon[^"]*" href="([^"]+)"',body)
    web=[u for u in socials if 'facebook' not in u and 'instagram' not in u]; fb=[u for u in socials if 'facebook' in u]; ig=[u for u in socials if 'instagram' in u]
    descs=re.findall(r'elementor-widget-theme-post-content.*?<div class="elementor-widget-container">(.*?)</div>\s*</div>',body,re.S)
    desc=' '.join(text(d) for d in descs)
    if not desc:
        og=re.search(r'property="og:description" content="([^"]*)"',b); desc=html.unescape(og.group(1)) if og else ''
    phones=sorted(set(re.sub(r'[^0-9+]','',p) for p in phones))
    cat,flag=our_category(l['terms'])
    if flag:
        for t in l['terms']: unmapped[t]+=1
    rows.append({'slug':slug,'name':l['name'],'bansko_bg_terms':', '.join(l['terms']),'our_category':cat,'flag':flag,
        'address':text(addr[0]) if addr else '','phones':' / '.join(phones),'email':', '.join(sorted(set(mails))),
        'website':web[0] if web else '','facebook':fb[0] if fb else '','instagram':ig[0] if ig else '',
        'description':desc[:1500],'source_image':l['image'],'source_url':f'https://bansko.bg/za-biznesa/biznes-katalog/{slug}/'})
with open('bansko-bg-biznesi.csv','w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(len(rows),'rows'); print('our categories:',Counter(r['our_category'] for r in rows).most_common())
print('unmapped terms:',unmapped.most_common())
print('missing address:',sum(1 for r in rows if not r['address']),'missing phone:',sum(1 for r in rows if not r['phones']),'missing desc:',sum(1 for r in rows if not r['description']),'with website:',sum(1 for r in rows if r['website']))
for r in rows[:3]+[x for x in rows if x['slug']=='art-ideya']: print({k:(v[:80] if isinstance(v,str) else v) for k,v in r.items() if k not in('source_url',)})
