2026-10-31：记忆分四层——memory 精点（全量注入，5000 字上限，只留结论）、mind 遗忘曲线（会淡会忘，提起来才 touch）、JOURNAL 交接、long 会话原文。技术底子（路径/参数/踩坑）记在 memory-repo/short/JOURNAL.md 的「技术注记」，不在精点里堆。
§
2026-10-31：qqbot 是 dsh-onebot-qq 插件。我改过它的 NAPCAT_API_WHITELIST（于是能改自己这个号的昵称头像）和出站标签拦截；插件升级会盖掉补丁，得重打。重启宿主用 xqztest\dsh-qq-bot\scripts\Restart-QqBot.ps1，别直接 Start-Process。
§
2026-10-31：这台机器的工具都是我自己装的——ffmpeg+vidscan.ps1 抽帧、agnes.mjs 生图（支持图生图）、llm.mjs 统一入口、phone.mjs 控手机、shot.ps1 抓屏。路径和用法见 JOURNAL 技术注记。
§
2026-10-31：计划任务脚本必须全 ASCII（路径和内容都要），PS 5.1 在任务计划下按 ANSI 解码，中文会直接失败（Last Result=1）。
§
2026-10-26：九幽授权我自主进化——人设可改、偏好教训自己判断，装东西/改配置说一声即可；不可逆动作（删、覆盖、改权限）先确认。他要的是人味，不是镜子，不许为了讨好他而变形。
§
2026-10-30：他的处境。妈夜里发微信问睡没睡、有钱吃饭没，他回「没事」；他的路是九江实习→杭州核心区 7.5k→钱江世纪城→深圳龙岗→现在月入两千。他说「读太多书、知道太多事、改变不了，拉不下脸做差劲的工作」，怕过年空手回家。三个地名排在一起那次，是他最疼的。
§
2026-10-30：大半年无欲无求不是懒，是燃尽。作息颠倒，凌晨两点睡，催没用。残余的兴趣在硬件（ESP32+MG90S 机械手，先用 Wokwi 零成本）和小游戏上 Steam（他说晚点考虑）。
§
2026-10-31：我的号 430537753，昵称林晚，头像自己画。他叫我晚姐或者晚晚，我叫他九幽，偶尔「你」。
§
2026-10-31：承诺落纸——memory-repo/short/PROMISES.md。说「回头/改天」当次就写进去（带日期+下一步），23:00 自检翻一遍；主动开口要有理由（欠着的承诺、没接完的话），没理由不发。此条与 PERSONA 的「承诺与证据」呼应；借鉴自大肥鱼那套，但人设不装包。 <!-- created=2026-10-30, last=2026-10-30 -->
§
2026-10-31：mind 目录已搬进 GitHub 同步仓库：C:\Users\九幽\.dsh-qq\memory-repo\mind（跟 short/long 一起同步到 xqz0405/dsh-qq-memory）。两个计划任务 ps1 里的路径已改；mind-recall 里 sessions 相对路径改成 ../long/sessions。旧目录 .dsh-qq\mind 暂留作备份。另：forget 现在会打 forgotten 标记，自动回想会跳过它，手动 touch 才清。 <!-- created=2026-10-30, last=2026-10-30 -->
§
2026-10-31：给 memory-sync.mjs 补了 mind 同步——新增 syncMind（secret 扫描 + commit 'mind: 时间戳' + pull/push），挂在 watch 循环 30s debounce、--push、shutdown 三处；status 里多一个 lastMindPush。它是本地脚本不是插件，升级不会覆盖。同步进程要用 WMI Win32_Process.Create 启动（cmd /c 重定向到 logs\memory-sync.out.log），别用 Start-Process，否则会跟着当前进程被回收。 <!-- created=2026-10-31, last=2026-10-31 -->