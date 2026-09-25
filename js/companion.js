/* ---------- 中也伴侣（P3）：config/companion.json 驱动，音频优先 / 系统 TTS 回落 ---------- */
(function(){
  const CONFIG_URL = "config/companion.json";
  const OFF_KEY = "biaori1_companion_off";
  const POS_KEY = "biaori1_companion_pos";
  const COOLDOWN_MS = 4000;          /* 答题类事件的最小间隔，防止刷屏 */
  const CORRECT_RATE = 0.35;         /* 答对台词的触发概率 */
  const IDLE_MS = 90000;             /* 无操作多久触发闲置彩蛋 */

  let cfg = null, shown = false, curAudio = null, lastFired = 0, idleTimer = null;
  let hasGesture = false, pendingDeferred = null;
  let playing = false, playWaiters = [];   /* 说话状态 + 排队回调：读音等伴侣说完再播 */
  function notifyDone(){
    playing = false;
    const ws = playWaiters; playWaiters = [];
    ws.forEach(f => f());
  }
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
    sprite = makeEl("div", "companion-puppet", stage);   /* 代码手绘 Q 版 SVG 小人（puppet.js） */
    Puppet.mount(sprite);
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
    makeDraggable();
    restorePos();
  }

  /* 整个伴侣盒（气泡+立绘一起）可自由拖动，位置存 localStorage，越界自动夹回视口内 */
  function restorePos(){
    try{
      const p = (localStorage.getItem(POS_KEY) || "").split("|");
      if(p[0] && p[0].endsWith("px") && p[1] && p[1].endsWith("px")){
        const x = Math.min(Math.max(parseFloat(p[0]), 0), innerWidth - 60);
        const y = Math.min(Math.max(parseFloat(p[1]), 0), innerHeight - 60);
        box.style.left = x + "px"; box.style.top = y + "px";
        box.style.right = "auto"; box.style.bottom = "auto";
      }
    }catch(e){}
  }
  function savePos(){
    try{ localStorage.setItem(POS_KEY, box.style.left + "|" + box.style.top); }catch(e){}
  }
  function makeDraggable(){
    let st = null, moved = false;
    function endDrag(doSave, swallowClick){
      if(!st) return;
      const wasMoved = moved;
      st = null; moved = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      box.classList.remove("dragging");
      if(doSave && wasMoved){
        savePos();
        /* 拖动松手产生的那次 click 吞掉，免得误关气泡或误触下层 */
        if(swallowClick) box.addEventListener("click", ev => ev.stopPropagation(), { once: true, capture: true });
      }
    }
    const onMove = e => {
      if(!st || e.pointerId !== st.pid) return;
      /* 松手事件丢失（如在窗口外松开）时兜底：按键已不在按下态就立刻结束 */
      if(!e.buttons){ endDrag(true, false); return; }
      if(!moved && Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > 3){
        moved = true;
        box.classList.add("dragging");
      }
      if(!moved) return;
      const x = Math.min(Math.max(st.ox + e.clientX - st.x, 0), innerWidth - box.offsetWidth);
      const y = Math.min(Math.max(st.oy + e.clientY - st.y, 0), innerHeight - box.offsetHeight);
      box.style.left = x + "px"; box.style.top = y + "px";
    };
    const onUp = e => { if(st && e.pointerId === st.pid) endDrag(true, true); };
    const onCancel = () => endDrag(true, false);
    box.addEventListener("dragstart", e => e.preventDefault());   /* 兜底：盒内任何元素都不许发起原生拖拽 */
    box.addEventListener("pointerdown", e => {
      if(st || e.target === closeBtn || e.button !== 0) return;
      const r = box.getBoundingClientRect();
      box.style.left = r.left + "px"; box.style.top = r.top + "px";
      box.style.right = "auto"; box.style.bottom = "auto";
      st = { x: e.clientX, y: e.clientY, ox: r.left, oy: r.top, pid: e.pointerId };
      moved = false;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    });
    window.addEventListener("blur", () => endDrag(true, false));
  }

  function isOff(){ try{ return localStorage.getItem(OFF_KEY) === "1"; }catch(e){ return false; } }
  function show(){ if(!cfg || isOff()) return; shown = true; box.hidden = false; resetIdle(); }
  function hide(){ shown = false; box.hidden = true; stopAudio(); hideBubble(); clearTimeout(idleTimer); }
  function stopAudio(){
    if(curAudio){ curAudio.pause(); curAudio = null; }
    if("speechSynthesis" in window) speechSynthesis.cancel();
    if(playing) notifyDone();   /* 被掐断也要放行排队中的读音 */
  }
  function hideBubble(){ bubble.hidden = true; }

  function setExpression(key){
    const faces = (cfg && (cfg.puppet || cfg.art) && (cfg.puppet || cfg.art).eventFace) || {};
    Puppet.setFace(faces[key] || "normal");
  }

  function pickLine(ev){
    const pool = (cfg.lines || []).filter(l => l.event === ev);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function speak(line){
    if(!("speechSynthesis" in window)){ notifyDone(); return; }
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = line.lang === "ja" ? "ja-JP" : "zh-CN";
    if(line.voice){
      const v = speechSynthesis.getVoices().find(v => v.name.includes(line.voice));
      if(v) u.voice = v;
    }
    playing = true;
    u.onend = notifyDone;
    u.onerror = notifyDone;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function playLine(line){
    stopAudio();
    playing = true;
    hideBubble();
    bubble.textContent = line.text;
    bubble.classList.toggle("jp", line.lang === "ja");
    bubble.hidden = false;
    /* 音频优先：按 id 自动找 audio/companion/<id>.wav（audio 字段可覆盖路径），加载失败回落 TTS */
    const url = (cfg.audioDir || "audio/companion/") + (line.audio || line.id + ".wav");
    const a = new Audio(url);
    curAudio = a;
    a.addEventListener("error", () => { if(curAudio === a){ curAudio = null; hasGesture ? speak(line) : afterGesture(() => speak(line)); } });
    a.addEventListener("ended", () => { if(curAudio === a){ curAudio = null; notifyDone(); setTimeout(hideBubble, 800); } });
    a.play().catch(err => {
      if(curAudio !== a) return;
      if(!hasGesture && err && err.name === "NotAllowedError") afterGesture(() => playLine(line));
      else speak(line);
    });
  }

  /* 等伴侣说完再执行 cb；没在说话则立即执行（读词音和伴侣语音不抢声道） */
  function afterSpeak(cb){
    if(playing) playWaiters.push(cb);
    else cb();
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
    setExpression(ev);
    playLine(line);
  }

  /* 页面刚打开还没有点击时浏览器会拦截自动播放，此时把这句存起来，等第一次点击/按键再补播 */
  function afterGesture(fn){
    pendingDeferred = fn;
    const go = () => { if(pendingDeferred){ const f = pendingDeferred; pendingDeferred = null; f(); } };
    document.addEventListener("pointerdown", go, { once: true, passive: true });
    document.addEventListener("keydown", go, { once: true, passive: true });
  }

  function resetIdle(){
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if(shown) fire("idle"); }, IDLE_MS);
  }

  ["pointerdown", "keydown"].forEach(evName =>
    document.addEventListener(evName, () => { hasGesture = true; if(shown) resetIdle(); }, { passive: true }));

  fetch(CONFIG_URL).then(r => { if(!r.ok) throw 0; return r.json(); }).then(json => {
    cfg = json;
    buildDom();
    setExpression("normal");
    show();
    fire("greet");   /* 打开页面就打招呼；若还没点击过，语音被自动播放拦截 → afterGesture 等首次交互补播 */
  }).catch(() => {});   /* 配置拿不到（如 file:// 打开）→ 伴侣整体静默 */

  window.Companion = { fire, show, hide, afterSpeak };
})();
