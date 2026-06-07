import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0) return;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[key]) process.env[key] = value;
  });
}

loadDotEnv(path.join(root, ".env"));
loadDotEnv(path.join(root, ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const wards = [
  { ward_number: 1, name_ta: "வார்டு 1", name_en: "Ward 1" },
  { ward_number: 2, name_ta: "வார்டு 2", name_en: "Ward 2" },
  { ward_number: 3, name_ta: "வார்டு 3", name_en: "Ward 3" },
];

const categories = [
  { name_ta: "சாலை", name_en: "Road", slug: "road" },
  { name_ta: "தண்ணீர்", name_en: "Water", slug: "water" },
  { name_ta: "மின்சாரம்", name_en: "Electricity", slug: "electricity" },
  { name_ta: "கழிவு மேலாண்மை", name_en: "Sanitation", slug: "sanitation" },
];

const announcements = [
  { title_ta: "தலைமை அலுவலக அறிவிப்பு", body_ta: "பொது புகார்கள் விரைவாக பதிவு செய்யப்படுகின்றன." },
  { title_ta: "பொதுமக்கள் சேவை", body_ta: "ஒவ்வொரு வார்டிலும் தொடர்பு புள்ளிகள் புதுப்பிக்கப்பட்டுள்ளன." },
];

const banners = [
  { title_ta: "TVK Vadavalli HQ", image_path: null, link_url: "/" },
  { title_ta: "Register a complaint", image_path: null, link_url: "/complaint/new" },
];

const pocs = [
  { ward_number: 1, name: "முகேஷ்", phone: "9000000001", area_name: "வடவள்ளி மேற்கு" },
  { ward_number: 2, name: "ரமேஷ்", phone: "9000000002", area_name: "வடவள்ளி மையம்" },
  { ward_number: 3, name: "சரவணன்", phone: "9000000003", area_name: "வடவள்ளி கிழக்கு" },
];

async function ensureRows(table, rows, conflictKey) {
  for (const row of rows) {
    await supabase.from(table).upsert(row, { onConflict: conflictKey, ignoreDuplicates: true });
  }
}

async function ensureAnnouncements(rows) {
  for (const row of rows) {
    const { data } = await supabase.from("announcements").select("id").eq("title_ta", row.title_ta).maybeSingle();
    if (!data) {
      await supabase.from("announcements").insert({ ...row, is_active: true, published_at: new Date().toISOString() });
    }
  }
}

async function ensureBanners(rows) {
  for (const row of rows) {
    const { data } = await supabase.from("banners").select("id").eq("title_ta", row.title_ta).maybeSingle();
    if (!data) {
      await supabase.from("banners").insert({ ...row, is_active: true });
    }
  }
}

async function main() {
  console.log("Seeding master data...");

  await ensureRows("wards", wards, "ward_number");
  await ensureRows("complaint_categories", categories, "slug");

  const { data: seededWards } = await supabase.from("wards").select("id,ward_number");
  const wardIdByNumber = new Map((seededWards ?? []).map((ward) => [ward.ward_number, ward.id]));

  for (const poc of pocs) {
    const wardId = wardIdByNumber.get(poc.ward_number);
    if (!wardId) continue;

    const { data } = await supabase
      .from("area_pocs")
      .select("id")
      .eq("ward_id", wardId)
      .eq("name", poc.name)
      .eq("area_name", poc.area_name)
      .maybeSingle();

    if (!data) {
      await supabase.from("area_pocs").insert({
        ward_id: wardId,
        name: poc.name,
        phone: poc.phone,
        area_name: poc.area_name,
        is_active: true,
      });
    }
  }

  await ensureAnnouncements(announcements);
  await ensureBanners(banners);

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
