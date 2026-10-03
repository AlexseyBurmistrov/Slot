/* ============================================================
   COLLEAGUES — генерация, рендер, обиды, примирение
   ============================================================ */
   window.Colleagues = (function(){
    var C = window.CONFIG, S = window.State, D = window.Departments, UI = window.UI, A = window.Audio2;
  
    function rndInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
  
    function make(){
      var d = D.random();
      return {
        id: "c_" + Math.random().toString(36).slice(2,9),
        name: D.randomName(),
        dept: d.dept, deptFull: d.deptFull,
        debtScore: rndInt(C.colleagues.startDebtScoreMin, C.colleagues.startDebtScoreMax),
        grudge: 0,
        loans: []
      };
    }
    function ensure(){
      if (!S.state.colleagues.length){
        for (var i=0;i<C.colleagues.count;i++) S.state.colleagues.push(make());
      }
      S.state.colleagues.forEach(function(c){ if (typeof c.grudge !== "number") c.grudge = 0; });
    }
    function ratingFor(s){
      if (s < 25) return {l:"A", cls:"a"};
      if (s < 50) return {l:"B", cls:"b"};
      if (s < 75) return {l:"C", cls:"c"};
      return {l:"D", cls:"d"};
    }
    function moodFor(g){
      if (g >= C.colleagues.enemyThreshold) return "🤬";
      if (g >= 50) return "😡";
      if (g >= 30) return "😠";
      if (g >= 15) return "😒";
      if (g > 0)   return "😐";
      return "🙂";
    }
    function fixCost(c){
      return Math.round(C.colleagues.fixBaseCost + (c.grudge || 0) * C.colleagues.fixCostPerGrudge);
    }
    function fixChance(c){
      var g = c.grudge || 0;
      if (g >= C.colleagues.enemyThreshold) return 0;
      if (g >= 60) return C.colleagues.fixChance.high.chance;
      if (g >= 40) return C.colleagues.fixChance.mid.chance;
      return C.colleagues.fixChance.low.chance;
    }
  
    /* Кулдаун действует ТОЛЬКО если уже была хотя бы одна попытка.
       На старте (lastFixAttempt = 0) кулдауна нет. */
    function fixCooldownLeft(){
      if (!S.state.lastFixAttempt) return 0;
      var diff = S.state.currentTick - S.state.lastFixAttempt;
      return Math.max(0, C.colleagues.fixCooldownTicks - diff);
    }
  
    function render(){
      var box = UI.$("colleagues"); if (!box) return;
      box.innerHTML = "";
      S.state.colleagues.forEach(function(c){
        var r = ratingFor(c.debtScore);
        var mood = moodFor(c.grudge || 0);
        var g = c.grudge || 0;
        var refuses = g >= C.colleagues.refuseThreshold;
        var enemy = g >= C.colleagues.enemyThreshold;
        var div = document.createElement("div");
        div.className = "colleague" + (g >= 30 ? " angry" : "") + (g >= 50 ? " hostile" : "") + (g >= C.colleagues.enemyThreshold ? " enemy" : "");
  
        var fixButton = "";
        if (g > 0 && !enemy){
          var cost = fixCost(c);
          var ch = fixChance(c);
          var cd = fixCooldownLeft();
          /* Кнопка всегда кликабельна. Кулдаун / нехватка CR показываются метками
             и сообщением в логе при клике. */
          var cdLabel = cd > 0 ? ' • ⏳' + (cd * 5) + 'с' : '';
          var crLabel = (S.state.bank < cost) ? ' • 💸' : '';
          fixButton =
            '<button class="loan-btn-sm fix" type="button" data-act="fix">' +
              '🤝 ПОПЫТКА (' + UI.fmt(cost) + ' CR)' +
              '<span class="chance">шанс ' + Math.round(ch*100) + '%' + cdLabel + crLabel + '</span>' +
            '</button>';
        } else if (enemy){
          fixButton = '<button class="loan-btn-sm enemy" type="button" disabled>💀 ВРАГ НАВСЕГДА</button>';
        }
  
        div.innerHTML =
          '<div class="cname"><span>' + c.name + '</span><span class="mood">' + mood + '</span></div>' +
          '<div class="cdept">' + c.dept + ' • рейтинг <span class="rating ' + r.cls + '">' + r.l + '</span></div>' +
          '<div class="bar"><i style="width:' + c.debtScore + '%"></i></div>' +
          '<div class="meta"><span>закредитованность</span><b>' + c.debtScore + '%</b></div>' +
          (g > 0
            ? '<div class="bar grudge"><i style="width:' + g + '%"></i></div>' +
              '<div class="meta grudge"><span>обида</span><b>' + g + '%</b></div>'
            : '') +
          '<div class="meta"><span>займов</span><b>' + c.loans.length + '</b></div>' +
          (refuses
            ? '<button class="loan-btn-sm" type="button" disabled>🚫 ОТКАЗЫВАЕТ</button>'
            : '<button class="loan-btn-sm" type="button" data-act="loan"' + (S.state.resting ? ' disabled' : '') + '>💸 ВЗЯТЬ ЗАЙМ</button>') +
          fixButton;
  
        var b1 = div.querySelector('[data-act="loan"]');
        if (b1) b1.addEventListener("click", function(){ window.Loans.takeOnColleague(c, b1); });
        var b2 = div.querySelector('[data-act="fix"]');
        if (b2) b2.addEventListener("click", function(){ fix(c, b2); });
        box.appendChild(div);
      });
    }
  
    function fix(c, btn){
      if (S.state.spinning || S.state.resting){
        UI.pushEvent("bad","⏳","Сейчас нельзя — идёт другой процесс.");
        A.alarm();
        return;
      }
      var g = c.grudge || 0;
      if (g <= 0){
        UI.pushEvent("bad","🙂","Не с кем мириться.");
        return;
      }
      if (g >= C.colleagues.enemyThreshold){
        UI.pushEvent("bad","💀", c.name + " — враг навсегда. Помириться нельзя.");
        A.alarm();
        return;
      }
      var cd = fixCooldownLeft();
      if (cd > 0){
        UI.pushEvent("bad","⏳","Слишком часто. Подожди ещё " + (cd * 5) + " сек.");
        A.alarm();
        return;
      }
      var cost = fixCost(c);
      if (S.state.bank < cost){
        UI.pushEvent("bad","💸","Нужно " + UI.fmt(cost) + " CR на попытку, а у тебя " + UI.fmt(S.state.bank) + ".");
        A.alarm();
        return;
      }
  
      S.state.bank -= cost;
      S.state.lastFixAttempt = S.state.currentTick;
      UI.floatAtEl("−" + cost + " CR", "bad", btn);
  
      var success = Math.random() < fixChance(c);
      if (success){
        var drop = rndInt(C.colleagues.fixGrudgeDropMin, C.colleagues.fixGrudgeDropMax);
        var before = g;
        c.grudge = Math.max(0, g - drop);
        S.state.trust = Math.min(100, S.state.trust + C.loans.trustGainOnFixSuccess);
        UI.pushEvent("good","🤝","УСПЕХ! " + c.name + " смягчился (обида " + before + "→" + c.grudge + ").");
        A.fixGood();
      } else {
        c.grudge = Math.min(100, g + C.colleagues.fixGrudgePenaltyOnFail);
        S.state.trust = Math.max(0, S.state.trust - C.loans.trustLossOnFixFail);
        UI.pushEvent("bad","💢","ПРОВАЛ! " + c.name + " взбесился (обида +" + C.colleagues.fixGrudgePenaltyOnFail + ", доверие −" + C.loans.trustLossOnFixFail + ").");
        A.fixBad();
      }
      S.save();
      window.Loans.render();
    }
  
    return {
      make: make, ensure: ensure, render: render, fix: fix,
      ratingFor: ratingFor, moodFor: moodFor,
      fixCost: fixCost, fixChance: fixChance, fixCooldownLeft: fixCooldownLeft
    };
  })();