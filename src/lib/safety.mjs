export const HUMAN_ACTION_REASONS = Object.freeze([
  'expired_login',
  'mfa',
  'captcha',
  'viewing_invitation',
  'housing_offer'
]);

export function isDryRunEnabled(env = process.env) {
  // process.env values are primitive strings. Never coerce caller-provided
  // objects/arrays through toString() into an execution-policy admission.
  if (env == null) {
    return false;
  }
  // Never evaluate an untrusted accessor when deciding whether a worker is
  // confined to dry-run. process.env exposes its values as own data fields;
  // prototypes and accessor properties are not operator proof.
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(env, 'BOT_DRY_RUN');
  } catch {
    return false;
  }
  const value = descriptor && Object.hasOwn(descriptor, 'value')
    ? descriptor.value : undefined;
  return typeof value === 'string' && value.toLowerCase() === 'true';
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
  // A Date instance can shadow its getTime method. Authenticate the native
  // internal Date value instead of trusting instance-overridden methods.
  // In particular, an actual *future* consent may not claim an older value.
  let grantedAt = NaN;
  let checkedAt = NaN;
  try {
    grantedAt = granted instanceof Date ? Date.prototype.getTime.call(granted) : NaN;
    checkedAt = now instanceof Date ? Date.prototype.getTime.call(now) : NaN;
  } catch {
    // A Proxy around a Date passes instanceof but has no Date internal
    // slot. Normalize the failure to the existing policy rejection rather
    // than leaking a runtime TypeError to an operator.
  }
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
