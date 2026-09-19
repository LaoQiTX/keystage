function managerHtml(nonce) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>KeyStage · 预设管理</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style nonce="${nonce}">
  *{box-sizing:border-box} body{margin:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font-family:var(--vscode-font-family)}
  main{max-width:1100px;margin:auto;padding:24px;display:flex;flex-direction:column;gap:16px;height:100vh}h1{font-size:22px;margin:0}p{margin:0;line-height:1.6;color:var(--vscode-descriptionForeground)}
  .toolbar{display:flex;gap:12px;align-items:end;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:6px;font-size:12px}.name{flex:1}
  input,select,textarea{color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border,transparent);padding:9px;font:inherit}
  textarea{flex:1;min-height:140px;resize:none;white-space:pre;tab-size:4;font:14px/1.6 var(--vscode-editor-font-family,monospace);padding:16px}button{border:0;padding:9px 14px;cursor:pointer;background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}.primary{background:var(--vscode-button-background);color:var(--vscode-button-foreground)}
  :focus-visible{outline:1px solid var(--vscode-focusBorder);outline-offset:2px}footer{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#count{margin-right:auto;color:var(--vscode-descriptionForeground);font-size:12px}
  </style></head><body><main>
  <h1>KeyStage · 代码预设</h1><p>为每段演示准备独立内容。保存后返回代码文件，用对应快捷键从光标处开始。</p>
  <div class="toolbar"><label>快捷槽位<select id="slot" aria-label="快捷槽位"></select></label><label class="name">名称<input id="name" maxlength="80" autocomplete="off"></label></div>
  <label for="code">内容 · 保留空格、Tab 和换行</label><textarea id="code" spellcheck="false" aria-label="预设代码"></textarea>
  <p>数字快捷键从头启动 · Ctrl+Alt+D 暂停/继续 · Esc 结束。Python 缩进请按目标位置准备。</p>
  <footer><span id="count"></span><button id="copy">复制当前到下一槽</button><button id="clear">清空当前</button><button class="primary" id="save">保存全部并关闭</button></footer>
  </main><script nonce="${nonce}">
  const api=acquireVsCodeApi();
  const slot=document.getElementById('slot'),nameInput=document.getElementById('name'),code=document.getElementById('code'),count=document.getElementById('count');
  let presets=[],selected=0;
  const modifier=/Mac/.test(navigator.platform)?'Cmd':'Ctrl';
  function stash(){if(presets[selected])presets[selected]={name:nameInput.value,text:code.value};}
  function labels(){Array.from(slot.options).forEach((option,i)=>{option.textContent=(i+1)+' · '+modifier+'+Alt+'+(i===9?'0':i+1)+' · '+(presets[i].name||'未命名');});}
  function metrics(){count.textContent=code.value.length+' 字符 · '+code.value.split('\\n').length+' 行';document.getElementById('copy').disabled=!!presets[(selected+1)%10].text;}
  function show(){slot.value=String(selected);nameInput.value=presets[selected].name;code.value=presets[selected].text;labels();metrics();}
  window.addEventListener('message',event=>{if(!Array.isArray(event.data.presets))return;presets=event.data.presets;selected=event.data.selected||0;slot.replaceChildren();presets.forEach((_,i)=>{const option=document.createElement('option');option.value=String(i);slot.append(option);});show();});
  slot.addEventListener('change',()=>{stash();selected=Number(slot.value);show();});
  nameInput.addEventListener('input',()=>{stash();labels();});code.addEventListener('input',()=>{stash();metrics();});
  code.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();code.setRangeText('    ',code.selectionStart,code.selectionEnd,'end');stash();metrics();}});
  document.getElementById('copy').addEventListener('click',()=>{stash();const target=(selected+1)%10;if(presets[target].text)return;presets[target]={name:presets[selected].name+' 副本',text:presets[selected].text};selected=target;show();});
  document.getElementById('clear').addEventListener('click',()=>{code.value='';stash();metrics();});
  document.getElementById('save').addEventListener('click',()=>{stash();api.postMessage({type:'save',presets});});
  api.postMessage({type:'ready'});
  </script></body></html>`;
}
module.exports={managerHtml};
