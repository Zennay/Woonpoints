// Release-evidence quality gate for Woonpoints CI. The existing integration
// job checks the GitHub PR merge result; source-head must additionally test
// the exact author commit or a green PR can be falsely cited as head proof.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const yml=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');

const evidence={
  separate_head_job: /\n  source-head:\s*\n/.test(yml),
  exact_pr_ref: /ref:\s*\$\{\{\s*github\.event\.pull_request\.head\.sha\s*\|\|\s*github\.sha\s*\}\}/.test(yml),
  checked_out_sha: /test\s+"\$\(git rev-parse HEAD\)"\s*=\s*"\$EXPECTED_SHA"/.test(yml),
  scoped_permissions: /permissions:\s*\n\s+contents:\s+read/.test(yml),
  credentials_disabled: /persist-credentials:\s*false/.test(yml),
  merge_integration_preserved: /\n  test:\s*\n[\s\S]*?npm run typecheck[\s\S]*?npm test/.test(yml)
};
for(const [label,ok]of Object.entries(evidence)){
  assert.equal(ok,true,
    'Woonpoints CI is missing trustworthy '+label.replaceAll('_',' ')+' proof');
}
console.log('PASS CI keeps merge integration AND immutable exact PR-head source proof');
