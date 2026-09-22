/*
 * Нова временна парола за акаунт в Bansko NOW (админ или собственик в портала),
 * когато старата е забравена. Пуска се САМО от собственика в неговия терминал -
 * паролата се показва веднъж на екрана и не минава през чат, файл или лог.
 *
 *   node scripts/reset-portal-password.mjs <имейл>
 *
 * Ползва същия личен токен като scripts/supabase-sql.mjs (SUPABASE_ACCESS_TOKEN
 * в .env.local) и записва bcrypt хеш направо в auth.users, както го прави
 * Supabase Auth. После паролата се сменя от „Парола“ в админа или в портала.
 */
import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";

const projectRef = "rzjyawjdhcedddydmfge"; // Bansko NOW. НЕ iofvptxecyxpqaozjtfm (приложението за заявки).
const email = (process.argv[2] ?? "").trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("Подай имейла на акаунта: node scripts/reset-portal-password.mjs <имейл>");
  process.exit(2);
}

function readToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  try {
    const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .find((row) => row.startsWith("SUPABASE_ACCESS_TOKEN="));
    return line ? line.slice(line.indexOf("=") + 1).trim().replace(/^"|"$/g, "") : "";
  } catch {
    return "";
  }
}

const token = readToken();
if (!token) {
  console.error("Липсва SUPABASE_ACCESS_TOKEN в .env.local (scripts/set-supabase-token.sh).");
  process.exit(2);
}

/* 16 знака без объркващи (0/O, 1/l/I): изпълнява минимума от 10 в Auth. */
const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const password = Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join("");

const query = `update auth.users
  set encrypted_password = extensions.crypt('${password}', extensions.gen_salt('bf', 10)), updated_at = now()
  where email = '${email.replace(/'/g, "''")}'
  returning id`;

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query })
});

if (!response.ok) {
  console.error(`Грешка ${response.status}: ${(await response.text()).slice(0, 400)}`);
  process.exit(1);
}

const rows = await response.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.error(`Няма акаунт с имейл ${email}.`);
  process.exit(1);
}

console.log(`Нова временна парола за ${email}:`);
console.log("");
console.log(`    ${password}`);
console.log("");
console.log("Влез с нея на bansko.now/business или bansko.now/admin и я смени от „Парола“. Не я пращай в чата.");
