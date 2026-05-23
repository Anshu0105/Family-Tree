export function getLifeLabel(details) {
  if (!details?.dob) return null;
  const dob = new Date(details.dob);
  if (Number.isNaN(dob.getTime())) return null;
  const birthYear = dob.getFullYear();

  if (details.dateOfDeath) {
    const dod = new Date(details.dateOfDeath);
    if (!Number.isNaN(dod.getTime())) {
      return `b. ${birthYear} – d. ${dod.getFullYear()}`;
    }
    return `b. ${birthYear}`;
  }

  const age = Math.floor(
    (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  if (age >= 0 && age < 150) return `b. ${birthYear} · age ${age}`;
  return `b. ${birthYear}`;
}

export function isDeceased(details) {
  return Boolean(details?.dateOfDeath);
}
