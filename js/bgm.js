/* 背景音乐：顶栏音符按钮点播/暂停，日系治愈 lo-fi 循环垫底。
   音频优先用 standalone 内联源（window.__BGM_SRC__），文件缺失静默禁用。
   独立于 sfx / 伴侣语音体系；不做持久化——每次进页默认暂停，点按钮才开始。 */
(function(){
  "use strict";
  const BGM_VOLUME = 0.25;   /* 低存在感；实测盖读音就调这里 */
  const btn = document.getElementById("bgmBtn");
  const audio = new Audio(window.__BGM_SRC__ || "audio/bgm/bgm-01.mp3");
  audio.loop = true;
  audio.volume = BGM_VOLUME;
  audio.preload = "none";   /* 进页不预载，点了才拉流 */
  let broken = false, playing = false;

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

  if(btn) btn.addEventListener("click", toggle);

  window.Bgm = { toggle, play, pause };
})();
