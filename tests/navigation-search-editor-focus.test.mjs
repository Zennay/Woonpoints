import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
// Execute the actual component shortcut policy in isolation, not a reimplementation.
const opening = 'function onShortcut(event:KeyboardEvent){';
const start = source.indexOf(opening);
const end = source.indexOf("window.addEventListener('keydown',onShortcut);",start);
assert.ok(start >= 0 && end > start);
const body = source.slice(start + opening.length, end);
assert.ok(body.endsWith('    }\n    '));

function runShortcut({target, key='k', ctrlKey=true, metaKey=false,
                      composing=false}={}) {
  let focused=0, selected=0, prevented=0;
  class Element {
    constructor(kind, parent=false) {
      this.kind=kind;
      this.parent=parent;
    }
    closest(selector) {
      assert.match(selector,/textarea/);
      return ['input','textarea','select','contenteditable','textbox','editor'].includes(this.kind)||this.parent?this:null;
    }
  }
  const search=new Element('search');
  const event={
    target: target===undefined?new Element('ordinary'):target==='search'?search:
      new Element(target),
    key,ctrlKey,metaKey,altKey:false,shiftKey:false,isComposing:composing,
    preventDefault(){prevented++;}
  };
  const sandbox={navSearchRef:{current:search},Element,};
  search.focus=()=>focused++;
  search.select=()=>selected++;
  vm.runInNewContext('('+opening.replace(':KeyboardEvent','')+body+')',sandbox)(event);
  return {focused,selected,prevented};
}

test('global navigation shortcut is available from non-editing content',()=>{
  assert.deepEqual(runShortcut(),{focused:1,selected:1,prevented:1});
  assert.deepEqual(runShortcut({ctrlKey:false,metaKey:true}),{focused:1,selected:1,prevented:1});
  assert.deepEqual(runShortcut({target:'search'}),{focused:1,selected:1,prevented:1});
});
test('editing private text, form fields and IME never steals focus',()=>{
  for (const kind of ['editor','input','textarea','select','contenteditable','textbox']) {
    // All editing forms are recognized by their closest editor ancestor.
    assert.deepEqual(runShortcut({target:kind}),{focused:0,selected:0,prevented:0});
  }
  assert.deepEqual(runShortcut({composing:true}),{focused:0,selected:0,prevented:0});
  assert.deepEqual(runShortcut({key:'x'}),{focused:0,selected:0,prevented:0});
});
