#!/usr/bin/env python3
"""Build the SQL that imports the bansko.bg business catalog into Bansko NOW (project rzjyawjdhcedddydmfge).
Reads bansko-bg-biznesi.csv (scraped facts) and out/chunk*.json (our BG/EN names, blurbs, alt texts).
Output: import-bansko-bg.sql (idempotent: slugs that already exist are skipped). Not for Git (contains e-mails).
"""
import csv, glob, json, re, os, sys
from collections import Counter

TOOL = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "work")
SOURCE_DATE = "31.10.2026"
rows = list(csv.DictReader(open(f"{BASE}/bansko-bg-biznesi.csv", encoding="utf-8")))
texts = {}
for f in sorted(glob.glob(f"{TOOL}/texts/chunk*.json")):
    for o in json.load(open(f, encoding="utf-8")):
        texts[o["slug"]] = o

CYR = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"sht","ъ":"a","ь":"y","ю":"yu","я":"ya"}
def slugify(s):
    s = "".join(CYR.get(c, c) for c in s.strip().lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80] or "biznes"

CATEGORY_BG = {"restaurants":"Ресторанти","cafes":"Кафета","hotels":"Хотели","guest-houses":"Къщи за гости","services":"Услуги","shops":"Магазини","activities":"Активности","health-sport":"Здраве и спорт","transport":"Транспорт","culture":"Култура"}
CATEGORY_EN = {"restaurants":"Restaurants","cafes":"Cafés","hotels":"Hotels","guest-houses":"Guest houses","services":"Services","shops":"Shops","activities":"Activities","health-sport":"Health & sport","transport":"Transport","culture":"Culture"}

def phone_fmt(p):
    d = re.sub(r"[^0-9+]", "", p)
    if d.startswith("00"): d = "+" + d[2:]
    if d.startswith("0") and len(d) in (9, 10): d = "+359" + d[1:]
    if d.startswith("+359") and len(d) >= 12:
        rest = d[4:]
        return "+359 " + " ".join([rest[:2 if len(rest) == 8 else 3], rest[2 if len(rest) == 8 else 3:-3], rest[-3:]]).replace("  ", " ")
    return d

def q(v):
    if v is None: return "null"
    return "'" + str(v).replace("'", "''") + "'"

OVERRIDES = {
    # the owner's gallery: address and coordinates from Google Maps (Bansko Art Gallery – ART IDEA)
    "art-ideya": {"address": "гр. Банско, ул. „Никола Й. Вапцаров“ 8", "latitude": 41.837099, "longitude": 23.4880923, "website": "https://artidea.bg/"},
}

CATEGORY_OVERRIDES = {"mila-stays": "services", "chitalisthe-nikola-vapczarov-1894": "culture", "zz-entertainment": "activities", "bansko-fun-holidays": "activities", "zoo-magazin-asya": "shops", "apartamenti-sveta-anastasiya": "guest-houses"}
SKIP = {"zora-kk-georgi-boyadzhijski-2", "bansko-fun-holidays-2"}  # същият бизнес два пъти в източника
seen_key = set()
seen_bg, seen_en = Counter(), Counter()
values = []
missing_text = []
for r in rows:
    t = texts.get(r["slug"])
    if not t:
        missing_text.append(r["slug"]); continue
    if r["slug"] in SKIP: continue
    o = OVERRIDES.get(r["slug"], {})
    name_bg, name_en = t["name_bg"].strip(), t["name_en"].strip()
    key = (name_bg.lower(), (o.get("address") or r["address"]).lower())
    if key in seen_key: print("дубликат, пропуснат:", r["slug"]); continue
    seen_key.add(key)
    r["our_category"] = CATEGORY_OVERRIDES.get(r["slug"], r["our_category"])
    slug_bg = slugify(name_bg); seen_bg[slug_bg] += 1
    if seen_bg[slug_bg] > 1: slug_bg = f"{slug_bg}-{seen_bg[slug_bg]}"
    slug_en = slugify(name_en); seen_en[slug_en] += 1
    if seen_en[slug_en] > 1: slug_en = f"{slug_en}-{seen_en[slug_en]}"
    address = o.get("address") or r["address"]
    if not address or address.startswith("http"): address = "гр. Банско"
    address_en = re.sub(r"^гр\.\s*Банско,?\s*", "Bansko, ", address) if address != "гр. Банско" else "Bansko"
    phones = [phone_fmt(p) for p in r["phones"].split(" / ") if p.strip()]
    website = o.get("website") or r["website"] or None
    notes = f"Импорт от bansko.bg ({SOURCE_DATE}). Източник: {r['source_url']}. Категория там: {r['bansko_bg_terms']}."
    if r["email"]: notes += f" Имейл за връзка (не се публикува): {r['email']}."
    if len(phones) > 1: notes += " Други телефони: " + ", ".join(phones[1:]) + "."
    values.append({
        "src": r["slug"], "cat": r["our_category"], "name_bg": name_bg, "name_en": name_en, "slug_bg": slug_bg, "slug_en": slug_en,
        "desc_bg": t["description_bg"].strip(), "desc_en": t["description_en"].strip(), "alt_bg": t["image_alt_bg"].strip(), "alt_en": t["image_alt_en"].strip(),
        "address": address, "address_en": address_en, "lat": o.get("latitude"), "lng": o.get("longitude"),
        "phone": phones[0] if phones else None, "website": website, "facebook": r["facebook"] or None, "instagram": r["instagram"] or None,
        "email": r["email"].split(",")[0].strip() if r["email"] else None, "notes": notes,
    })

