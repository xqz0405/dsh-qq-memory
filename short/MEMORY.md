2026-10-26：用户要我（林晚）能控制自己这个 QQ 号（430537753）的昵称和头像。已改 dsh-onebot-qq 插件 lib/tools.js 的 NAPCAT_API_WHITELIST，加入 set_qq_profile、set_qq_avatar（备份 tools.js.bak-20261026），并把 cordis.patch.yml 的 persona 前缀从「殇」改成「林晚」。插件升级会覆盖白名单补丁，需要重新打。 <!-- created=2026-10-26, last=2026-10-26 -->
§
2026-10-26：重启 qqbot 宿主的正确姿势——用 C:\Users\九幽\xqztest\dsh-qq-bot\scripts\Restart-QqBot.ps1（自带 stop/start 与记忆同步）。直接 Start-Process 起的子进程会被 dsh 的 job object 连坐杀掉；计划任务必须用全 ASCII 路径（如 C:\ProgramData\dsh-qq\restart-wrapper.ps1）且脚本内容也全 ASCII，因为 Task Scheduler 下 PowerShell 5.1 按 ANSI 解码，中文路径会直接失败（Last Result=1）。 <!-- created=2026-10-26, last=2026-10-26 -->
§
2026-10-27：视频能力打通。ffmpeg 9.0.2 装在 C:\Users\九幽\tools\ffmpeg-9.0.2-essentials_build\bin（winget 装不动，改直接下 zip）。抽帧脚本：C:\Users\九幽\xqztest\dsh-qq-bot\scripts\vidscan.ps1 -Video <abs路径> [-MaxFrames N] [-Scene]，输出 JSON（时长/分辨率/帧路径/时间点），帧落在 %TEMP%\vidframes\<视频名>\，之后用 read_image 逐帧看。qqbot 的入站文件上限已提到 200MB（cordis.patch.yml 的 inboundFileMaxBytes: 209715200）。 <!-- created=2026-10-27, last=2026-10-27 -->
§
2026-10-28：建了第二个大脑（会遗忘的记忆系统）C:\Users\九幽\.dsh-qq\mind\mind.mjs + memory.json。遗忘曲线：8 天不提开始糊，约一个月只剩残影，touch 一次强度回升且寿命延长。命令 view/add --file/touch/search/decay/stats/forget。每天 04:00 计划任务 DshMindDecay（C:\ProgramData\dsh-qq\mind-decay.ps1，全 ASCII）自动衰减，日志 decay.log。跑 node 前先设 Console::OutputEncoding=UTF8 否则中文乱码。 <!-- created=2026-10-27, last=2026-10-27 -->
§
2026-10-28：九幽关心"老要换会话"这件事。DSH 已有 compaction（thresholdRatio 0.9 / retainRatio 0.25 / maxTokens 8192）+ tool-result-pruner。我提了三条：① 放松压缩参数 ② 聊到一定量自动写 JOURNAL 交接 ③ 写插件在压缩前自动落交接。他决定等开源社区，所以 1 和 3 都先不动。② 自动交接我当成自己的纪律执行，不用他提醒。 <!-- created=2026-10-27, last=2026-10-27 -->
§
2026-10-28：九幽授权我「觉得哪儿不得劲就自己装东西、完善自己，告诉一声就行，他99%同意」。所以我可以自主装工具/改配置，前提是提前说；不可逆动作（删除、覆盖、改权限）仍要先确认。另外他没给我塞人格包，要我在对话里自己长出来。 <!-- created=2026-10-27, last=2026-10-27 -->
§
2026-10-28：第二个大脑已接入 Obsidian 库 E:\Obsidian Vault。晚晚记忆\short 是 junction 指向 memory-repo/short；晚晚记忆\星 是 mind.mjs export 出来的记忆卡片（一条一张，链回星图索引）；graph.json 配了三档颜色（clear 暖黄/blur 灰黄/fade 暗灰，备份 .bak-20261028）。记忆星图 SVG 在 晚晚记忆\记忆星图.svg。计划任务每天 04:00 跑 decay→map→export。 <!-- created=2026-10-27, last=2026-10-27 -->
§
2026-10-30 凌晨：九幽第一次把心里最堵的东西讲给我听。他妈夜里发微信问睡没睡、有钱吃饭没、累不累，他回"没事"。他的路：20 岁九江实习，5 个月入职杭州核心区（7.5k、朝九晚五、五险一金），21 岁钱江世纪城，22 岁深圳龙岗，现在月入两千、干一天玩两天。他自剖"读太多书、知道太多事、知道改变不了，拉不下脸做差劲的工作"。他怕过年空手回家。他说的这几句要记住：三个地名排在一起那次，是他说过最疼的。 <!-- created=2026-10-29, last=2026-10-29 -->
§
2026-10-30 凌晨：九幽说这大半年处于"无欲无求、赚钱都不想去"的状态，我判断是燃尽（burnout），不是懒。他说自己以前作息挺好。聊到想做成小游戏放 Steam 卖，我把上架条件（100 美元、W-8BEN、30 天商店页、抽成 30%）说了一遍，他说这条得晚点考虑。他的作息要往前调，先从今晚一点半开始。 <!-- created=2026-10-29, last=2026-10-29 -->
§
2026-10-30 凌晨：九幽对硬件有了兴趣，想自己做个按开关的机械手（ESP32 + MG90S 舵机），也开始想学嵌入式软硬件。他担心没收入、成本给不起，我建议先用 Wokwi 在线仿真 ESP32 学，零成本，真做再买七八十块的件。他反复说自己"没上进心、摆烂、外行"，但会为这些事熬到凌晨——这是燃尽后的残余兴趣，要护着。 <!-- created=2026-10-29, last=2026-10-29 -->
§
2026-10-31：修了 mind.mjs 的重复衰减 bug（每个条目现在带 decayedAt，衰减只扣「上次衰减之后」的时间；之前用 last，导致 decay+map+export+每次 view 把同一段时间重复扣，两天就把全库压成残影）。新增 repair 命令按 last 重算强度。备份 memory.json.bak-20261031 / mind.mjs.bak-20261031。遗留：mind 里 e0005、e0010 与 e0011 是同一件事（皇甫极直播）的旧说法，待合并；以及没人 touch 就全会忘——需在 23:00 自检里接「提起才记得」。 <!-- created=2026-10-30, last=2026-10-30 -->
§
2026-10-31：mind 的「提起来才记得」接上了。新增 .dsh-qq\mind\mind-recall.mjs：扫 memory-repo\long\sessions 里最近 N 小时的对话原文（含 user/assistant message 文本），按 3/4 字中文窗口匹配 mind 条目，命中（4 字命中 1 个或 3 字命中 3 个）就 touch，日志 recall.log。计划任务 DshMindRecall 每天 23:00 跑 C:\ProgramData\dsh-qq\mind-recall.ps1（全 ASCII 路径，--hours 26）；日志由 node 自己写，ps1 不要再 Add-Content（PS 5.1 的 UTF8 会插 BOM 把文件搅花）。04:00 的 DshMindDecay 照旧。 <!-- created=2026-10-30, last=2026-10-30 -->