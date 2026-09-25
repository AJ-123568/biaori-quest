/* ---------- 中也小人（P3.5）：代码手绘 Q 版 SVG 布偶，分层供动作/换装驱动 ---------- */
(function(){
  /* 部件分层（后→前）：披风(大衣)→后发→腿→身体(马甲)→手臂→围巾→头(脸→表情→前发→眼镜→帽) */

  const SVG = `
<svg class="puppet" viewBox="0 0 200 234" xmlns="http://www.w3.org/2000/svg" aria-label="中也">
  <ellipse id="pp-shadow" cx="100" cy="225" rx="44" ry="7" fill="rgba(35,40,43,.16)"/>
  <g id="pp-all">

    <g id="pp-o-coat" display="none">
      <path d="M100,146 Q58,150 50,184 L47,199 Q46,205 54,205 L146,205 Q154,205 153,199 L150,184 Q142,150 100,146 Z" fill="#26262c"/>
      <path d="M50,197 Q100,205 150,197 L153,199 Q154,205 146,205 L54,205 Q46,205 47,199 Z" fill="#6E4B33"/>
      <path d="M73,147 Q80,155 75,166 L66,157 Q68,149 73,147 Z" fill="#26262c"/>
      <path d="M127,147 Q120,155 125,166 L134,157 Q132,149 127,147 Z" fill="#26262c"/>
    </g>

    <g id="pp-hair-back">
      <path d="M55,82 Q45,112 48,138 Q49,150 41,155 Q52,159 61,150 Q71,141 72,124 L72,102 Q61,94 55,82 Z" fill="#C65A2E"/>
      <path d="M145,82 Q155,112 152,138 Q151,150 159,155 Q148,159 139,150 Q129,141 128,124 L128,102 Q139,94 145,82 Z" fill="#C65A2E"/>
    </g>

    <g id="pp-legs">
      <rect x="85" y="192" width="13" height="21" rx="4" fill="#1E1E24"/>
      <rect x="102" y="192" width="13" height="21" rx="4" fill="#1E1E24"/>
      <rect x="81" y="210" width="20" height="12" rx="4" fill="#1E1E24"/>
      <rect x="99" y="210" width="20" height="12" rx="4" fill="#1E1E24"/>
      <rect x="81" y="219" width="20" height="3" rx="1.5" fill="#101014"/>
      <rect x="99" y="219" width="20" height="3" rx="1.5" fill="#101014"/>
    </g>

    <g id="pp-body">
      <path d="M74,152 Q100,144 126,152 L122,196 Q100,203 78,196 Z" fill="#33333B"/>
      <path d="M88,148 L100,159 L112,148 L113,155 L100,166 L87,155 Z" fill="#F7F4EC"/>
      <path d="M100,161 l4.5,6 -4.5,13 -4.5,-13 Z" fill="#26262c"/>
      <path d="M81,154 L111,188" stroke="#A4693B" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M119,154 L89,188" stroke="#A4693B" stroke-width="7" stroke-linecap="round" fill="none"/>
      <rect x="96" y="167" width="9" height="7" rx="1.5" fill="#D8D8DE" stroke="#8a8a92" stroke-width="1"/>
      <rect x="90" y="144" width="20" height="5" rx="2.5" fill="#1c1c22"/>
    </g>

    <g id="pp-armL">
      <rect x="61" y="154" width="17" height="40" rx="8" fill="#2A2A32"/>
      <rect x="62" y="185" width="15" height="4.5" rx="2" fill="#8C5B38"/>
      <circle cx="69.5" cy="200" r="8.5" fill="#1E1E24"/>
    </g>
    <g id="pp-armR">
      <rect x="122" y="154" width="17" height="40" rx="8" fill="#2A2A32"/>
      <rect x="123" y="185" width="15" height="4.5" rx="2" fill="#8C5B38"/>
      <circle cx="130.5" cy="200" r="8.5" fill="#1E1E24"/>
    </g>

    <g id="pp-o-scarf" display="none">
      <path d="M72,145 Q100,158 128,145 L128,159 Q100,172 72,159 Z" fill="#C43B3B"/>
      <path d="M118,159 L114,184 Q113,190 120,190 L127,187 Q123,172 126,161 Z" fill="#C43B3B"/>
      <path d="M78,151 Q100,162 122,151" stroke="#9C2B2B" stroke-width="2" fill="none"/>
    </g>

    <g id="pp-head">
      <ellipse cx="100" cy="98" rx="49" ry="45" fill="#FCE8D5"/>

      <g id="pp-brows">
        <g id="pp-b-normal">
          <path d="M68,88 Q78,84 88,87" stroke="#B55E2C" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M132,88 Q122,84 112,87" stroke="#B55E2C" stroke-width="3" stroke-linecap="round" fill="none"/>
        </g>
        <g id="pp-b-happy" display="none">
          <path d="M68,84 Q78,79 88,83" stroke="#B55E2C" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M132,84 Q122,79 112,83" stroke="#B55E2C" stroke-width="3" stroke-linecap="round" fill="none"/>
        </g>
        <g id="pp-b-angry" display="none">
          <path d="M68,91 Q78,87 88,79" stroke="#8f4522" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <path d="M132,91 Q122,87 112,79" stroke="#8f4522" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        </g>
      </g>

      <g id="pp-eyes">
        <g id="pp-eyes-open">
          <path d="M69,100 Q79,94 89,99" stroke="#2A1E14" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <path d="M131,100 Q121,94 111,99" stroke="#2A1E14" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <ellipse cx="79" cy="107" rx="8.5" ry="10" fill="#fff"/>
          <ellipse cx="121" cy="107" rx="8.5" ry="10" fill="#fff"/>
          <ellipse cx="79" cy="108" rx="6.5" ry="8" fill="#4F86C6"/>
          <ellipse cx="121" cy="108" rx="6.5" ry="8" fill="#4F86C6"/>
          <ellipse cx="79" cy="109" rx="3" ry="4" fill="#16243C"/>
          <ellipse cx="121" cy="109" rx="3" ry="4" fill="#16243C"/>
          <circle cx="76.5" cy="104" r="2.2" fill="#fff"/>
          <circle cx="118.5" cy="104" r="2.2" fill="#fff"/>
          <circle cx="82.5" cy="112" r="1.1" fill="#fff" opacity=".85"/>
          <circle cx="124.5" cy="112" r="1.1" fill="#fff" opacity=".85"/>
        </g>
        <g id="pp-eyes-happy" display="none">
          <path d="M69,106 Q79,96 89,106" stroke="#2A1E14" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M131,106 Q121,96 111,106" stroke="#2A1E14" stroke-width="4" stroke-linecap="round" fill="none"/>
        </g>
        <g id="pp-eyes-sleepy" display="none">
          <path d="M69,103 Q79,108 89,103" stroke="#2A1E14" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          <path d="M131,103 Q121,108 111,103" stroke="#2A1E14" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        </g>
      </g>

      <path d="M99.5,116 l2,3.5" stroke="#E0B18C" stroke-width="2" stroke-linecap="round" fill="none"/>

      <g id="pp-mouths">
        <path id="pp-m-smile" d="M92,128 Q100,134 108,128" stroke="#8A4A2F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path id="pp-m-grin" display="none" d="M88,125 Q100,120 112,125 Q110,137 100,138 Q90,137 88,125 Z" fill="#7C3A2A"/>
        <path id="pp-m-grin-fang" display="none" d="M92,125 L97,125 L94.5,131 Z" fill="#fff"/>
        <path id="pp-m-angry" display="none" d="M89,125 Q100,121 111,125 L107,137 Q100,140 93,137 Z" fill="#5C2A1E"/>
        <path id="pp-m-sleepy" display="none" d="M92,131 q4,-3.5 8,0 q4,3.5 8,0" stroke="#8A4A2F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </g>

      <ellipse cx="64" cy="119" rx="7" ry="4" fill="#F6A98F" opacity=".45"/>
      <ellipse cx="136" cy="119" rx="7" ry="4" fill="#F6A98F" opacity=".45"/>

      <g id="pp-hair-front">
        <path d="M52,96 L46,66 Q46,46 60,42 Q74,36 100,35 Q126,36 140,42 Q154,46 154,66 L148,96 Q100,78 52,96 Z" fill="#EA7A45"/>
        <path d="M48,52 L152,52 L152,58 Q146,82 140,92 L133,84 L124,93 L116,84 L106,94 L96,84 L86,93 L78,84 L68,92 L60,84 Q52,74 48,58 Z" fill="#EA7A45"/>
        <path d="M64,58 Q63,68 66,79" stroke="#C65A2E" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M136,58 Q137,68 134,79" stroke="#C65A2E" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M43,48 Q37,84 40,112 Q42,126 53,124 Q60,122 59,106 Q55,80 51,50 Z" fill="#EA7A45"/>
        <path d="M157,48 Q163,84 160,112 Q158,126 147,124 Q140,122 141,106 Q145,80 149,50 Z" fill="#EA7A45"/>
        <path d="M47,78 Q44,96 47,110" stroke="#C65A2E" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M153,78 Q156,96 153,110" stroke="#C65A2E" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </g>

      <g id="pp-o-glasses" display="none">
        <circle cx="79" cy="107" r="15.5" fill="rgba(255,255,255,.10)" stroke="#C9A227" stroke-width="2.5"/>
        <circle cx="121" cy="107" r="15.5" fill="rgba(255,255,255,.10)" stroke="#C9A227" stroke-width="2.5"/>
        <path d="M94.5,106 L105.5,106" stroke="#C9A227" stroke-width="2.5"/>
        <path d="M63.5,104 L52,99" stroke="#C9A227" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M136.5,104 L148,99" stroke="#C9A227" stroke-width="2.5" stroke-linecap="round"/>
      </g>

      <g id="pp-hat" transform="rotate(-3 100 50)">
        <path d="M60,46 Q62,25 100,22 Q138,25 140,46 Q100,58 60,46 Z" fill="#26262c"/>
        <path d="M62,38 Q100,52 138,38 L138,48 Q100,62 62,48 Z" fill="#8C5B38"/>
        <path d="M74,44 L77,51" stroke="#5E3A22" stroke-width="3" stroke-linecap="round"/>
        <path d="M90,48 L93,55" stroke="#5E3A22" stroke-width="3" stroke-linecap="round"/>
        <path d="M108,49 L110,56" stroke="#5E3A22" stroke-width="3" stroke-linecap="round"/>
        <path d="M124,46 L127,53" stroke="#5E3A22" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="100" cy="50" rx="60" ry="13.5" fill="#26262c"/>
        <circle cx="157" cy="60" r="2.2" fill="none" stroke="#C9A227" stroke-width="1.6"/>
        <circle cx="160" cy="67" r="2.2" fill="none" stroke="#C9A227" stroke-width="1.6"/>
        <circle cx="157" cy="73" r="2.2" fill="none" stroke="#C9A227" stroke-width="1.6"/>
      </g>
    </g>

  </g>
</svg>`;

  /* 表情 → 五官组合（idle=犯困） */
  const FACES = {
    normal: { eyes: "open",  mouth: "smile",  brows: "normal" },
    happy:  { eyes: "happy", mouth: "grin",   brows: "happy"  },
    angry:  { eyes: "open",  mouth: "angry",  brows: "angry"  },
    idle:   { eyes: "sleepy", mouth: "sleepy", brows: "normal" }
  };

  let root = null, face = "normal", blinkTimer = null;
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

  /* 换装：head='hat'|'none'，body='coat'|'vest'（后续服装在阶段4扩展），acc={scarf,glasses} */
  function setWorn(w){
    w = w || {};
    show("pp-hat", (w.head || "hat") === "hat");
    show("pp-o-coat", (w.body || "coat") === "coat");
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

  function mount(container){
    if(!container || root) return root;
    container.innerHTML = SVG;
    root = container.querySelector("svg");
    setFace("normal");
    setWorn({});
    scheduleBlink();
    return root;
  }

  window.Puppet = { mount, setFace, setWorn };
})();
