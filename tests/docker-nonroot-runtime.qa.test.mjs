import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
const appFlow = readFileSync(new URL('../.github/workflows/qa-production-app-container.yml', import.meta.url), 'utf8');
const workerFlow = readFileSync(new URL('../.github/workflows/qa-locked-container-build.yml', import.meta.url), 'utf8');

function checkImage(source) {
  const app = source.split('FROM base AS app\n')[1]?.split('FROM base AS worker\n')[0] || '';
  const worker = source.split('FROM base AS worker\n')[1] || '';
  assert.match(app, /^RUN npm run build$/m, 'app must retain real Next build');
  assert.match(app, /^RUN chown -R node:node \/app\/\.next$/m,
    'Next cache remains writable by unprivileged runtime');
  assert.match(app, /^USER node$/m, 'app runtime must not run as root');
  assert.match(worker, /^USER node$/m, 'worker runtime must not run as root');
  assert.ok(app.indexOf('USER node') > app.indexOf('RUN chown -R node:node /app/.next'));
  for (const stage of [app, worker]) {
    assert.doesNotMatch(stage, /^(?:USER root|USER 0)(?:\s|$)/m);
    assert.doesNotMatch(stage.split('USER node\n')[1] || '', /^RUN /m,
      'no privileged build commands after setting nonroot runtime');
  }
}
test('both runtime targets explicitly drop to the built-in Alpine node user', () => checkImage(dockerfile));

test('root runtime overrides and missing cache ownership are rejected', () => {
  for (const altered of [
    dockerfile.replace('USER node', 'USER root'),
    dockerfile.replace('FROM base AS worker\nUSER node', 'FROM base AS worker\nUSER root'),
    dockerfile.replace('RUN chown -R node:node /app/.next\n', ''),
    dockerfile.replace('USER node\nEXPOSE 3000', 'EXPOSE 3000'),
    dockerfile.replace('FROM base AS worker\nUSER node\n', 'FROM base AS worker\n'),
  ]) {
    assert.throws(() => checkImage(altered));
  }
});

test('hosted Docker checks assert nonroot uid on real app and real worker images', () => {
  for (const workflow of [appFlow, workerFlow]) {
    assert.match(workflow, /runs-on: ubuntu-latest/);
    assert.match(workflow, /--network none/);
    assert.match(workflow, /process\.getuid\(\)/);
    assert.match(workflow, /\b1000\b/);
    assert.doesNotMatch(workflow, /docker push|docker compose up|ssh |secrets\./);
  }
});
