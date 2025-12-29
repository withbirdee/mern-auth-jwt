export function thirtyDaysFromNow() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export function oneYearFromNow() {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
}

export function oneHourFromNow() {
  return new Date(Date.now() + 60 * 60 * 1000);
}
