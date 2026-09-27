/* ---------- 伴侣小人（P3.6）：官方图 SVG 布偶驱动——画稿来自 assets/companion/puppet-custom.svg（tools/build_chuuya_puppet.py 生成，换图重跑管线或同名覆盖），这里只管表情/眨眼/动作/待机 ---------- */
(function(){


  /* 表情 → 五官组合（idle=犯困） */
  const FACES = {
    normal: { eyes: "open",  mouth: "smile",  brows: "normal" },
    happy:  { eyes: "happy", mouth: "grin",   brows: "happy"  },
    angry:  { eyes: "open",  mouth: "angry",  brows: "angry"  },
    idle:   { eyes: "sleepy", mouth: "sleepy", brows: "normal" }
  };

  let root = null, face = "normal", srcMode = "";
  let blinkTimer = null, actTimer = null, sleepTimer = null, fidgetTimer = null;
  const $ = id => root ? root.querySelector("#" + id) : null;
  /* SVG 元素不认 HTML 的 hidden 属性，用 display 属性控制显隐 */
  function show(id, on){
    const el = $(id);
    if(!el) return;
    if(on) el.removeAttribute("display");
    else el.setAttribute("display", "none");
  }

  function setFace(key){
    const f = FACES[key] || FACES.normal;
    face = FACES[key] ? key : "normal";
    show("pp-eyes-open",  f.eyes === "open");
    show("pp-eyes-happy", f.eyes === "happy");
    show("pp-eyes-sleepy", f.eyes === "sleepy");
    show("pp-m-smile",  f.mouth === "smile");
    show("pp-m-grin",   f.mouth === "grin");
    show("pp-m-grin-fang", f.mouth === "grin");
    show("pp-m-angry",  f.mouth === "angry");
    show("pp-m-sleepy", f.mouth === "sleepy");
    show("pp-b-normal", f.brows === "normal");
    show("pp-b-happy",  f.brows === "happy");
    show("pp-b-angry",  f.brows === "angry");
  }

  /* 换装：head='hat'|'none'；body 具体衣服；acc={scarf,glasses} 可叠穿。
     衣服图层与 config/wardrobe.json 的上架状态（ready）对应，这里按 id 开关 group */
  const BODY_LAYERS = ["hoodie", "uniform", "yukata"];
  function setWorn(w){
    w = w || {};
    show("pp-hat", (w.head || "hat") === "hat");
    const body = w.body || "coat";
    show("pp-o-coat", body === "coat");
    BODY_LAYERS.forEach(id => {
      show("pp-o-" + id, body === id);
      show("pp-armL-" + id, body === id);
      show("pp-armR-" + id, body === id);
    });
    const baseArms = body === "coat" || body === "vest";
    show("pp-armL-base", baseArms);
    show("pp-armR-base", baseArms);
    show("pp-o-scarf", !!(w.acc && w.acc.scarf));
    show("pp-o-glasses", !!(w.acc && w.acc.glasses));
  }

  function scheduleBlink(){
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(() => {
      if(root && face !== "idle"){
        root.classList.add("blink");
        setTimeout(() => { if(root) root.classList.remove("blink"); scheduleBlink(); }, 140);
      } else scheduleBlink();
    }, 2800 + Math.random() * 3200);
  }

  /* ---------- 动作系统 ---------- */
  const ACT_MS = { jump: 700, angry: 1100, poke: 420, wave: 1800, look: 1900, hip: 2200, sway: 2700 };
  const ACT_KEYS = ["act-jump","act-angry","act-poke","act-wave","act-look","act-hip","act-sway","act-sleep"];
  /* talk 与一次性动作并存（说话弹头+身体动作不冲突）；一次性动作互相顶替 */
  function play(name){
    if(!root) return;
    if(name === "talk"){
      root.classList.remove("act-talk");
      void root.getBoundingClientRect();   /* 强制重排，让连播的动画能重新开始 */
      root.classList.add("act-talk");
      return;
    }
    if(name === null){
      root.classList.remove("act-talk");
      return;
    }
    clearTimeout(actTimer);
    clearTimeout(sleepTimer);
    root.classList.remove(...ACT_KEYS);
    show("pp-zzz", false);
    if(name === "sleep"){
      root.classList.add("act-sleep");
      show("pp-zzz", true);
      sleepTimer = setTimeout(() => {
        if(!root) return;
        root.classList.remove("act-sleep");
        show("pp-zzz", false);
        if(face === "idle") setFace("normal");
      }, 8000);
      return;
    }
    root.classList.add("act-" + name);
    actTimer = setTimeout(() => { if(root) root.classList.remove("act-" + name); }, ACT_MS[name] || 1000);
  }

  /* 待机小动作：每 20~40 秒随机来一个（说话/打盹时不打扰） */
  function scheduleFidget(){
    clearTimeout(fidgetTimer);
    fidgetTimer = setTimeout(() => {
      if(root && !root.classList.contains("act-talk") && !root.classList.contains("act-sleep")){
        play(["look", "hip", "sway"][Math.floor(Math.random() * 3)]);
      }
      scheduleFidget();
    }, 20000 + Math.random() * 20000);
  }

  /* 挂载：加载画稿（standalone 走 __PUPPET_CUSTOM_SVG__ 内联，线上 fetch 同名文件），拿不到则不渲染 */
  async function mount(container){
    if(!container) return root;
    clearTimeout(blinkTimer); clearTimeout(actTimer); clearTimeout(sleepTimer); clearTimeout(fidgetTimer);
    root = null;
    try{
      let txt = window.__PUPPET_CUSTOM_SVG__;   /* standalone：画稿已内联 */
      if(txt === undefined){
        const r = await fetch("assets/companion/puppet-custom.svg", { cache: "no-store" });
        if(r.ok) txt = await r.text();
      }
      if(txt && txt.includes("<svg")){
        container.innerHTML = txt;
        root = container.querySelector("svg");
        if(root) srcMode = "custom";
      }
    }catch(e){}
    return reattach(container);
  }

  /* 把 container 里现成的 svg 重新接管（外部替换画稿后可调用） */
  function reattach(container){
    root = container.querySelector("svg");
    if(!root) return null;
    root.classList.add("puppet");
    setFace("normal");
    setWorn({});
    scheduleBlink();
    scheduleFidget();
    return root;
  }

  window.Puppet = { mount, reattach, setFace, setWorn, play, source: () => srcMode };
})();
