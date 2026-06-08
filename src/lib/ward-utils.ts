export type WardLike = {
  id: string;
  number?: number | string | null;
  ward_number?: number | string | null;
  name_ta?: string | null;
  ward_name_ta?: string | null;
  name?: string | null;
};

export type AreaPocLike = {
  id?: string | null;
  ward_id?: string | null;
  ward_number?: number | string | null;
  area_name?: string | null;
  name?: string | null;
  wards?: WardLike | null;
};

export function getWardNumber(ward: WardLike | null | undefined) {
  if (!ward) {
    return null;
  }

  const rawValue = ward.number ?? ward.ward_number;
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getWardNameTa(ward: WardLike | null | undefined) {
  if (!ward) {
    return null;
  }

  return ward.name_ta ?? ward.ward_name_ta ?? ward.name ?? null;
}

export function getAreaWardId(area: AreaPocLike | null | undefined) {
  if (!area) {
    return null;
  }

  return area.ward_id ?? area.wards?.id ?? null;
}

export function getAreaWardNumber(area: AreaPocLike | null | undefined) {
  if (!area) {
    return null;
  }

  const directValue = area.ward_number;
  if (directValue !== null && directValue !== undefined && directValue !== "") {
    const parsed = Number(directValue);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return getWardNumber(area.wards);
}

export function getAreaName(area: AreaPocLike | null | undefined) {
  if (!area) {
    return null;
  }

  return area.area_name ?? area.name ?? null;
}

export function matchesWardReference(
  reference: string | null | undefined,
  wardId: string,
  wardNumber: number | null,
) {
  if (!reference) {
    return false;
  }

  const normalizedReference = String(reference).trim();
  if (!normalizedReference) {
    return false;
  }

  if (normalizedReference === wardId) {
    return true;
  }

  if (wardNumber !== null && normalizedReference === String(wardNumber)) {
    return true;
  }

  const digits = normalizedReference.match(/\d+/)?.[0] ?? null;
  return wardNumber !== null && digits === String(wardNumber);
}
