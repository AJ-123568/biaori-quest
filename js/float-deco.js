/* 全屏漂浮装饰：爱心/泡泡/糖果/星星 自下而上缓慢上浮。
   两个实例：主区 #hsFloat 垫在轮播氛围底之上、照片卡之下（飘到卡后即被挡住）；
   边栏 .side-float z-index:-1 画在橙底之上、图标文字之下。内容层 z>=1 全部盖过图案。
   本组件只造 DOM（动画样式在 style.css 的 fd- 段）：纯 CSS 无限循环 + 负 delay 让进场即在半空，无定时器。 */
(function(){
  "use strict";
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;   /* 减弱动效：整体不出（CSS 还有 display:none 兜底） */
  const MOTIFS = ["❤️", "🫧", "🍬", "✨"];
  const SIZE = [13, 26], DUR = [14, 26], OPACITY = [0.35, 0.7], SWAY = [4.5, 9.5];   /* px区间/秒区间/透明度区间/摆动周期区间 */

  document.querySelectorAll(".float-deco").forEach(box => {
    const n = +box.dataset.count || 14;
    const frag = document.createDocumentFragment();
    for(let i = 0; i < n; i++){
      const outer = document.createElement("span");
      outer.className = "fd-i";
      const dur = DUR[0] + Math.random() * (DUR[1] - DUR[0]);
      outer.style.cssText =
        "left:" + (Math.random() * 100).toFixed(2) + "%;" +
        "font-size:" + (SIZE[0] + Math.random() * (SIZE[1] - SIZE[0])).toFixed(1) + "px;" +
        "animation-duration:" + dur.toFixed(1) + "s;" +
        "animation-delay:-" + (Math.random() * dur).toFixed(1) + "s;" +
        "opacity:" + (OPACITY[0] + Math.random() * (OPACITY[1] - OPACITY[0])).toFixed(2) + ";";
      const inner = document.createElement("i");
      inner.textContent = MOTIFS[Math.floor(Math.random() * MOTIFS.length)];
      inner.style.animationDuration = (SWAY[0] + Math.random() * (SWAY[1] - SWAY[0])).toFixed(1) + "s";
      outer.appendChild(inner);
      frag.appendChild(outer);
    }
    box.appendChild(frag);
  });
})();
