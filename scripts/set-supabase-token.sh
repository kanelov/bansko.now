#!/usr/bin/env bash
# Записва личния Supabase токен в .env.local, без да минава през чата.
# На Mac отваря обикновен прозорец с поле за парола (виждат се точки); другаде
# пита в терминала със скрито въвеждане. Пуска се така:
#   bash scripts/set-supabase-token.sh
# Токенът се взема от supabase.com/dashboard/account/tokens („Generate new token“).
# .env.local не влиза в Git. Старата стойност, ако има такава, се заменя.
set -euo pipefail

cd "$(dirname "$0")/.."
file=".env.local"
touch "$file"

token=""

if command -v osascript >/dev/null 2>&1; then
  token="$(osascript <<'APPLESCRIPT' 2>/dev/null || true
tell application "System Events"
  activate
  set answer to display dialog "Постави Supabase токена (започва със sbp_) и натисни „Запиши“." & return & return & "Взема се от supabase.com/dashboard/account/tokens → Generate new token." default answer "" with hidden answer buttons {"Отказ", "Запиши"} default button "Запиши" with title "Bansko NOW – Supabase токен"
  return text returned of answer
end tell
APPLESCRIPT
)"
else
  echo "Постави токена и натисни Enter (няма да се вижда, докато го поставяш):"
  read -rs token
  echo
fi

token="$(printf '%s' "$token" | tr -d '[:space:]')"

if [[ -z "$token" ]]; then
  echo "Отказано – нищо не е записано."
  exit 1
fi

if [[ ! "$token" =~ ^sbp_[A-Za-z0-9_]{20,}$ ]]; then
  echo "Това не прилича на Supabase токен (започва със sbp_). Нищо не е записано. Пусни пак."
  exit 1
fi

tmp="$(mktemp)"
grep -v '^SUPABASE_ACCESS_TOKEN=' "$file" > "$tmp" || true
# Файлът да свършва с нов ред, преди да добавим нашия.
if [[ -s "$tmp" && "$(tail -c1 "$tmp" | wc -l | tr -d ' ')" == "0" ]]; then echo >> "$tmp"; fi
printf 'SUPABASE_ACCESS_TOKEN=%s\n' "$token" >> "$tmp"
mv "$tmp" "$file"
chmod 600 "$file"
unset token

echo "Записано в .env.local. Върни се в чата и напиши: продължи"
