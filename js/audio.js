/* ============================================================
   AUDIO — Web Audio API. Без внешних файлов.
   ============================================================ */
   window.Audio2 = (function(){
    var ctx = null;
    var enabled = true;
  
    function ac(){
      if (!enabled) return null;
      try{
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
      }catch(e){ return null; }
    }
    function tone(f, d, t, g){
      var c = ac(); if (!c) return;
      try{
        var o = c.createOscillator(), gn = c.createGain();
        o.type = t || "sine"; o.frequency.value = f;
        gn.gain.value = g != null ? g : 0.08;
        o.connect(gn); gn.connect(c.destination);
        var now = c.currentTime;
        gn.gain.setValueAtTime(gn.gain.value, now);
        gn.gain.exponentialRampToValueAtTime(0.0001, now + d);
        o.start(now); o.stop(now + d + 0.02);
      }catch(e){}
    }
    return {
      setEnabled: function(v){ enabled = !!v; },
      isEnabled: function(){ return enabled; },
      click:    function(){ tone(700, 0.05, "square", 0.03); },
      tick:     function(){ tone(500 + Math.random()*400, 0.03, "square", 0.02); },
      stop:     function(){ tone(300, 0.12, "triangle", 0.08); setTimeout(function(){ tone(220, 0.15, "sine", 0.06); }, 60); },
      win:      function(){ [523,659,784,1047].forEach(function(f,i){ setTimeout(function(){ tone(f, 0.18, "triangle", 0.09); }, i*90); }); },
      lose:     function(){ tone(180, 0.25, "sawtooth", 0.06); setTimeout(function(){ tone(120, 0.35, "sawtooth", 0.05); }, 120); },
      cash:     function(){ [800,1000,1200,1500].forEach(function(f,i){ setTimeout(function(){ tone(f, 0.08, "square", 0.05); }, i*50); }); },
      alarm:    function(){ [880,660,880,660].forEach(function(f,i){ setTimeout(function(){ tone(f, 0.15, "sawtooth", 0.06); }, i*120); }); },
      accrue:   function(){ tone(220, 0.2, "sine", 0.05); },
      yawn:     function(){ tone(180, 0.35, "sine", 0.05); setTimeout(function(){ tone(150, 0.45, "sine", 0.04); }, 200); },
      fixGood:  function(){ [500,700,900,1200].forEach(function(f,i){ setTimeout(function(){ tone(f, 0.15, "triangle", 0.08); }, i*80); }); },
      fixBad:   function(){ [300,200,150].forEach(function(f,i){ setTimeout(function(){ tone(f, 0.15, "sawtooth", 0.06); }, i*100); }); }
    };
  })();