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

export function launchDatabaseCommand(command, args, env = process.env) {
  if (typeof command !== 'string' || !command || !Array.isArray(args)) {
    throw new Error('A command is required.');
  }
  const databaseUrl = composeDatabaseUrl(env.WOONPOINTS_DB_PASSWORD);
  // The child needs the canonical DATABASE_URL, not a second copy of the
  // original operator secret. Avoid unnecessarily widening its exposure.
  const childEnv = { ...env, DATABASE_URL: databaseUrl };
  delete childEnv.WOONPOINTS_DB_PASSWORD;
  const child = spawn(command, args, {
    env: childEnv,
    stdio: 'inherit',
    shell: false,
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!child.killed) child.kill(signal);
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
