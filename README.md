# biaori-quest · かな書き取り · 标日初级上册单词拼写练习

看中文释义，用日语输入法把单词的假名拼出来，回车判定——在这个底子上盖出的单词闯关游戏：金币经济、蛇形闯关地图、双难度星级、衣橱换装，还有一只可拖拽、可戳、全语音的中原中也 bot 陪练。

**在线玩**：<https://aj-123568.github.io/biaori-quest/>

**单文件离线版**：`node scripts/build-standalone.js` → 生成 `dist/biaori-quest-standalone.html`，一个文件含全部功能与语音，双击即玩（无需联网、无需服务器）。

## 功能

- **侧边栏六视图**：练习 / 错题本 / 闯关地图 / 商店 / 衣橱 / 中也
- **主页轮播**：进站就是中也图片拼贴墙（26 张，随机槽位淡入淡出，永不重复刷屏）
- **自由练习**：按课选范围、全选、乱序出题、汉字写法提示、原稿用纸字数格子；课程按钮悬停还有随机立绘彩蛋
- **闯关地图**：24 课蛇形路径节点，前一课 ≥1★ 解锁下一关；每课普通（释义→假名）/ 进阶（看汉字写读音）两难度；3★=全对未用券、2★≥90%、1★通关，用券封顶 2★
- **金币经济**：答对 +2、连对每满 5 次 +5、过关 1/2/3★ +20/30/50（首通翻倍）、完美 +20；商店买提示券 / 跳过券 / 服装
- **衣橱**：给 bot 换装（帽子/衣服/饰品槽位，商店购买）
- **错题本 + 单词编辑器**：答错自动进错题本，课程单词可增删改
- **中原中也 bot**：右下角可拖拽的 Q 版小人（支持自定义画稿），全站点中将狗鼠标光标 + 拖动拖尾彩蛋；21 句全本音台词按事件触发（开场 / 答对 / 答错 / 连击 / 过关 / 完美 / 不及格 / 闲置 / 戳一戳）；侧边栏「中也」面板统一控制开关与静音
- **存档**：localStorage v2，自动迁移旧档

## 自定义（全部不用碰代码）

| 想改什么 | 改哪里 |
|---|---|
| bot 台词 / 语言（中·日） | `config/companion.json` 的 `lines`（每条 `{id, event, text, lang}`） |
| 台词语音 | 合成 `音频id.wav` 放进 `audio/companion/` 即自动生效，缺的回落系统 TTS |
| 小人画稿 | 覆盖 `assets/companion/puppet-custom.svg`（约 512KB 内的 SVG 画稿） |
| 衣橱商品 | `config/wardrobe.json` |
| 主页轮播图 | 图片放进 `assets/chuuya/`，在 `js/homestage.js` 的 `IMGS` 清单加一行 |

语音合成管线（免费路线：素材清洗 → GPT-SoVITS 零样本/微调 → 批量出 wav）见 **[docs/voice-guide.md](docs/voice-guide.md)**。

## 本地开发

仓库是纯静态站，任意静态服务器指向根目录即可（如 `python -m http.server`）后打开 `index.html`。修改后跑 `node scripts/build-standalone.js` 重新导出单文件版（产物在 `dist/`，不入库）。

## 目录结构

```
biaori-quest/
├── index.html
├── css/style.css
├── js/{main, puppet, companion, homestage, cursor-dog}.js
├── config/{companion, wardrobe}.json
├── audio/companion/*.wav      # 21 句伴侣语音
├── data/biaori-shokyuu1.json  # 词库源数据（页面运行时用内嵌 DATA）
├── assets/
│   ├── companion/             # 立绘差分与小人画稿（src/ 为原图备份，不入库）
│   ├── chuuya/                # 主页轮播图
│   └── cursor/                # 鼠标光标位图
├── tools/                     # 音色管线与光标生成脚本（本地用）
├── docs/voice-guide.md        # 音色制作指南
└── scripts/build-standalone.js
```

## Credits & 权利 notice

- 本项目为**粉丝向、非商用**的学习工具。
- **中原中也**角色出自『文豪野犬』（原作：朝霧カフカ / 漫画：春河35 / 动画制作：ボンズ）。游戏内语音**不含任何原声录音**：全部台词由 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 本地合成，音色致敬动画 CV **谷山紀章** 演绎的中也，合成方法与素材要求见语音指南。
- 单词数据整理自《新版中日交流标准日本语 初级上册（第二版）》，来源：<https://github.com/Rabbit-Hu/vocab-helper>。
- 立绘/轮播/画稿素材来自公开官方宣传图、动画截图与 AI 生成图，仅供学习交流，侵权请联系删除；本仓库不存储任何动画原片音频切片。
