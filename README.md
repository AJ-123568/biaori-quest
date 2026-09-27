# biaori-quest · かな書き取り · 标日初级上册单词拼写练习

看中文释义，用日语输入法把单词的假名拼出来，回车判定——在这个底子上盖出的单词闯关游戏：金币经济、蛇形闯关地图、双难度星级、还有一只可拖拽的中原中也伴侣。

**在线玩**：<https://aj-123568.github.io/biaori-quest/>

**单文件离线版**：`node scripts/build-standalone.js` → 生成 `dist/biaori-quest-standalone.html`，一个文件含全部功能与语音，双击即玩（无需联网、无需服务器）。

## 功能

- **自由练习**：按课选范围、全选、错题本专项、乱序出题、汉字写法提示、原稿用纸字数格子
- **闯关地图**：24 课蛇形路径节点，前一课 ≥1★ 解锁下一关；每课普通（释义→假名）/ 进阶（看汉字写读音）两难度；3★=全对未用券、2★≥90%、1★通关，用券封顶 2★
- **金币经济**：答对 +2、连对每满 5 次 +5、过关 1/2/3★ +20/30/50（首通翻倍）、完美 +20；提示券 / 跳过券商店
- **错题本 + 单词编辑器**：答错自动进错题本，可增删课程单词
- **中原中也伴侣**：右下角可拖拽的 Q 版小人（支持自定义画稿），21 句全语音台词按事件触发（开场 / 答对 / 答错 / 连击 / 过关 / 完美 / 不及格 / 闲置 / 戳一戳），可关闭可静音
- **存档**：localStorage v2，自动迁移旧档

## 自定义（全部不用碰代码）

| 想改什么 | 改哪里 |
|---|---|
| 伴侣台词 / 语言（中·日） | `config/companion.json` 的 `lines`（每条 `{id, event, text, lang}`） |
| 台词语音 | 合成 `音频id.wav` 放进 `audio/companion/` 即自动生效，缺的回落系统 TTS |
| 立绘表情 | `assets/companion/` 同名覆盖 png，或改 `config/companion.json` 的 `art` 段 |
| 小人画稿 | 覆盖 `assets/companion/puppet-custom.svg` |
| 衣橱商品 | `config/wardrobe.json` |

语音合成管线（免费路线：素材清洗 → GPT-SoVITS 零样本/微调 → 批量出 wav）见 **[docs/voice-guide.md](docs/voice-guide.md)**。

## 本地开发

仓库是纯静态站，任意静态服务器指向根目录即可（如 `python -m http.server`）后打开 `index.html`。修改后跑 `node scripts/build-standalone.js` 重新导出单文件版。

## 目录结构

```
biaori-quest/
├── index.html
├── css/style.css
├── js/{main, puppet, companion, homestage}.js
├── config/{companion, wardrobe}.json
├── audio/companion/*.wav      # 21 句伴侣语音
├── data/biaori-shokyuu1.json  # 词库源数据（页面运行时用内嵌 DATA）
├── assets/companion/          # 立绘差分与小人画稿
├── docs/voice-guide.md        # 音色制作指南
└── scripts/build-standalone.js
```

## Credits & 权利 notice

- 本项目为**粉丝向、非商用**的学习工具。
- **中原中也**角色出自『文豪野犬』（原作：朝霧カフカ / 漫画：春河35 / 动画制作：ボンズ）。游戏内语音**不含任何原声录音**：全部台词由 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 本地合成，音色致敬动画 CV **谷山紀章** 演绎的中也，合成方法与素材要求见语音指南。
- 单词数据整理自《新版中日交流标准日本语 初级上册（第二版）》，来源：<https://github.com/Rabbit-Hu/vocab-helper>。
- 立绘/画稿素材来自公开官方宣传图与动画截图，仅供学习交流，侵权请联系删除；本仓库不存储任何动画原片音频切片。
