#!/usr/bin/env node
/**
 * Изпълнява SQL срещу базата на Bansko NOW през Supabase Management API, когато
 * конекторът (MCP) не е на разположение - например докато собственикът работи
 * паралелно по друг проект.
 *
 * Трябва му личен токен за достъп (supabase.com/dashboard/account/tokens),
 * записан в .env.local като SUPABASE_ACCESS_TOKEN=sbp_... Файлът .env.local не
 * влиза в Git. Токенът никога не се печата. Проектът е закован в кода, за да не
 * отиде заявка в базата на приложението за заявки по погрешка.
 *
 *   node scripts/supabase-sql.mjs --sql "select 1"
 *   node scripts/supabase-sql.mjs --file supabase/migrations/<файл>.sql
 *   node scripts/supabase-sql.mjs --migration <име> --file supabase/migrations/<файл>.sql
 *   node scripts/supabase-sql.mjs --auth-config                 (чете настройките на Auth)
 *   node scripts/supabase-sql.mjs --auth-config disable_signup=true
 *   node scripts/supabase-sql.mjs --advisors                    (съветникът по сигурността)
 *
 * С --migration заявката се записва и в историята на миграциите, със същото
 * <име> като файла (без датата отпред), както го прави apply_migration.
 */
import { readFileSync } from "node:fs";

const projectRef = "rzjyawjdhcedddydmfge"; // Bansko NOW. НЕ iofvptxecyxpqaozjtfm (приложението за заявки).
const api = `https://api.supabase.com/v1/projects/${projectRef}`;

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

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? "");
}

const token = readToken();

if (!token) {
  console.error("Липсва SUPABASE_ACCESS_TOKEN в .env.local (supabase.com/dashboard/account/tokens).");
  process.exit(2);
}

async function call(path, method, body) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();

  if (!response.ok) {
    console.error(`Грешка ${response.status}: ${text.slice(0, 600)}`);
    process.exit(1);
  }

  return text ? JSON.parse(text) : null;
}

if (process.argv.includes("--auth-config")) {
  const change = argument("--auth-config");

  if (change && change.includes("=")) {
    const [key, raw] = change.split("=");
    const value = raw === "true" ? true : raw === "false" ? false : /^\d+$/.test(raw) ? Number(raw) : raw;
    await call("/config/auth", "PATCH", { [key]: value });
    console.log(`Записано: ${key} = ${raw}`);
  }

  const config = await call("/config/auth", "GET");
  /* Само безопасните за показване настройки - никакви ключове и тайни. */
  console.log(JSON.stringify({ disable_signup: config.disable_signup, password_min_length: config.password_min_length, password_hibp_enabled: config.password_hibp_enabled }, null, 2));
  process.exit(0);
}

if (process.argv.includes("--advisors")) {
  /* Съветникът по сигурността: само име, ниво и за какво се отнася. */
  const report = await call("/advisors/security", "GET");
  for (const lint of report.lints ?? []) {
    console.log(`${lint.level}  ${lint.name}  ${lint.detail ?? ""}`);
  }
  console.log(`Общо: ${(report.lints ?? []).length}`);
  process.exit(0);
}

const file = argument("--file");
const query = file ? readFileSync(file, "utf8") : argument("--sql");

if (!query) {
  console.error('Подай --sql "..." или --file <път>.');
  process.exit(2);
}

const migration = argument("--migration");
const result = migration ? await call("/database/migrations", "POST", { name: migration, query }) : await call("/database/query", "POST", { query });

console.log(migration ? `Миграцията „${migration}“ е приложена.` : JSON.stringify(result, null, 2));
