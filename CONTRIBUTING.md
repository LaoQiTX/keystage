# 参与 KeyStage 开发

需要 Node.js 20+；Windows 打包使用内置 PowerShell，无运行时第三方依赖。

```sh
npm test
npm run check
npm run package
```

使用 VS Code 打开项目根目录，按 F5 启动扩展开发宿主。

代码入口在 `extension/extension.js`；`presets.js` 处理预设校验与旧数据读取，`manager.js` 提供 Webview，`replay.js` 跟踪删除后的重打片段。`test/` 包括逻辑测试与模拟 VS Code API 的集成测试，不能替代真实宿主验证。

提交 PR 时说明使用场景、行为变化和测试结果。改动输入流程时请覆盖插入、删除、快速连续输入、LF/CRLF、Python 缩进、暂停和预设切换。

反馈问题请提供编辑器版本、插件版本、操作系统、输入法、快捷键冲突以及最小复现代码。请勿包含密码、令牌或私人预设内容。

## 品牌与兼容性

用户可见名称统一使用 KeyStage。内部扩展标识 `local-demo.code-demo-typer`、命令 ID `codeDemo.*` 和存储键保持稳定，以便已有用户原位升级及保留预设；不要仅为改名修改这些兼容性标识。
