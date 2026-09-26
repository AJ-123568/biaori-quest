/* 主页面图片拼贴轮播：右侧常驻 5 张完整不裁剪的图片拼贴铺满；
   每隔几秒随机一张不在屏上的图淡入到随机槽位（槽位边缘互相搭接，
   新图会压住相邻图片的一小部分），被顶掉的旧图随后渐隐。
   出图顺序全随机：洗牌牌堆逐张抽，每张轮到后才重洗，且绝不与屏上 5 张重复。
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
  /* 槽位（右侧区域的百分比盒子）：相邻槽位边缘互相搭接，拼贴堆叠感来自这里 */
  const SLOTS = [
    { left:"2%",  top:"4%",  width:"30%", height:"42%" },   /* 左上 */
    { left:"24%", top:"14%", width:"27%", height:"46%" },   /* 中上 */
    { left:"4%",  top:"40%", width:"27%", height:"50%" },   /* 左下 */
    { left:"45%", top:"3%",  width:"40%", height:"52%" },   /* 右上（大） */
    { left:"40%", top:"44%", width:"48%", height:"52%" }    /* 右下（大） */
  ];
  const STEP = 4500;   /* 每隔多久换一张 */
  const OUT  = 1500;   /* 旧卡渐隐(0.3s延迟+0.9s过渡)+余量后移除节点 */
  const stage = document.getElementById("homeStage");
  const stack = document.getElementById("hsStack");
  const bgs = [document.getElementById("hsBg0"), document.getElementById("hsBg1")];
  if(!stage || !stack || !IMGS.length) return;

  IMGS.forEach(src => { const im = new Image(); im.src = src; });   /* 预加载 */
  let timer = null, intro = [], zTop = 1, bgFlip = 0, lastSwitch = 0;
  let deck = [];                                   /* 洗牌牌堆 */
  const shown = new Set();                         /* 正在屏上的图 */
  const slotCur = new Array(SLOTS.length).fill(null);

  function shuffle(a){
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /* 抽一张不在屏上的图：抽到屏上已有的就与牌堆中第一张可用的换；
     牌堆只剩屏上图时整副重洗再来一次 */
  function draw(){
    if(!deck.length) deck = shuffle(IMGS.slice());
    let src = deck.pop();
    if(shown.has(src)){
      const idx = deck.findIndex(s => !shown.has(s));
      if(idx >= 0){ [deck[idx], src] = [src, deck[idx]]; }
      else if(IMGS.some(s => !shown.has(s))){ deck = shuffle(IMGS.slice()); return draw(); }
      /* 图全在屏上（图少于槽位数）时允许重复，直接用 src */
    }
    return src;
  }
  function place(slotIdx, src){
    const s = SLOTS[slotIdx];
    const card = document.createElement("div");
    card.className = "hs-card";
    card.dataset.src = src;   /* 存清单原始路径，供 shown 集合配对（img.src 会被浏览器转成绝对路径） */
    card.style.cssText = "left:" + s.left + ";top:" + s.top + ";width:" + s.width +
                         ";height:" + s.height + ";z-index:" + (++zTop);
    const im = new Image();
    im.src = src; im.alt = "";
    card.appendChild(im);
    stack.appendChild(card);
    void card.offsetWidth;   /* 强制重排让 opacity:0 起步帧生效——后台标签页 rAF 冻结，不能用双 rAF */
    card.classList.add("on");
    shown.add(src);
    const old = slotCur[slotIdx];
    slotCur[slotIdx] = card;
    if(old){
      old.classList.remove("on"); old.classList.add("leaving");
      setTimeout(() => { shown.delete(old.dataset.src); old.remove(); }, OUT);
    }
    /* 氛围底跟随最新出现的图 */
    const bg = bgs[bgFlip ^= 1];
    bg.style.backgroundImage = 'url("' + src + '")';
    bgs[0].classList.toggle("show", bg === bgs[0]);
    bgs[1].classList.toggle("show", bg === bgs[1]);
    lastSwitch = Date.now();
  }
  function next(){
    place(Math.floor(Math.random() * SLOTS.length), draw());
  }
  function start(){
    stage.hidden = false;
    if(timer) return;
    /* 开场：5 张按槽位顺序错峰浮现 */
    for(let k = 0; k < SLOTS.length; k++){
      intro.push(setTimeout(() => place(k, draw()), k * 260));
    }
    timer = setInterval(next, STEP);
  }
  function stop(){
    stage.hidden = true;   /* 整层隐藏，避免透明层挡住 .wrap 的静态内容(如返回箭头) */
    clearInterval(timer); timer = null;
    intro.forEach(clearTimeout); intro = [];
    stack.innerHTML = ""; slotCur.fill(null); shown.clear(); zTop = 1;
    bgs.forEach(b => b.classList.remove("show"));
  }
  stage.addEventListener("click", () => {
    if(!timer || Date.now() - lastSwitch < 1200) return;   /* 过渡中防连点 */
    next();
  });
  window.HomeStage = { show: start, hide: stop };
  start();   /* 首次加载即主页面 */
})();