def val_row(v):
    return "(" + ", ".join([q(v["src"]), q(v["cat"]), q(v["name_bg"]), q(v["name_en"]), q(v["slug_bg"]), q(v["slug_en"]), q(v["desc_bg"]), q(v["desc_en"]), q(v["alt_bg"]), q(v["alt_en"]), q(v["address"]), q(v["address_en"]),
        "null" if v["lat"] is None else str(v["lat"]), "null" if v["lng"] is None else str(v["lng"]), q(v["phone"]), q(v["website"]), q(v["facebook"]), q(v["instagram"]), q(v["email"]), q(v["notes"])]) + ")"

sql = f"""-- Импорт на бизнес каталога на bansko.bg в Bansko NOW ({SOURCE_DATE}). Идемпотентен: съществуващ slug се пропуска.
-- Генериран от build_import.py; не влиза в Git (има имейли за връзка в admin_notes/business_contacts).
begin;
create temp table import_rows (
  src text, cat text, name_bg text, name_en text, slug_bg text, slug_en text, desc_bg text, desc_en text, alt_bg text, alt_en text,
  address text, address_en text, lat float8, lng float8, phone text, website text, facebook text, instagram text, email text, notes text
) on commit drop;
insert into import_rows values
{",\n".join(val_row(v) for v in values)};

-- само редове, чийто slug още го няма (нито като бизнес, нито като превод)
create temp table import_new on commit drop as
  select r.*, gen_random_uuid() as id, c.id as category_id
  from import_rows r
  join public.business_categories c on c.slug = r.cat
  where not exists (select 1 from public.businesses b where b.slug = r.slug_bg)
    and not exists (select 1 from public.business_translations t where t.slug in (r.slug_bg, r.slug_en));

insert into public.businesses (id, name, slug, category, category_id, description, address, latitude, longitude, website_url, facebook_url, instagram_url, phone, email_public,
  images, faqs, features, status, listing_tier, payment_status, priority, show_on_illustrated_map, requested_services, admin_notes, robots_index, robots_follow, schema_type)
select id, name_bg, slug_bg, (select name from public.business_category_translations where category_id = n.category_id and locale = 'bg'), category_id, desc_bg, address, lat, lng,
  website, facebook, instagram, phone, null,
  '{{}}', '[]', '{{}}', 'approved', 'free', 'unpaid', 100, false, '{{}}', notes, true, true, 'LocalBusiness'
from import_new n;

insert into public.business_translations (business_id, locale, slug, name, category, description, address, image_alt, faqs, features, schema_type)
select id, 'bg', slug_bg, name_bg, (select name from public.business_category_translations where category_id = n.category_id and locale = 'bg'), desc_bg, address, alt_bg, '[]', '{{}}', 'LocalBusiness' from import_new n
union all
select id, 'en', slug_en, name_en, (select name from public.business_category_translations where category_id = n.category_id and locale = 'en'), desc_en, address_en, alt_en, '[]', '{{}}', 'LocalBusiness' from import_new n;

insert into public.business_contacts (business_id, owner_name, owner_phone, owner_email)
select id, name_bg, phone, email from import_new where email is not null;

select count(*) as inserted from import_new;
commit;
"""
open(f"{BASE}/import-bansko-bg.sql", "w", encoding="utf-8").write(sql)
print(f"rows {len(rows)}, with texts {len(values)}, missing texts {len(missing_text)}: {missing_text[:5]}")
print("categories:", Counter(v["cat"] for v in values).most_common())
print("phones:", sum(1 for v in values if v["phone"]), "websites:", sum(1 for v in values if v["website"]), "coords:", sum(1 for v in values if v["lat"]))
