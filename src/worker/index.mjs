import { pathToFileURL } from 'node:url';
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

// import.meta.url encodes spaces, '#' and '%' while process.argv[1] is a
// filesystem path. Compare canonical file URLs so direct CLI execution never
// exits silently in special-character installation paths.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWorker();
}
