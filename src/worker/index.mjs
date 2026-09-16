import { assertDryRun } from '../lib/safety.mjs';

export function runWorker(env = process.env) {
  assertDryRun(env);

  const event = {
    service: 'woonpoints-worker',
    mode: 'dry-run',
    status: 'ready',
    action: 'No live WoningNet reaction was attempted.'
  };

  console.log(JSON.stringify(event));
  return event;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorker();
}
