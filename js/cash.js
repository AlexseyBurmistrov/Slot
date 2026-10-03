/* ============================================================
   CASH — IT-способы вернуть платёж, усталость, отдых
   ============================================================ */
   window.Cash = (function(){
    var C = window.CONFIG, S = window.State, UI = window.UI, A = window.Audio2;
  
    function rndInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
    function methodGroup(m){
      if (m.fatigueAdd <= 15) return "easy";
      if (m.fatigueAdd <= 30) return "mid";
      return "hard";
    }
    function effectiveChance(m){
      var f = S.state.fatigueByMethod[m.id] || 0;
      var ch = m.chance;
      if (f >= C.fatigue.methodBlockAt) ch = 0;
      else if (f >= 70) ch *= C.fatigue.methodPenalty70;
      else if (f >= 50) ch *= C.fatigue.methodPenalty50;
      var gMul = 1 - (S.state.fatigue / 100) * C.fatigue.fatigueGlobalPenalty;
      ch *= Math.max(0.4, gMul);
      // штраф за низкое HP
      if (S.state.health <= C.health.lowThreshold) ch *= C.health.lowHpChanceMult;
      return Math.max(0, Math.min(1, ch));
    }
    function applyResult(m, result){
      if (result.cr != null){
        var cr = Array.isArray(result.cr) ? rndInt(result.cr[0], result.cr[1]) : result.cr;
        S.state.bank += cr;
        return { cr: cr, text: (result.text || "").replace("{cr}", UI.fmt(cr)) };
      }
      return { cr: 0, text: result.text || "" };
    }
    function fatigueMood(f){
      if (f >= C.fatigue.methodBlockAt) return "🤯";
      if (f >= 70) return "🥵";
      if (f >= 50) return "😫";
      if (f >= 30) return "😐";
      return "😀";
    }
  
    function render(){
      var body = UI.$("cashBody"); if (!body) return;
      var panel = UI.$("cashPanel");
      var debt = window.Loans.totalDebt();
      if (debt <= 0) panel.classList.remove("urgent"); else panel.classList.add("urgent");
      body.innerHTML = "";
  
      if (S.state.resting){
        var note = document.createElement("div");
        note.className = "rest-note";
        note.textContent = "😴 Отдыхаешь... осталось " + S.state.restLeft + " сек.";
        UI.$("restNote").innerHTML = "";
        UI.$("restNote").appendChild(note);
      } else {
        UI.$("restNote").innerHTML = "";
      }
      if (debt <= 0){
        var n2 = document.createElement("div");
        n2.className = "cash-empty";
        n2.textContent = "✅ Ты свободен от долгов! Способы всё равно доступны.";
        body.appendChild(n2);
      }
      var groups = [
        {id:"easy", title:"🟢 ЛЁГКИЕ (мало устают)"},
        {id:"mid", title:"🟡 СРЕДНИЕ"},
        {id:"hard", title:"🔴 ТЯЖЁЛЫЕ (сильно устаёшь)"}
      ];
      groups.forEach(function(g){
        var group = C.cashMethods.filter(function(m){ return methodGroup(m) === g.id; });
        if (!group.length) return;
        var title = document.createElement("div");
        title.style.cssText = "grid-column:1/-1;font-size:11px;color:#8affb3;font-weight:900;letter-spacing:.06em;margin:8px 0 2px;opacity:.85";
        title.textContent = g.title;
        var grid = document.createElement("div");
        grid.className = "cash-grid";
        group.forEach(function(m){
          var cd = S.state.cashCd[m.id] || 0;
          var f = S.state.fatigueByMethod[m.id] || 0;
          var ch = effectiveChance(m);
          var blocked = f >= C.fatigue.methodBlockAt;
          var disabled = cd > 0 || (m.cost && S.state.bank < m.cost) || blocked || S.state.resting;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "cash-btn" + (cd > 0 ? " cd" : "") + (blocked ? " tired" : "");
          btn.disabled = disabled;
          var costStr = m.cost > 0 ? ("−" + m.cost + " CR") : "бесплатно";
          var tag = g.id === "easy" ? '<span class="cash-tag easy">легко</span>' : (g.id === "mid" ? '<span class="cash-tag mid">средне</span>' : '<span class="cash-tag hard">тяжело</span>');
          btn.innerHTML =
            '<span class="cb-mood">' + fatigueMood(f) + '</span>' +
            '<div class="cb-name">' + m.name + ' ' + tag + '</div>' +
            '<div class="cb-desc">' + m.desc + '</div>' +
            '<div class="cb-foot"><span class="cb-cost' + (m.cost ? '' : ' free') + '">' + costStr + '</span><span class="cb-chance">' + Math.round(ch*100) + '%</span></div>' +
            '<div class="fat-bar"><i style="width:' + f + '%"></i></div>' +
            (cd > 0 ? '<div class="cb-cd">⏳ ' + cd + ' сек</div>' : '') +
            (blocked ? '<div class="cb-cd">🤯 вымотан</div>' : '');
          btn.addEventListener("click", function(){ doMethod(m, btn); });
          grid.appendChild(btn);
        });
        body.appendChild(title);
        body.appendChild(grid);
      });
    }
  
    function doMethod(m, btn){
      if (S.state.spinning || S.state.resting) return;
      if ((S.state.cashCd[m.id] || 0) > 0) return;
      var f = S.state.fatigueByMethod[m.id] || 0;
      if (f >= C.fatigue.methodBlockAt){ UI.pushEvent("bad","🤯", m.name + ": ты вымотан."); A.alarm(); return; }
      if (m.cost && S.state.bank < m.cost){ A.alarm(); return; }
      if (m.cost) S.state.bank -= m.cost;
      S.state.cashCd[m.id] = m.cd;
      S.state.fatigueByMethod[m.id] = Math.min(100, f + m.fatigueAdd);
      S.state.fatigue = Math.min(100, S.state.fatigue + Math.round(m.fatigueAdd * 0.7));
  
      var success = Math.random() < effectiveChance(m);
      var result = success ? m.success : m.fail;
      var applied = applyResult(m, result);
      if (result.trust){
        S.state.trust = Math.max(0, Math.min(100, S.state.trust + result.trust));
      }
      if (applied.cr > 0) UI.floatAtEl("+" + UI.fmt(applied.cr) + " CR", "good", btn);
      if (m.cost) UI.floatAtEl("−" + m.cost + " CR", "bad", btn);
      UI.pushEvent(result.event, result.event === "good" ? "💸" : "💥", applied.text);
      if (result.event === "good") A.cash(); else A.alarm();
      S.save(); window.Loans.render();
    }
  
    function startRest(){
      if (S.state.resting) return;
      if (S.state.bank < C.fatigue.restCost){ UI.pushEvent("bad","💸","Нужно " + C.fatigue.restCost + " CR."); A.alarm(); return; }
      if (S.state.fatigue < 5){ UI.pushEvent("bad","😀","Ты не устал."); A.alarm(); return; }
      S.state.bank -= C.fatigue.restCost;
      S.state.resting = true;
      S.state.restLeft = C.fatigue.restSeconds;
      UI.pushEvent("","😴","Отдыхаешь " + C.fatigue.restSeconds + " сек.");
      A.yawn();
      S.save(); window.Loans.render();
    }
  
    function updateRestTimer(){
      if (!S.state.resting) return;
      S.state.restLeft--;
      if (S.state.restLeft <= 0){
        S.state.resting = false;
        S.state.fatigue = 0;
        Object.keys(S.state.fatigueByMethod).forEach(function(k){ S.state.fatigueByMethod[k] = 0; });
        S.state.health = Math.min(C.health.max, S.state.health + C.fatigue.restHealHp);
        UI.pushEvent("good","😀","Отдохнул! Усталость сброшена, HP +" + C.fatigue.restHealHp + ".");
        UI.$("restNote").innerHTML = "";
        S.save(); window.Loans.render();
        return;
      }
      S.save(); render();
    }
  
    function refreshRestButton(){
      var b = UI.$("restBtn");
      if (b) b.textContent = "😴 ОТДОХНУТЬ " + C.fatigue.restSeconds + " СЕК (−" + C.fatigue.restCost + " CR)";
    }
  
    return { render: render, doMethod: doMethod, startRest: startRest, updateRestTimer: updateRestTimer, refreshRestButton: refreshRestButton, effectiveChance: effectiveChance };
  })();