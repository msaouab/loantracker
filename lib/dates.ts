const DATE_PARAM_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function buildLocalDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0
) {
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }

  return date;
}

export function parseDateParam(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(DATE_PARAM_PATTERN);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match.map(Number);
  return buildLocalDate(year, month, day);
}

export function formatDateParam(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateParam() {
  return formatDateParam(new Date());
}

export function dateParamToIso(value: string) {
  return parseDateParam(value)?.toISOString() ?? new Date().toISOString();
}

export function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function isDayBeforeMin(date: Date, min?: string) {
  const minDate = min ? parseDateParam(min) : null;
  if (!minDate) {
    return false;
  }

  return startOfDay(date) < startOfDay(minDate);
}

export function isDayAfterMax(date: Date, max?: string) {
  const maxDate = max ? parseDateParam(max) : null;
  if (!maxDate) {
    return false;
  }

  return startOfDay(date) > startOfDay(maxDate);
}
