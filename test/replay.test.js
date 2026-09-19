const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Replay, chunk } = require('../extension/replay');

test('Python whitespace, blank lines and unicode round trip', () => {
  const code = 'def run():\r\n    x = "\u4e2d\ud83d\ude00"\r\n\r\n    return x\r\n';
  let remaining = code, output = '';
  while (remaining) { const part = chunk(remaining); output += part; remaining = remaining.slice(part.length); }
  assert.equal(output, code);
  assert.equal(chunk('\n    return'), '\n    r');
});
test('consecutive backspaces replay in original order', () => {
  const replay = new Replay();
  replay.change(5, 'c', ''); replay.change(4, 'b', ''); replay.change(3, 'a', '');
  assert.equal(replay.peek(3).text, 'abc');
});
test('consecutive forward deletes replay in original order', () => {
  const replay = new Replay();
  replay.change(3, 'a', ''); replay.change(3, 'b', '');
  assert.equal(replay.peek(3).text, 'ab');
});
test('selected multiline deletion and repeated restore', () => {
  const replay = new Replay(), code = '\r\n    return 1';
  replay.change(6, code, '');
  let output = '', offset = 6;
  while (replay.peek(offset)) {
    const gap = replay.peek(offset), part = chunk(gap.text);
    replay.change(offset, '', part); replay.consume(gap, part);
    output += part; offset += part.length;
  }
  assert.equal(output, code);
  assert.equal(replay.gaps.length, 0);
  replay.change(6, code, ''); assert.equal(replay.peek(6).text, code);
});
test('deletion surrounding an earlier gap restores original order', () => {
  const replay = new Replay();
  replay.change(2, 'c', ''); replay.change(0, 'abde', '');
  assert.equal(replay.peek(0).text, 'abcde');
});
test('unrelated edits move deletion anchors', () => {
  const replay = new Replay();
  replay.change(10, 'test', ''); replay.change(0, '', 'abc');
  assert.equal(replay.peek(13).text, 'test');
});
