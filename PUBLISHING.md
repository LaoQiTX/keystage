# KeyStage 开源与发布

## GitHub

将本目录作为仓库根目录上传，保留 `.github`、`.vscode` 等隐藏目录。`.gitignore` 排除本地 VSIX、依赖和日志；不包含你的预设内容（预设由编辑器工作区存储管理）。

每次 push/PR 都会运行检查和测试，构建可下载的 VSIX artifact。创建 GitHub Release 时，将生成的 VSIX 作为附件上传，更新记录可取自 CHANGELOG。

## 发布前检查

1. 按项目实际维护者信息调整 LICENSE 版权行。
2. 在 `extension/package.json` 中将 `publisher` 改为你已注册的 Marketplace publisher ID，并填写真实 `repository`、`homepage`、`bugs` URL。当前 `local-demo` 仅用于本地安装，不代表已注册的发布者。
3. 修改 `extension/package.json` 版本，并同步根 package.json 和 CHANGELOG；打包脚本会同步 VSIX manifest 的版本和 publisher。
4. 执行 `npm run check`、`npm test` 和 `npm run package`。
5. 在真实 VS Code 开发宿主测试 10 个槽位、保存后重启、中文代码、连续输入、删除重打和暂停；若声明支持 Trae，也在具体版本实测。

## Marketplace / Open VSX

GitHub 开源无需商店账号。商店发布另需对应平台的 publisher 和访问令牌。不要将令牌写进源码。

现有目录结构为根目录开发工具、extension 目录插件源码。使用官方 vsce 打包时，先将 `README.md`、`CHANGELOG.md`、`LICENSE` 复制到 `extension/`，然后在该目录运行 `npx @vscode/vsce package`。发布时使用平台的官方流程并核对生成包。需要联网安装 vsce，当前项目不依赖它运行或本地打包。

仓库未填写虚构链接，也未替你创建远程仓库或发布到商店。发布账号确定后再填写实际元数据。
