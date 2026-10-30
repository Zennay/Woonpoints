import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const dockerfile = text('Dockerfile');
const compose = text('docker-compose.yml');
const workflow = text('.github/workflows/qa-production-app-container.yml');

test('app stage performs a real production build and starts next start, never dev', () => {
  assert.match(dockerfile, /^FROM base AS app\nRUN npm run build$/m);
  assert.match(dockerfile, /^USER node\nEXPOSE 3000\nCMD \["npm", "run", "start"\]$/m);
  assert.doesNotMatch(dockerfile, /^CMD \["npm", "run", "dev"\]$/m);
  assert.match(dockerfile, /^FROM base AS worker\nUSER node\nCMD \["npm", "run", "worker"\]$/m);
  assert.match(dockerfile, /^FROM node:20-alpine@sha256:[0-9a-f]{64} AS base$/m);
});

test('Compose app uses the built image through the private-URL launcher, not a dev server', () => {
  const app = compose.split('\n  app:\n')[1]?.split('\n  worker:\n')[0] || '';
  assert.match(app, /command: \["node", "src\/lib\/db-url-launcher\.mjs", "npm", "run", "start"\]/);
  assert.doesNotMatch(app, /"dev"/);
  assert.match(app, /^      DATABASE_URL: ""$/m);
  assert.match(app, /^      - "127\.0\.0\.1:3000:3000"$/m);
  assert.match(compose, /command: \["node", "src\/lib\/db-url-launcher\.mjs", "npm", "run", "worker"\]/);
});

test('self-hosted Docker production smoke is immutable, private and does not deploy', () => {
  assert.match(workflow, /runs-on: \[self-hosted, portfolio-pool, vps\]/);
  assert.doesNotMatch(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /github\.event\.pull_request\.head\.sha \|\| github\.sha/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /XDG_RUNTIME_DIR: .*woonpoints-rootless-oci/);
  assert.match(workflow, /podman --cgroup-manager=cgroupfs info .*Rootless/);
  assert.match(workflow, /test "\$\(id -u\)" -ne 0/);
  assert.doesNotMatch(workflow, /\/var\/run\/docker\.sock|sudo docker/);
  assert.match(workflow, /podman --cgroup-manager=cgroupfs build --target app/);
  assert.match(workflow, /podman --cgroup-manager=cgroupfs run --network none/);
  assert.match(workflow, /podman --cgroup-manager=cgroupfs exec/);
  assert.match(workflow, /x-frame-options/);
  assert.match(workflow, /referrer-policy/);
  assert.doesNotMatch(workflow, /docker (?:push|compose up)|kubectl|ssh |secrets\./);
});
