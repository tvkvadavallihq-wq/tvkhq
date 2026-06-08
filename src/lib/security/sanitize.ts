export function sanitizeText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeSlug(value: string | null | undefined) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizePhone(value: string | null | undefined) {
  return sanitizeText(value).replace(/[^\d+]/g, "");
}

export function sanitizeEmail(value: string | null | undefined) {
  return sanitizeText(value).toLowerCase().replace(/\s+/g, "");
}

export function sanitizeUsername(value: string | null | undefined) {
  return sanitizeText(value).toLowerCase().replace(/\s+/g, "");
}

export function sanitizeSearchTerm(value: string | null | undefined) {
  return sanitizeText(value).slice(0, 120);
}
