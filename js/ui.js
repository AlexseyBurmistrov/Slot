/* ============================================================
   UI — header, лог событий, всплывашки
   ============================================================ */
   window.UI = (function(){
    var C = window.CONFIG, S = window.State;
  
    function $(id){ return document.getElementById(id); }
    function fmt(n){ try{ return Number(Math.round(n)).toLocaleString("ru-RU"); }catch(e){ return String(n); } }
  
    function renderHeader(){
      $("bank").textContent = fmt(S.state.bank);
      $("trustVal").textContent = Math.round(S.state.trust);
      $("crimVal").textContent = Math.round(S.state.crim);
      $("fatVal").textContent = Math.round(S.state.fatigue);
      var hp = Math.round(S.state.health);
      $("hpVal").textContent = hp;
      var chip = $("healthChip");
      if (chip) chip.classList.toggle("low", hp <= C.health.lowThreshold);
      var fatBar = $("fatBar"); if (fatBar) fatBar.style.width = S.state.fatigue + "%";
      var fatText = $("fatText"); if (fatText) fatText.textContent = Math.round(S.state.fatigue) + "%";
      $("betLabel").textContent = S.state.bet;
      var fee = $("feeLabel"); if (fee) fee.textContent = C.slot.spinFee;
      var mi = $("multiplierInfo");
      if (mi) mi.textContent =
        "x" + C.slot.multiplierSingle + " / x" + C.slot.multiplierPair + " / x" + C.slot.multiplierTriple;
    }
  
    function updateEventsCounter(){
      var box = $("events"); var counter = $("eventsCounter");
      if (!box || !counter) return;
      counter.textContent = box.children.length;
    }
  
    function pushEvent(kind, emoji, text){
      var box = $("events"); if (!box) return;
      var empty = box.querySelector(".events-empty");
      if (empty) empty.remove();
      var el = document.createElement("div");
      el.className = "ev";
      var cls = kind === "bad" ? "bad" : (kind === "good" ? "good" : "");
      var t = new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
      el.innerHTML = '<span class="evtime">' + t + '</span><span class="evtag ' + cls + '">' + emoji + '</span><span class="evtext">' + text + '</span>';
      box.insertBefore(el, box.firstChild);
      while (box.children.length > C.eventsMax) box.removeChild(box.lastChild);
      box.scrollTop = 0;
      updateEventsCounter();
    }
  
    function renderEventsEmpty(){
      var box = $("events"); if (!box) return;
      if (!box.children.length){
        box.innerHTML = '<div class="events-empty">Пока тихо. Сделай спин или возьми займ — события появятся здесь.</div>';
      }
      updateEventsCounter();
    }
  
    /* Запись раунда прямо в лог событий */
    function pushRound(reelsText, pickShort, won, bet, payout, mult){
      var arrow = reelsText.join(" • ");
      if (won){
        pushEvent("good", "🎰", "Раунд: " + arrow + " → +" + fmt(payout) + " CR (x" + mult + ") • ставка на " + pickShort);
      } else {
        pushEvent("bad", "🎰", "Раунд: " + arrow + " → −" + fmt(bet) + " CR • ставка на " + pickShort + " не выпала");
      }
    }
  
    function floatNum(text, color, x, y){
      var el = document.createElement("div");
      el.className = "float " + (color === "good" ? "good" : "bad");
      el.textContent = text;
      el.style.left = (x || (window.innerWidth/2 - 30)) + "px";
      el.style.top  = (y || (window.innerHeight/2)) + "px";
      document.body.appendChild(el);
      setTimeout(function(){ el.remove(); }, 1200);
    }
    function floatAtEl(text, color, el){
      if (!el) return floatNum(text, color);
      var r = el.getBoundingClientRect();
      floatNum(text, color, r.left + r.width/2 - 20, r.top + r.height/2 - 10);
    }
  
    return {
      $: $, fmt: fmt,
      renderHeader: renderHeader,
      pushEvent: pushEvent, renderEventsEmpty: renderEventsEmpty, updateEventsCounter: updateEventsCounter,
      pushRound: pushRound,
      floatNum: floatNum, floatAtEl: floatAtEl
    };
  })();