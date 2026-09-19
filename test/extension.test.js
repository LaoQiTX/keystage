const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

test('host simulation: middle insertion, queued typing, deletion replay and silent completion', async () => {
  const commands = new Map();
  let change;
  let value = 'before\n\nafter';
  const preset = 'def run():\n    return 1\n';
  const presets = Array.from({length:10}, (_,i) => ({name: 'Slot '+i, text: i === 0 ? preset : i === 1 ? 'SECOND' : i === 9 ? 'TENTH' : ''}));
  class Range { constructor(start, end) { this.start = start; this.end = end; } }
  class Selection extends Range { get isEmpty() { return this.start === this.end; } }
  const document = { uri: { scheme: 'file' }, eol: 1, getText: () => value, offsetAt: p => p, positionAt: p => p };
  const editor = {
    document, selection: new Selection(7, 7),
    get selections() { return [this.selection]; },
    revealRange() {},
    async edit(callback) {
      callback({ replace: (range, text) => {
        const length = range.end - range.start;
        value = value.slice(0, range.start) + text + value.slice(range.end);
        change({ document, contentChanges: [{ rangeOffset: range.start, rangeLength: length, text }] });
      } });
      return true;
    }
  };
  const disposable = () => ({ dispose() {} });
  let defaultCalls = 0;
  const api = {
    Selection, Range, EndOfLine: { CRLF: 2 },
    commands: {
      registerCommand(name, handler) { commands.set(name, handler); return disposable(); },
      async executeCommand(name) { if (name === 'default:type') defaultCalls++; }
    },
    window: { activeTextEditor: editor, onDidChangeActiveTextEditor: disposable },
    workspace: { onDidChangeTextDocument(fn) { change = fn; return disposable(); }, onDidCloseTextDocument: disposable }
  };
  const original = Module._load;
  Module._load = function(name, ...args) { return name === 'vscode' ? api : original.call(this, name, ...args); };
  try {
    require('../extension/extension').activate({ subscriptions: [], workspaceState: { get: key => key === 'presetsV2' ? presets : preset } });
  } finally { Module._load = original; }
  await commands.get('codeDemo.toggle')();
  await Promise.all(Array.from({ length: 50 }, () => commands.get('type')({ text: 'z' })));
  assert.equal(value, 'before\n' + preset + '\nafter');
  assert.equal(defaultCalls, 0);
  const start = 7, end = 7 + preset.length;
  value = value.slice(0, start) + value.slice(end);
  change({ document, contentChanges: [{ rangeOffset: start, rangeLength: end-start, text: '' }] });
  editor.selection = new Selection(start, start);
  for (let i = 0; i < 50; i++) await commands.get('type')({ text: 'q' });
  assert.equal(value, 'before\n' + preset + '\nafter');
  await commands.get('codeDemo.toggle')();
  await commands.get('type')({text: 'normal'});
  assert.equal(defaultCalls, 1);
  await commands.get('codeDemo.preset2')();
  for (let i=0;i<10;i++) await commands.get('type')({text:'x'});
  assert.equal(value, 'before\n'+preset+'SECOND\nafter');
  await commands.get('codeDemo.preset2')();
  for (let i=0;i<10;i++) await commands.get('type')({text:'x'});
  assert.equal(value, 'before\n'+preset+'SECONDSECOND\nafter');
  await commands.get('codeDemo.preset10')();
  for (let i=0;i<10;i++) await commands.get('type')({text:'x'});
  assert.equal(value, 'before\n'+preset+'SECONDSECONDTENTH\nafter');
  await commands.get('codeDemo.preset3')();
  await commands.get('type')({text:'x'});
  assert.equal(defaultCalls, 2);
});
