#!/usr/bin/env node
/* 构建单文件 standalone 版：
   - 内联本地 css / js（Google Fonts 等外链保留，离线时回落系统字体）
   - 注入 window.__COMPANION_CONFIG__ / __COMPANION_AUDIO__（语音 base64）/ __WARDROBE_CONFIG__ / __PUPPET_CUSTOM_SVG__
   - 输出 dist/biaori-quest-standalone.html，双击（file://）即可完整使用
   用法：node scripts/build-standalone.js */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f));
const readTxt = f => read(f).toString("utf8");

let html = readTxt("index.html");

/* 本地样式表内联（href 非 http 开头的才内联） */
html = html.replace(/<link rel="stylesheet" href="(?!https?:)([^"]+)">/g, (m, href) =>
  "<style>\n" + readTxt(href) + "\n</style>");

/* standalone 注入数据：伴侣配置 / 语音 base64 映射 / 衣橱配置 / 自定义画稿（若存在） */
const audio = {};
const adir = path.join(root, "audio", "companion");
for(const f of fs.readdirSync(adir).filter(f => f.endsWith(".wav")).sort()){
  audio[f.replace(/\.wav$/, "")] = "data:audio/wav;base64," + read(path.join("audio", "companion", f)).toString("base64");
}
const inject = {
  __COMPANION_CONFIG__: JSON.parse(readTxt("config/companion.json")),
  __COMPANION_AUDIO__: audio,
  __WARDROBE_CONFIG__: JSON.parse(readTxt("config/wardrobe.json"))
};
const customSvg = path.join(root, "assets", "companion", "puppet-custom.svg");
if(fs.existsSync(customSvg)) inject.__PUPPET_CUSTOM_SVG__ = readTxt("assets/companion/puppet-custom.svg");
const injectTag = "<script>window." + Object.entries(inject)
  .map(([k, v]) => k + "=" + JSON.stringify(v)).join(";window.") + ";</script>";
html = html.replace(/<script src="js\/puppet.js">/, () => injectTag + '\n<script src="js/puppet.js">');

/* 全部本地脚本内联（函数形式的 replace 避免内容里的 $ 触发替换模式） */
html = html.replace(/<script src="(?!https?:)([^"]+)"><\/script>/g, (m, src) =>
  "<script>\n" + readTxt(src) + "\n</script>");

if(html.includes('<script src="') || html.includes('href="css/')) {
  console.error("警告：仍有未内联的本地资源，请检查 index.html");
}
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", "biaori-quest-standalone.html");
fs.writeFileSync(out, html);
console.log("输出:", out, "|", (fs.statSync(out).size / 1048576).toFixed(2) + " MB");
