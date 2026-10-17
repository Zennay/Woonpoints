export const HUMAN_ACTION_REASONS = Object.freeze([
  'expired_login',
  'mfa',
  'captcha',
  'viewing_invitation',
  'housing_offer'
]);

export function isDryRunEnabled(env = process.env) {
  return String(env.BOT_DRY_RUN ?? '').toLowerCase() === 'true';
}

export function assertDryRun(env = process.env) {
  if (!isDryRunEnabled(env)) {
    throw new Error(
      'Live WoningNet execution is disabled in the current baseline. Set BOT_DRY_RUN=true.'
    );
  }
}

export function assertAuthorizedAccount(account, now = new Date()) {
  // Prisma DateTime is a native Date. Arbitrary strings/flags are not proof
  // of consent; malformed or future timestamps must never enable execution.
  const granted = account?.authorizationGrantedAt;
  const grantedAt = granted instanceof Date ? granted.getTime() : NaN;
  const checkedAt = now instanceof Date ? now.getTime() : NaN;
  if (!Number.isFinite(grantedAt) || !Number.isFinite(checkedAt) || grantedAt > checkedAt) {
    throw new Error('Account owner authorization is required before worker execution.');
  }

  // Account-level human stops override even previously valid consent.
  // Unknown/empty pause reasons fail closed instead of being ignored.
  if (account.pausedReason !== null && account.pausedReason !== undefined) {
    throw new Error('Account paused for human review before worker execution.');
  }
}

export function shouldPauseForHuman(reason) {
  return HUMAN_ACTION_REASONS.includes(reason);
}
