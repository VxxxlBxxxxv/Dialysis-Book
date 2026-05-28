import { BloodPressure } from "../types";

export const NO_DATA = "—";

// Реальные веса/давления всегда > 0. И null (новые пустые поля), и 0
// (старые сеансы, где пустое сохранялось как 0) считаем «нет данных».
export function hasValue(x: number | null | undefined): x is number {
  return x != null && x > 0;
}

export function formatKg(x: number | null | undefined): string {
  return hasValue(x) ? `${x} кг` : NO_DATA;
}

export function formatBP(bp: BloodPressure | undefined): string {
  if (!bp || !hasValue(bp.systolic) || !hasValue(bp.diastolic)) return NO_DATA;
  return `${bp.systolic}/${bp.diastolic}`;
}

// Разбор давления из одного поля «XXX/XX» (F3). Терпим к пробелам и тире как
// разделителю; пустые части → null, чтобы пустое поле не превращалось в 0 (F4).
export function parseBP(input: string): BloodPressure {
  const [sysRaw = "", diaRaw = ""] = input.trim().split(/[\/\s-]+/);
  const toNum = (raw: string): number | null => {
    const v = raw.trim();
    if (v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };
  return { systolic: toNum(sysRaw), diastolic: toNum(diaRaw) };
}

// Обратно: {systolic, diastolic} → строка «120/80» для поля ввода при редактировании.
export function bpToString(bp: BloodPressure | undefined): string {
  if (!bp) return "";
  const sys = hasValue(bp.systolic) ? String(bp.systolic) : "";
  const dia = hasValue(bp.diastolic) ? String(bp.diastolic) : "";
  if (sys === "" && dia === "") return "";
  return `${sys}/${dia}`;
}

// УФ (слито жидкости) = вес до − вес после. Считаем только когда оба веса есть,
// иначе вернёт null → отображаем «—» вместо мусора (F4: 50.3 − 0 = 50.3).
export function fluidRemoved(
  weightBefore: number | null | undefined,
  weightAfter: number | null | undefined
): number | null {
  if (!hasValue(weightBefore) || !hasValue(weightAfter)) return null;
  return weightBefore - weightAfter;
}
