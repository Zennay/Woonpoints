import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.mjs';

const policy = new Map((await config.headers()).flatMap(({source, headers}) => {
  assert.equal(source, '/:path*', 'cover all first-party dashboard and API paths');
  return headers.map(({key, value}) => [key.toLowerCase(), value]);
}));

test('first-party dashboard response policy prevents embedding and MIME sniffing', () => {
  assert.equal(policy.get('x-frame-options'), 'DENY');
  assert.equal(policy.get('x-content-type-options'), 'nosniff');
});

test('dashboard does not send navigation referrers or use speculative DNS lookups', () => {
  assert.equal(policy.get('referrer-policy'), 'no-referrer');
  assert.equal(policy.get('x-dns-prefetch-control'), 'off');
});

test('unimplemented browser hardware and payments stay disabled', () => {
  const p = policy.get('permissions-policy') || '';
  for (const capability of ['camera', 'microphone', 'geolocation', 'payment']) {
    assert.match(p, new RegExp('(?:^|,\\s*)' + capability + '=\\(\\)(?:,|$)'));
  }
});

test('source response policy has unique, bounded keys and no speculative HTTPS/CSP claims', () => {
  assert.equal(policy.size, 5, 'do not silently override conflicting header values');
  for (const [key, value] of policy) {
    assert.match(key, /^[a-z-]{1,64}$/);
    assert.ok(value.length <= 256);
  }
  assert.equal(policy.has('strict-transport-security'), false,
    'HTTPS and HSTS need an independently verified production TLS boundary');
  assert.equal(policy.has('content-security-policy'), false,
    'Next inline/hydration policies require a separate nonce-based integration');
});
