/* 主页面图片轮播：新图原地渐显，旧图被盖住后延迟渐隐；底层为当前图的高斯模糊氛围底。
   由 main.js 的 showHome()/showView() 调 HomeStage.show()/hide()。 */
(function(){
  /* 图片清单：以后加图 = 文件放进 assets/chuuya/，在这里加一行 */
  const IMGS = [
    "assets/chuuya/chuuya-01.jpg",
    "assets/chuuya/chuuya-02.jpg",
    "assets/chuuya/chuuya-03.jpg",
    "assets/chuuya/chuuya-04.jpg",
    "assets/chuuya/chuuya-05.jpg",
    "assets/chuuya/chuuya-06.jpg",
    "assets/chuuya/chuuya-07.jpg",
    "assets/chuuya/chuuya-08.jpg",
    "assets/chuuya/chuuya-09.jpg",
    "assets/chuuya/chuuya-10.jpg",
    "assets/chuuya/chuuya-11.png",
    "assets/chuuya/chuuya-12.png"
  ];
  const STAY = 6000;   /* 每张停留 */
  const OUT  = 1400;   /* 渐隐(0.35s延迟+0.95s过渡)+余量，之后移除旧图节点 */
  const stage = document.getElementById("homeStage");
  const stack = document.getElementById("hsStack");
  const bgs = [document.getElementById("hsBg0"), document.getElementById("hsBg1")];
  if(!stage || !stack || !IMGS.length) return;

  IMGS.forEach(src => { const im = new Image(); im.src = src; });   /* 预加载 */
  let timer = null, idx = -1, cur = null, bgFlip = 0, lastSwitch = 0;

  function show(i){
    idx = i; lastSwitch = Date.now();
    const im = new Image();
    im.src = IMGS[i]; im.alt = "";
    stack.appendChild(im);
    void im.offsetWidth;   /* 强制重排让 opacity:0 起步帧生效——后台标签页 rAF 不跑，不能用双 rAF 触发过渡 */
    im.classList.add("on");
    if(cur){
      const old = cur;
      old.classList.remove("on"); old.classList.add("leaving");
      setTimeout(() => old.remove(), OUT);
    }
    cur = im;
    /* 氛围底：两层交替换 background-image 交叉渐变 */
    const bg = bgs[bgFlip ^= 1];
    bg.style.backgroundImage = 'url("' + IMGS[i] + '")';
    bgs[0].classList.toggle("show", bg === bgs[0]);
    bgs[1].classList.toggle("show", bg === bgs[1]);
  }
  function next(){ show((idx + 1) % IMGS.length); }
  function start(){
    stage.hidden = false;
    if(timer) return;
    show(0);
    timer = setInterval(next, STAY);
  }
  function stop(){
    stage.hidden = true;   /* 整层隐藏，避免透明层挡住 .wrap 的静态内容(如返回箭头) */
    clearInterval(timer); timer = null;
    stack.innerHTML = ""; cur = null; idx = -1;
    bgs.forEach(b => b.classList.remove("show"));
  }
  stage.addEventListener("click", () => {
    if(!timer || Date.now() - lastSwitch < 1200) return;   /* 过渡中防连点 */
    next();
  });
  window.HomeStage = { show: start, hide: stop };
  start();   /* 首次加载即主页面 */
})();
