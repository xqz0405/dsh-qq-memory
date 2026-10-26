# DSH QQ 双记忆仓库

这个私有仓库保存 QQ 机器人（DeepSeek Harness qqbot 宿主）的两套记忆：

- `short/`：`dsh-persona-memory` 的精炼记忆（MEMORY.md / USER.md / STANDING.md / failures.md / projects-memory）。每轮请求注入上下文，变更后约 30 秒提交。
- `long/`：全部 DSH 会话原文（plain JSONL，含工具调用与结果）、每日摘要 `digests/YYYY-MM-DD.md`、会话索引 `index.md`。按小时/每日提交。
- `meta/schema.json`：仓库格式版本。

## 读取

- 人：先看 `short/MEMORY.md`、`short/USER.md`、`long/index.md`、`long/digests/`，需要细节再进 `long/sessions/`。
- DSH：把 `short/` 配成 `persona-memory.dir`；把 `long/sessions/**` 复制回 DSH 的 session root，删除派生的 `session-search.sqlite` 让索引重建。

## 写入

默认只有这台电脑上的 qqbot 宿主写入（单写者）。手动编辑 `short/` 后，下次同步会拉取/提交；冲突时本地优先，远端副本保存在本机 `~/.dsh-qq/conflicts/`。

## 安全

- 私有仓库；不要改成公开。
- 不要提交 token、密码、私钥；同步器会做 secret scan/redaction，但不能保证 100%。
- 仓库含个人记忆；建议 GitHub 账号开 2FA，必要时用独立 deploy key。
