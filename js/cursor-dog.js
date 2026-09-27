/* 中也小狗拖尾: 桌面鼠标滑动时, 沿轨迹每隔约30px生成一只小狗, 0.8s 缩小下沉淡出 */
(function(){
  "use strict";
  if(!matchMedia("(pointer: fine)").matches) return;          // 触屏不启用
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var SRC = "assets/cursor/dog-wide.png";
  var STEP = 30;          // 每移动多少像素生成一只
  var LIFE = 800;         // 与 css 淡出动画时长一致
  var MAX_ALIVE = 12;     // 同屏上限, 防止快速画圈时堆积
  var last = null;
  var alive = [];

  addEventListener("mousemove", function(e){
    if(last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < STEP) return;
    last = { x: e.clientX, y: e.clientY };

    var s = 26 + Math.random() * 10;                          // 26~36px 随机大小
    var el = document.createElement("div");
    el.className = "dog-trail";
    el.style.width = s.toFixed(1) + "px";
    el.style.left = (e.clientX - s / 2) + "px";
    el.style.top = (e.clientY - s * .55) + "px";              // 让狗头贴着指针
    var img = document.createElement("img");
    img.src = SRC;
    img.alt = "";
    img.style.transform = "rotate(" + ((Math.random() * 36) - 18).toFixed(1) + "deg)"
      + " scaleX(" + (Math.random() < .5 ? -1 : 1) + ")";     // 随机歪头/转身
    el.appendChild(img);
    document.body.appendChild(el);
    alive.push(el);
    if(alive.length > MAX_ALIVE) drop(alive.shift());
    setTimeout(function(){ drop(el); }, LIFE);
  });

  function drop(el){
    var i = alive.indexOf(el);
    if(i >= 0) alive.splice(i, 1);
    el.remove();
  }
})();
