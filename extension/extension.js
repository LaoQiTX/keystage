const vscode = require('vscode');
const { randomBytes } = require('crypto');
const { Replay, chunk } = require('./replay');
const { loadPresets, validatePresets } = require('./presets');
const { managerHtml } = require('./manager');

function activate(context) {
  let presets = loadPresets(context.workspaceState);
  let selected = 0;
  let preset = presets[0].text;
  let cursor = 0;
  let session;
  let panel;
  let queue = Promise.resolve();
  const active = () => !!session?.running && vscode.window.activeTextEditor?.document === session.document;
  const refresh = () => vscode.commands.executeCommand('setContext', 'codeDemo.active', active());
  const enqueue = action => {
    queue = queue.then(action).catch(() => {
      if (session) session.running = false;
      return refresh();
    });
    return queue;
  };
  function bind(editor) {
    if (!editor || editor.document.uri.scheme === 'output') return;
    session = { document: editor.document, snapshot: editor.document.getText(), replay: new Replay(), running: true };
  }
  async function step(editor, current) {
    if (!editor || !current || session !== current || !current.running || editor.document !== current.document) return;
    if (editor.selections.length !== 1) return;
    const selection = editor.selection;
    const offset = editor.document.offsetAt(selection.start);
    const gap = selection.isEmpty && current.replay.peek(offset);
    const source = gap ? gap.text : preset.slice(cursor);
    let text = chunk(source);
    if (!text) return;
    const consumed = text.length;
    text = text.replace(/\r\n|\r|\n/g, editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n');
    const applied = await editor.edit(builder => builder.replace(selection, text), {
      undoStopBefore: true, undoStopAfter: true
    });
    if (!applied) return;
    if (gap) current.replay.consume(gap, source.slice(0, consumed));
    else cursor += consumed;
    const position = editor.document.positionAt(offset + text.length);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position));
  }
  function configure() {
    if (session) session.running = false;
    refresh();
    if (panel) { panel.reveal(); return; }
    panel = vscode.window.createWebviewPanel('codeDemo.preset', '预设内容', vscode.ViewColumn.Beside, {
      enableScripts: true, retainContextWhenHidden: true, localResourceRoots: []
    });
    const nonce = randomBytes(16).toString('hex');
    panel.webview.html = managerHtml(nonce);
    panel.webview.onDidReceiveMessage(message => {
      if (message?.type === 'ready') panel?.webview.postMessage({ presets, selected });
      if (message?.type === 'save') {
        const next = validatePresets(message.presets);
        if (!next) return;
        enqueue(async () => {
          await context.workspaceState.update('presetsV2', next);
          presets = next;
          preset = presets[selected].text;
          cursor = 0;
          session = undefined;
          panel?.dispose();
          await refresh();
        });
      }
    }, null, context.subscriptions);
    panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
  }
  for (let index = 0; index < 10; index++) {
    context.subscriptions.push(vscode.commands.registerCommand('codeDemo.preset' + (index + 1), () => enqueue(async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      if (!presets[index].text) { if (session) session.running = false; await refresh(); return; }
      selected = index;
      preset = presets[index].text;
      cursor = 0;
      bind(editor);
      await refresh();
    })));
  }
  context.subscriptions.push(
    vscode.commands.registerCommand('codeDemo.new', configure),
    vscode.commands.registerCommand('codeDemo.toggle', () => enqueue(async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      if (session?.document === editor.document) session.running = !session.running;
      else bind(editor);
      await refresh();
    })),
    vscode.commands.registerCommand('codeDemo.stop', () => enqueue(async () => { session = undefined; await refresh(); })),
    vscode.commands.registerCommand('codeDemo.reset', () => enqueue(() => { cursor = 0; if (session) session.replay = new Replay(); })),
    vscode.commands.registerCommand('codeDemo.step', () => {
      const editor = vscode.window.activeTextEditor, current = session;
      return enqueue(() => step(editor, current));
    }),
    vscode.commands.registerCommand('type', args => {
      if (!active()) return vscode.commands.executeCommand('default:type', args);
      const editor = vscode.window.activeTextEditor, current = session;
      return enqueue(() => step(editor, current));
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document !== session?.document) return;
      const previous = session.snapshot;
      // Change offsets refer to the old document; apply them from right to left.
      for (const change of [...event.contentChanges].sort((a, b) => b.rangeOffset - a.rangeOffset)) {
        session.replay.change(change.rangeOffset, previous.slice(change.rangeOffset, change.rangeOffset + change.rangeLength), change.text);
      }
      session.snapshot = event.document.getText();
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (session && vscode.window.activeTextEditor?.document !== session.document) session.running = false;
      refresh();
    }),
    vscode.workspace.onDidCloseTextDocument(document => {
      if (session?.document === document) { session = undefined; refresh(); }
    }),
    { dispose() { panel?.dispose(); vscode.commands.executeCommand('setContext', 'codeDemo.active', false); } }
  );
}
exports.activate = activate;
