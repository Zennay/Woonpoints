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
  // A Prisma consent timestamp is an OWN DATA field of the account row.
  // Inherited properties and computed getters cannot be evidence of owner
  // authorization; do not execute arbitrary getters while evaluating it.
  let descriptor;
  try {
    descriptor = account == null ? undefined
      : Object.getOwnPropertyDescriptor(account, 'authorizationGrantedAt');
  } catch {
    descriptor = undefined;
  }
  const granted = descriptor && Object.hasOwn(descriptor, 'value')
    ? descriptor.value : undefined;
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
  // Trust only an own, stored pause state: an accessor (even if it returns
  // null) or inherited value cannot prove that no human stop is pending.
  let confirmedUnpaused = false;
  try {
    const pause = Object.getOwnPropertyDescriptor(account, 'pausedReason');
    // Prisma's nullable String field is always present on a full account
    // projection. Missing/undefined means pause state was not loaded, not
    // affirmative proof that a human stop has been cleared.
    confirmedUnpaused = Boolean(pause && Object.hasOwn(pause, 'value')
      && pause.value === null);
  } catch {
    confirmedUnpaused = false;
  }
  if (!confirmedUnpaused) {
    throw new Error('Account paused for human review before worker execution.');
  }
}

// An unknown new provider/challenge status is not affirmative evidence that
// it is safe to continue. Only the explicitly reviewed neutral listing state
// may avoid the human-stop branch. Do not coerce objects, invoke getters, or
// accept padded/case-mutated aliases for a state that controls execution.
export function shouldPauseForHuman(reason) {
  return reason !== 'normal_listing';
}
