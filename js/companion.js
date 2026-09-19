/* ---------- 中也伴侣（P3）：config/companion.json 驱动，音频优先 / 系统 TTS 回落 ---------- */
(function(){
  const CONFIG_URL = "config/companion.json";
  const OFF_KEY = "biaori1_companion_off";
  const COOLDOWN_MS = 4000;          /* 答题类事件的最小间隔，防止刷屏 */
  const CORRECT_RATE = 0.35;         /* 答对台词的触发概率 */
  const IDLE_MS = 90000;             /* 无操作多久触发闲置彩蛋 */

  let cfg = null, shown = false, curAudio = null, lastFired = 0, idleTimer = null;
  let box, bubble, sprite, closeBtn;

  function makeEl(tag, cls, parent){
    const el = document.createElement(tag);
    if(cls) el.className = cls;
    if(parent) parent.appendChild(el);
    return el;
  }

  function buildDom(){
    box = makeEl("div", "companion", document.body);
    box.hidden = true;
    bubble = makeEl("div", "companion-bubble", box);
    const stage = makeEl("div", "companion-stage", box);
    sprite = makeEl("img", "companion-sprite", stage);
    closeBtn = makeEl("button", "companion-close", stage);
    closeBtn.textContent = "✕";
    closeBtn.title = "关闭中也";
    makeEl("div", "companion-credit", stage).textContent = "CV 谷山紀章 · 合成音声";
    closeBtn.addEventListener("click", () => {
      try{ localStorage.setItem(OFF_KEY, "1"); }catch(e){}
      hide();
      if(!document.getElementById("companionRestore")){
        const chip = makeEl("button", "companion-restore", document.body);
        chip.id = "companionRestore";
        chip.textContent = "中也";
        chip.title = "重新召唤中也";
        chip.addEventListener("click", () => {
          chip.remove();
          try{ localStorage.removeItem(OFF_KEY); }catch(e){}
          show();
        });
      }
    });
    bubble.addEventListener("click", () => hideBubble());
  }

  function isOff(){ try{ return localStorage.getItem(OFF_KEY) === "1"; }catch(e){ return false; } }
  function show(){ if(!cfg || isOff()) return; shown = true; box.hidden = false; resetIdle(); }
  function hide(){ shown = false; box.hidden = true; stopAudio(); hideBubble(); clearTimeout(idleTimer); }
  function stopAudio(){
    if(curAudio){ curAudio.pause(); curAudio = null; }
    if("speechSynthesis" in window) speechSynthesis.cancel();
  }
  function hideBubble(){ bubble.hidden = true; }

  function setExpression(key){
    const a = cfg.art;
    const file = (a.expressions && a.expressions[key]) || a.fallback;
    sprite.src = (a.dir || "") + file;
  }

  function pickLine(ev){
    const pool = (cfg.lines || []).filter(l => l.event === ev);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function speak(line){
    if(!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = line.lang === "ja" ? "ja-JP" : "zh-CN";
    if(line.voice){
      const v = speechSynthesis.getVoices().find(v => v.name.includes(line.voice));
      if(v) u.voice = v;
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function playLine(line){
    stopAudio();
    hideBubble();
    bubble.textContent = line.text;
    bubble.classList.toggle("jp", line.lang === "ja");
    bubble.hidden = false;
    /* 音频优先：按 id 自动找 audio/companion/<id>.wav（audio 字段可覆盖路径），加载失败回落 TTS */
    const url = (cfg.audioDir || "audio/companion/") + (line.audio || line.id + ".wav");
    const a = new Audio(url);
    curAudio = a;
    a.addEventListener("error", () => { if(curAudio === a){ curAudio = null; speak(line); } });
    a.addEventListener("ended", () => setTimeout(hideBubble, 800));
    a.play().catch(() => { if(curAudio === a) speak(line); });
  }

  function fire(ev){
    if(!cfg || !shown || isOff()) return;
    const soft = ev === "answer-correct" || ev === "answer-wrong" || ev === "combo5";
    const now = Date.now();
    if(soft && now - lastFired < COOLDOWN_MS) return;
    if(ev === "answer-correct" && Math.random() > CORRECT_RATE) return;
    const line = pickLine(ev);
    if(!line) return;
    lastFired = now;
    resetIdle();
    setExpression(cfg.art.eventExpression[ev] || "normal");
    playLine(line);
  }

  function resetIdle(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if(shown) fire("idle"); }, IDLE_MS);
  }

  ["pointerdown", "keydown"].forEach(evName =>
    document.addEventListener(evName, () => { if(shown) resetIdle(); }, { passive: true }));

  fetch(CONFIG_URL).then(r => { if(!r.ok) throw 0; return r.json(); }).then(json => {
    cfg = json;
    if(!cfg.art) return;
    Object.values(cfg.art.expressions || {}).forEach(f => { new Image().src = (cfg.art.dir || "") + f; });
    buildDom();
    setExpression("normal");
  }).catch(() => {});   /* 配置拿不到（如 file:// 打开）→ 伴侣整体静默 */

  window.Companion = { fire, show, hide };
})();
