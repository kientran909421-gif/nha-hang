export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isMasterEmail(email: string) {
  const masterEmail = process.env.MASTER_EMAIL;
  return Boolean(masterEmail && normalizeEmail(email) === normalizeEmail(masterEmail));
}
