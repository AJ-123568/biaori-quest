/* 背景音乐：顶栏音符按钮单击播放/暂停（260ms 延迟区分双击）、双击开音量弹窗（main.js 监听 bgmdbl 由本文件派发…改为原生 dblclick，弹窗逻辑在 main.js）。
   音频优先用 standalone 内联源（window.__BGM_SRC__），文件缺失静默禁用。
   独立于 sfx / 伴侣语音体系；音量持久化 localStorage biaori1_bgm_vol，播放状态不持久化。 */
(function(){
  "use strict";
  const btn = document.getElementById("bgmBtn");
  const audio = new Audio(window.__BGM_SRC__ || "audio/bgm/bgm-01.mp3");
  audio.loop = true;
  audio.preload = "none";
  let broken = false, playing = false;

  /* 音量：0~100，localStorage biaori1_bgm_vol 持久化（0 是合法值，不能用 ||25 兜底） */
  let vol = 25;
  try{
    const n = parseInt(localStorage.getItem("biaori1_bgm_vol"), 10);
    vol = isNaN(n) ? 25 : Math.min(100, Math.max(0, n));
  }catch(e){}
  audio.volume = vol / 100;

  /* 单/双击区分：单击起 260ms 定时器，窗口期内第二击取消播放切换（由 main.js 的 dblclick 开音量弹窗） */
  let clickTimer = null;
  if(btn) btn.addEventListener("click", () => {
    if(clickTimer){ clearTimeout(clickTimer); clickTimer = null; return; }
    clickTimer = setTimeout(() => { clickTimer = null; toggle(); }, 260);
  });

  /* 旋转状态机：未播=无类；播放=.spinning；暂停=.spinning.paused（CSS 冻结当前角度，不重置） */
  function setSpin(on){
    if(!btn) return;
    btn.classList.add("spinning");
    btn.classList.toggle("paused", !on);
  }
  function clearSpin(){
    if(!btn) return;
    btn.classList.remove("spinning");
    btn.classList.remove("paused");
  }
  function play(){
    if(broken) return;
    audio.play().then(() => { playing = true; setSpin(true); }).catch(() => {});
  }
  function pause(){
    if(broken) return;
    audio.pause();
    playing = false;
    setSpin(false);   /* 冻结：保留 .spinning，加 .paused 让动画停在当前帧 */
  }
  function stop(){   /* 文件损坏时回退：彻底归零 */
    playing = false;
    clearSpin();
  }
  function toggle(){ playing ? pause() : play(); }

  audio.addEventListener("error", () => { broken = true; audio.pause(); stop(); });
  audio.addEventListener("playing", () => setSpin(true));
  audio.addEventListener("ended", () => setSpin(false));   /* loop=true 理论不到这，兜底 */

  function setVolume(v){
    vol = Math.min(100, Math.max(0, Math.round(v)));
    audio.volume = vol / 100;
    try{ localStorage.setItem("biaori1_bgm_vol", String(vol)); }catch(e){}
    document.dispatchEvent(new CustomEvent("bgmvol", { detail: vol }));
  }

  window.Bgm = { toggle, play, pause, setVolume, getVolume: () => vol };
})();
