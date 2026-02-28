import i18n from "../i18n";

/** Parses YYYY-MM-DD string as local date (avoids UTC midnight timezone shift) */
export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function formatReminderDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  if (isToday) return `${i18n.t("dateUtils.today")} ${time}`;
  if (isTomorrow) return `${i18n.t("dateUtils.tomorrow")} ${time}`;

  const day = date.getDate();
  const month = i18n.t(`months.${MONTH_KEYS[date.getMonth()]}`);
  return `${day} ${month} ${time}`;
}

export function isReminderPast(date: Date | string): boolean {
  return new Date(date).getTime() <= Date.now();
}

export function combineDateAndTime(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

export function formatDateShort(date: Date): string {
  const day = date.getDate();
  const month = i18n.t(`months.${MONTH_KEYS[date.getMonth()]}`);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Converts Date to YYYY-MM-DD string */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Converts Date to HH:mm string */
export function toTimeStr(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

/** Default date for pickers: 1 hour from now */
export function getDefaultDate(): Date {
  return new Date(Date.now() + 3600000);
}

/** Default time for pickers: 30 minutes from now */
export function getDefaultTime(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d;
}

/** Parses dateStr (YYYY-MM-DD) + timeStr (HH:mm) into local Date */
export function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = parseDateLocal(dateStr);
  d.setHours(h ?? 9, m ?? 0, 0, 0);
  return d;
}
