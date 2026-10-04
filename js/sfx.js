/* 8-bit 音效层：WebAudio 现场合成短提示音。
   完全独立于伴侣语音体系（自带 AudioContext，不排队不重试），音效失败静默不影响主流程。 */
(function(){
  "use strict";
  let ctx = null, master = null;

  /* 音色参数总表（调音色只动这里）：
     每首 { w: 波形, notes: [ [频率Hz, 起始s, 时长s, 滑向Hz(可省)] ... ] }，总长全部 ≤0.6s */
  const TUNES = {
    correct: { w: "square",   notes: [[523.25, 0, .08], [783.99, .08, .14]] },                              /* 两音上行 C5→G5 */
    wrong:   { w: "square",   notes: [[329.63, 0, .25, 196.00]] },                                    /* 方波下滑 E4→G3 */
    combo:   { w: "square",   notes: [[523.25, 0, .06], [659.25, .06, .06], [783.99, .12, .14]] },    /* 三连琶音 C5 E5 G5 */
    star:    { w: "sine",     notes: [[1567.98, 0, .18]] },                                           /* 高频 ping G6 */
    clear:   { w: "square",   notes: [[392.00, 0, .11], [523.25, .11, .11], [659.25, .22, .11], [783.99, .33, .25]] },  /* 四音号角 */
    levelup: { w: "square",   notes: [[523.25, 0, .09], [659.25, .09, .09], [783.99, .18, .09], [1046.50, .27, .26]] }, /* 四音 fanfare */
    demote:  { w: "square",   notes: [[392.00, 0, .14], [261.63, .16, .26]] },                        /* 下行两音 G4→C4 */
    buy:     { w: "triangle", notes: [[987.77, 0, .06], [1318.51, .07, .12]] }                        /* 双音收银 B5→E6 */
  };

  function isOff(){ try{ return localStorage.getItem("biaori1_sfx_off") === "1"; }catch(e){ return false; } }
  function setOff(v){ try{ v ? localStorage.setItem("biaori1_sfx_off", "1") : localStorage.removeItem("biaori1_sfx_off"); }catch(e){} }

  function play(name){
    if(isOff()) return;
    const tune = TUNES[name];
    if(!tune) return;
    try{
      if(!ctx){
        const AC = window.AudioContext || window.webkitAudioContext;
        if(!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.12;   /* 总音量，调响度只动这里 */
        master.connect(ctx.destination);
      }
      if(ctx.state === "suspended"){ ctx.resume().catch(() => {}); return; }   /* 首次点击前被浏览器拦截就放弃这枚音 */
      const t0 = ctx.currentTime;
      tune.notes.forEach(n => {
        const f = n[0], at = t0 + n[1], dur = n[2];
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = tune.w;
        osc.frequency.setValueAtTime(f, at);
        if(n[3]) osc.frequency.exponentialRampToValueAtTime(n[3], at + dur);   /* 滑音 */
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(1, at + 0.008);   /* 8ms 快起音，防爆音 */
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(g); g.connect(master);
        osc.start(at); osc.stop(at + dur + 0.02);
      });
    }catch(e){ /* 静默放弃 */ }
  }

  window.Sfx = { play, isOff, setOff };
})();
