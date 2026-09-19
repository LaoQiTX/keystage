const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadPresets,validatePresets}=require('../extension/presets');
const {managerHtml}=require('../extension/manager');
test('migrates legacy data only into first slot',()=>{
  const presets=loadPresets({get:key=>key==='preset'?'old code':undefined});
  assert.equal(presets.length,10);assert.equal(presets[0].text,'old code');
  assert.ok(presets.slice(1).every(p=>p.text===''));
});
test('saved presets override legacy, normalize names and line endings',()=>{
  const items=Array.from({length:10},()=>({name:'  ',text:'a\r\nb\r'}));
  const presets=loadPresets({get:key=>key==='presetsV2'?items:'legacy'});
  assert.equal(presets[9].name,'预设 10');assert.equal(presets[0].text,'a\nb\n');
  assert.equal(items[0].text,'a\r\nb\r');
});
test('rejects malformed webview payloads',()=>{
  for(const value of [undefined,{},[],Array(10).fill({name:'x',text:3})]) assert.equal(validatePresets(value),null);
});
test('all ten shortcut commands are declared exactly once',()=>{
  const pkg=require('../extension/package.json');
  for(let i=1;i<=10;i++){
    const command='codeDemo.preset'+i;
    assert.equal(pkg.contributes.commands.filter(c=>c.command===command).length,1);
    const binding=pkg.contributes.keybindings.find(b=>b.command===command);
    assert.equal(binding.key,'ctrl+alt+'+(i===10?0:i));
    assert.equal(binding.when,'editorTextFocus');
  }
});
test('manager uses restrictive CSP and valid generated JavaScript',()=>{
  const html=managerHtml('test-nonce');
  assert.ok(html.includes("default-src 'none'"));
  const script=html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)[1];
  new (require('node:vm').Script)(script);
  assert.ok(!html.includes('innerHTML'));
});
