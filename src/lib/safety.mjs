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

export function assertAuthorizedAccount(account) {
  if (!account?.authorizationGrantedAt) {
    throw new Error('Account owner authorization is required before worker execution.');
  }
}

export function shouldPauseForHuman(reason) {
  return HUMAN_ACTION_REASONS.includes(reason);
}
