/**
 * Compose-only, source-of-truth PostgreSQL URL launcher.
 * Never prints passwords or URLs; never shells out or reads local secrets.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { constants } from 'node:os';
import { pathToFileURL } from 'node:url';

export function composeDatabaseUrl(password) {
  if (typeof password !== 'string' || !password || password.includes('\0')) {
    throw new Error('A non-empty operator database password is required.');
  }
  const url = new URL('postgresql://woonpoints@db:5432/woonpoints?schema=public');
  // URL.password's setter preserves literal percent signs: pre-encode once,
  // including % itself, so credentials cannot change URI authority/query.
  url.password = encodeURIComponent(password);
  return url.href;
}

// Construct the child's launch environment from one inert descriptor
// snapshot. Object spread and direct env.secret access execute accessors;
// a caller-controlled or incomplete environment is not operator proof.
// The actual Compose/process.env environment contains own string fields.
export function prepareChildEnvironment(env = process.env) {
  let fields;
  try {
    if (env === null || typeof env !== 'object') {
      throw new TypeError('environment is not an object');
    }
    fields = Object.getOwnPropertyDescriptors(env);
  } catch {
    throw new Error('Invalid database environment.');
  }

  const password = Object.getOwnPropertyDescriptor(fields, 'WOONPOINTS_DB_PASSWORD')?.value;
  if (!password || !password.enumerable || !Object.hasOwn(password, 'value') || typeof password.value !== 'string') {
    throw new Error('Invalid database environment.');
  }
  // Validate the operator value before returning any candidate child fields.
  const databaseUrl = composeDatabaseUrl(password.value);
  const child = Object.create(null);
  for (const [key, descriptor] of Object.entries(fields)) {
    // Drop the original raw secret and any inherited/stale DATABASE_URL.
    // In particular, do not invoke an existing DATABASE_URL getter.
    if (key === 'WOONPOINTS_DB_PASSWORD' || key === 'DATABASE_URL') continue;
    // Preserve object-spread's own-*enumerable* field policy. Hidden metadata
    // must not be promoted into the process environment of app/worker.
    if (!descriptor.enumerable) continue;
    if (!Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'string') {
      throw new Error('Invalid database environment.');
    }
    child[key] = descriptor.value;
  }
  child.DATABASE_URL = databaseUrl;
  return child;
}

export function launchDatabaseCommand(command, args, env = process.env) {
  if (typeof command !== 'string' || !command || !Array.isArray(args)) {
    throw new Error('A command is required.');
  }
  // Admission is completed before spawn or signal-handler registration.
  const childEnv = prepareChildEnvironment(env);
  // npm run start/worker can spawn another Node process. On POSIX create
  // a private process group so supervisor signals reach descendants as well
  // as npm. Never signal the launcher's own process group.
  const groupSignals = process.platform !== 'win32';
  const child = spawn(command, args, {
    env: childEnv,
    stdio: 'inherit',
    shell: false,
    detached: groupSignals,
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!groupSignals || !Number.isSafeInteger(child.pid) || child.pid <= 1) {
        if (!child.killed) child.kill(signal);
        return;
      }
      try {
        // Negative PID is the group ID of this detached child, never an
        // arbitrary operator PID or the VPS host's process group.
        process.kill(-child.pid, signal);
      } catch (error) {
        // The group may have exited already. On a permissions error retain
        // the original direct-child fallback; do not log credentials.
        if (error?.code !== 'ESRCH' && !child.killed) child.kill(signal);
      }
    });
  }
  child.on('error', () => {
    process.stderr.write('Woonpoints service could not start.\n');
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    // Preserve the *actual* POSIX signal. Mapping all non-SIGINT signals
    // to SIGTERM falsely reports SIGKILL/OOM (137) as graceful stop (143).
    const signalNumber = typeof signal === 'string' ? constants.signals[signal] : undefined;
    process.exitCode = typeof code === 'number' ? code
      : Number.isInteger(signalNumber) && signalNumber > 0 ? 128 + signalNumber : 1;
  });
  return child;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    launchDatabaseCommand(process.argv[2], process.argv.slice(3));
  } catch {
    process.stderr.write('Woonpoints service database configuration is invalid.\n');
    process.exitCode = 2;
  }
}
