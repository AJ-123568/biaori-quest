# 游戏反馈层改造计划（已批准，待新会话执行）

> 状态：**未实施**。本计划自包含，执行会话读完本文件即可开工，无需原对话上下文。四项全部完成并验证后可删除本文件。

给 biaori-quest 补"游戏手感"四件套：①音效层 ②飘字与粒子反馈 ③结算星级逐颗点亮 ④闯关地图"走过的路点亮"。

## 执行会话必读（开工前）

1. `git pull` 后**重读要改的每个文件**——本项目多会话并行开发，文件经常变（js/main.js 约 7400 行，本文行号基于 2026-09-28 的 `2750649`+`ae45923`，若有偏移按函数名定位）
2. 项目记忆 `C:\Users\86182\.zcode\cli\memories\projects\biaori-quest-e7f8c7dc31126b56\memory\biaori-quest-plan.md` 里有全部踩坑记录，重点两条：**改 css/js 后浏览器必须 Ctrl+F5 或 URL 加 ？v=时间戳**（localhost 启发式缓存）；evaluate 多语句要包 IIFE
3. 中文注释；LF；push 失败用 `git -c http.proxy=http://127.0.0.1:7897 push`
4. **不动 companion.js 的语音排队体系**（playing/playWaiters/afterSpeak）——音效走完全独立的 AudioContext，天然不抢声道
5. 每项任务独立提交（中文 message）、实测通过才推；全部完成后 `node scripts/build-standalone.js` 重建 dist 并更新记忆文件（biaori-quest-plan.md 追加条目）

## 任务 1：音效层 `js/sfx.js`（新文件）

现状：全站没有任何音效（无 AudioContext），答对/买商品/过关全靠数字变化。

- 新建自包含 IIFE，暴露 `window.Sfx = { play(name), isOff(), setOff(v) }`
- 懒创建 AudioContext（首次 play 时；`ctx.state==="suspended"` 则 resume；首次点击前被浏览器拦截就静默放弃，不排队不重试）
- 开关存 localStorage `biaori1_sfx_off`；开关 UI 放进侧边栏「中也」面板：`main.js` 的 `renderChuuya()`（约 7292 行）里 rows 数组是 `[title, on, toggle, desc]` 结构，加第三行 `["音效音", !Sfx.isOff(), v => Sfx.setOff(v), "关掉后答对/过关等提示音不再播放"]`，样式复用现有两行
- 音色：oscillator + gain envelope 合成 8-bit 短音（全部 ≤0.6s，master gain ≈0.12），**参数集中一张表**方便后期调音色。曲目：`correct`（两音上行）、`wrong`（方波下滑）、`combo`（三连琶音）、`star`（高频 ping，任务 3 用）、`clear`（四音号角）、`levelup`（四音 fanfare）、`demote`（下行两音）、`buy`（双音收银）

接线（main.js）：

- `check()`（6903 行起）：ok 分支加 `Sfx.play("correct")`；else 分支加 `Sfx.play("wrong")`；`streak % 5 === 0` 处加 `Sfx.play("combo")`
- `gainLevels()`（6627 行）加 `Sfx.play("levelup")`；`loseLevel()` 加 `Sfx.play("demote")`
- `buyTicket()`（7161 行）购买成功处加 `Sfx.play("buy")`；`buyClothes()`（7215 行）同
- `showResult()` 的 star 点亮由任务 3 触发 star/clear 音

## 任务 2：飘字与粒子反馈

- **金币飘字**：新函数 `ecoFx(n)`——读取 `#hudCoins` 的 getBoundingClientRect，在附近生成 `.coin-float` span（正数金色 `+n`、负数红色 `-n`），CSS keyframes floatUp（上浮 40px + 淡出，0.9s）后 remove。`addCoins(n)`（6605 行）内部自动调；`buyTicket`/`buyClothes`/`loseLevel` 这三处直接改 `store.eco` 不走 addCoins 的，显式调 `ecoFx(-价格)`
- **连击数字**：`check()` 里 `$("streakNum").textContent = streak` 处加 `.pop` 类（scale 1→1.4→1，animationend 移除）；`streak % 5 === 0` 时换 `.big`（更大 + 变色）并给 `.wrap` 加 `.shake-quick`（0.15s ±2px 微震）
- **格子扫光**：答对 `renderMasu()` 后给 `#masu` 加 `.flash` 类 0.6s，CSS 用 `.masu.flash .cell:nth-child(n)` 逐格 delay 做白→绿扫光（现有 `.cell.hit` 绿色样式保留，扫光是叠加的一次性动画）
- **粒子**：答对时从 feedback 区迸 4~6 个 `.particle` 小圆点（随机角度/距离的 CSS 变量驱动 keyframes，0.6s 移除）；**仅 `matchMedia("(pointer:fine)")` 且非 `prefers-reduced-motion: reduce` 时启用**——判断写法照抄 `js/cursor-dog.js` 第 4~5 行
- 新 keyframes 命名避开现有：bump/qshake/qpulse/pp-*/dog-trail-fade 已占用

## 任务 3：结算星级逐颗点亮

- `index.html` 113 行 `#qStars` 改为空容器（保持 `.qstars` 类，其金色样式不变）
- `showResult()`（6981 行起）闯关分支：`$("qStars").textContent = starStr(stars)` 改为生成 3 个 `span.qstar`（未亮的灰 ☆），然后 `setTimeout(i*350ms)` 逐颗把前 `stars` 颗换成金色 ★ + `.lit`（scale pop 动画）+ `Sfx.play("star")`；`stars === 3` 时最后一颗后再补 `Sfx.play("clear")`
- 注意函数里 `gainLevels`/`Companion.fire` 已在同一分支，别重复触发；非闯关轮（qStars hidden）不点亮

## 任务 4：闯关地图"走过的路点亮"

- `buildMap()`（6686 行起）现状：一条整曲线画两遍（`["qmap-road","qmap-dash"]` 双层类，灰点线）+ addTree 装饰 + QNODE_ICONS
- **不动现有两层**，在其后为每个相邻节点对追加**金色覆盖段**：seg i（第 i 课节点 → 第 i+1 课节点）用同样的 C 曲线公式（`a=pts[i-1], b=pts[i], my=(a.y+b.y)/2`）单独成 path，`bestStars(i) >= 1` 时 `class="qseg-lit"`（金色 #D9A441 实线 3px），未通关不画
- 地图每次打开都重建，状态自动跟随存档（含单课重置/全局重置）；addTree/QNODE_ICONS/窄屏逻辑不动

## 验证与收尾（每项任务都要做）

1. 根目录 `python -m http.server 8642`，浏览器 **Ctrl+F5** 打开
2. 视觉项截图验证（飘字/扫光/点亮/金线）；音效项验证 `Sfx.play` 无异常且 osc 参数符合表定义（headless 听不见，最终听感由用户本人验收，音色参数集中可调）
3. 回归：练习答对/答错/连击、闯关结算、商店买券买衣、伴侣语音不受影响
4. 四项各自提交；全部完成后重建 standalone（新 js/sfx.js 会被 build 脚本的通用内联正则自动带上，无需改脚本）、push（代理兜底）、更新记忆
