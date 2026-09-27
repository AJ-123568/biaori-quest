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

/* 本地位图全部内联为 base64：递归扫 assets 下的 png/jpg/webp/gif（src/ 是原图备份，不入包）。
   静态完整路径（homestage 轮播 / 悬停彩蛋 / 拖尾 / CSS 光标）最后在成品全文替换成 dataURL；
   拼接路径（companion art 段 dir+文件名）由 companion.js 读 __ASSET_DATA__ 解析。 */
const IMG_MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const assetData = {};
(function scanAssets(dir){
  for(const f of fs.readdirSync(dir, { withFileTypes: true })){
    const p = path.join(dir, f.name);
    if(f.isDirectory()){ if(f.name !== "src") scanAssets(p); continue; }
    const mime = IMG_MIME[path.extname(f.name).toLowerCase()];
    if(mime){
      const rel = path.relative(root, p).replace(/\\/g, "/");
      assetData[rel] = "data:" + mime + ";base64," + read(rel).toString("base64");
    }
  }
})(path.join(root, "assets"));
inject.__ASSET_DATA__ = Object.fromEntries(Object.entries(assetData)
  .filter(([p]) => p.startsWith("assets/companion/")));   /* 只给 companion 拼接路径用（静态替换覆盖不了 dir+文件名）；其余走下方全文替换，表里再放一份就白涨一倍体积 */
/* injectTag 先落占位符：若现在注入，全文替换 pass 会把表里的路径键名也换掉（键查不到 + dataURL 翻倍），
   等替换跑完再换成真表 */
const injectTag = "<script>window." + Object.entries(inject)
  .map(([k, v]) => k + "=" + JSON.stringify(v)).join(";window.") + ";</script>";
html = html.replace(/<script src="js\/puppet.js">/, () => "\x01ASSET_INJECT\x01\n<script src=\"js/puppet.js\">");

/* 全部本地脚本内联（函数形式的 replace 避免内容里的 $ 触发替换模式） */
html = html.replace(/<script src="(?!https?:)([^"]+)"><\/script>/g, (m, src) =>
  "<script>\n" + readTxt(src) + "\n</script>");

if(html.includes('<script src="') || html.includes('href="css/')) {
  console.error("警告：仍有未内联的本地资源，请检查 index.html");
}

/* 静态位图路径全文替换成 dataURL（覆盖内联 JS/CSS 与注入 JSON；../ 前缀是 CSS 相对引用，剥掉再查表） */
html = html.replace(/(?:\.\.\/)*assets\/[A-Za-z0-9_\-./]+\.(?:png|jpe?g|webp|gif)/g,
  m => assetData[m.replace(/^(?:\.\.\/)+/, "")] || m);
const rest = html.match(/(?:\.\.\/)*assets\/[A-Za-z0-9_\-./]+\.(?:png|jpe?g|webp|gif)/g);
if(rest) console.error("警告：仍有未内联的位图引用：", [...new Set(rest)]);

/* 替换完成后再注入（此时全文已无裸路径键名可误伤） */
html = html.replace("\x01ASSET_INJECT\x01", () => injectTag);
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", "biaori-quest-standalone.html");
fs.writeFileSync(out, html);
console.log("输出:", out, "|", (fs.statSync(out).size / 1048576).toFixed(2) + " MB");
