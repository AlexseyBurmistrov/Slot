/* ============================================================
   EVENTS — сговор коллег и глобальные тикеты
   ============================================================ */
   window.GlobalEvents = (function(){
    var C = window.CONFIG, S = window.State, UI = window.UI, A = window.Audio2;
  
    function L(){ return window.Loans; }
    function Col(){ return window.Colleagues; }
  
    function rndInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }
    function fmt(n){ return UI.fmt(n); }
  
    /* ============================================================
       СГОВОР КОЛЛЕГ
       ============================================================ */
    function checkMob(){
      var st = S.state;
      if (st.mobCooldown > 0){ st.mobCooldown--; return; }
      if (st.trust > C.health.mobTrustThreshold) return;
  
      var angry = st.colleagues.filter(function(c){ return (c.grudge || 0) >= C.health.mobGrudgeThreshold; });
      if (angry.length < C.health.mobMinColleagues) return;
  
      var dmg = angry.length * C.health.mobDamageBase
              + Math.round((C.health.mobTrustThreshold - st.trust) / C.health.mobDamageTrustDiv);
      dmg = Math.max(3, dmg);
  
      st.health = Math.max(0, st.health - dmg);
      st.mobCooldown = C.health.mobCooldownTicks;
  
      var names = angry.slice(0, 3).map(function(c){ return c.name; }).join(", ");
      UI.pushEvent("bad", "👥", "Коллеги собрались (" + names + ")! Здоровье −" + dmg + ".");
      A.alarm();
  
      if (Math.random() < 0.4){
        angry.forEach(function(c){ c.grudge = Math.min(100, (c.grudge || 0) + 5); });
        UI.pushEvent("bad", "😡", "После сговора обиды выросли на +5.");
      }
    }
  
    /* ============================================================
       ТИКЕТЫ
       ============================================================ */
    var TICKET_TYPES = ["bank", "colleagues", "collectors"];
  
    function newTicketId(){
      var chars = "ABCDEF0123456789";
      var s = "";
      for (var i=0;i<4;i++) s += chars[Math.floor(Math.random()*chars.length)];
      return s;
    }
  
    function colleagueDebt(){
      var s = 0;
      S.state.colleagues.forEach(function(c){
        c.loans.forEach(function(l){ s += l.amount; });
      });
      return s;
    }
  
    function pickPossibleTypes(){
      var loans = L();
      if (!loans) return [];
      var total = loans.totalDebt();
      var colDebt = colleagueDebt();
      var bank = S.state.bank;
  
      var possible = [];
  
      if (total > 0){
        var targetBank = Math.max(0, Math.round(total * 0.5));
        if (bank >= 100 || total <= bank){
          possible.push({ type: "bank", target: targetBank });
        }
      }
      if (colDebt > 0){
        var targetCol = Math.max(0, Math.round(colDebt * 0.4));
        possible.push({ type: "colleagues", target: targetCol });
      }
      if (total >= 300){
        var targetPay = Math.max(500, Math.round(total * 0.3));
        if (targetPay > total) targetPay = Math.max(300, Math.round(total * 0.5));
        if (targetPay > 0 && targetPay <= total){
          possible.push({ type: "collectors", target: targetPay });
        }
      }
      return possible;
    }
  
    function makeTicket(){
      var possible = pickPossibleTypes();
      if (!possible.length) return null;
  
      var choice = possible[Math.floor(Math.random()*possible.length)];
      var id = newTicketId();
      var duration = rndInt(C.tickets.durationMinSec, C.tickets.durationMaxSec);
  
      if (choice.type === "bank"){
        var cfg = C.tickets.bank;
        return {
          type:"bank", id:id,
          idTitle: cfg.idTitle, title: cfg.title,
          priority: cfg.priorityText, priorityCls: "high",
          body: cfg.body,
          requirement: cfg.requirementPrefix + fmt(choice.target) + " CR",
          targetDebt: choice.target,
          secondsLeft: duration, secondsTotal: duration,
          accepted: false, _startDebt: null
        };
      } else if (choice.type === "colleagues"){
        var cfg2 = C.tickets.colleagues;
        return {
          type:"colleagues", id:id,
          idTitle: cfg2.idTitle, title: cfg2.title,
          priority: cfg2.priorityText, priorityCls: "med",
          body: cfg2.body,
          requirement: cfg2.requirementPrefix + fmt(choice.target) + " CR",
          targetColleagueDebt: choice.target,
          secondsLeft: duration, secondsTotal: duration,
          accepted: false, _startDebt: null
        };
      } else {
        var cfg3 = C.tickets.collectors;
        return {
          type:"collectors", id:id,
          idTitle: cfg3.idTitle, title: cfg3.title,
          priority: cfg3.priorityText, priorityCls: "high",
          body: cfg3.body,
          requirement: cfg3.requirementPrefix + fmt(choice.target) + " CR в счёт долга",
          targetPay: choice.target,
          secondsLeft: duration, secondsTotal: duration,
          accepted: false, _startDebt: null
        };
      }
    }
  
    function spawnTicket(){
      if (S.state.ticket) return;
      var t = makeTicket();
      if (!t){
        S.state.nextTicketAt = Math.round(rndInt(C.tickets.minDelaySec, C.tickets.maxDelaySec) / 5);
        S.save();
        return;
      }
      S.state.ticket = t;
      renderTicket();
      UI.pushEvent("bad", "🎫", "НОВЫЙ ТИКЕТ #" + t.id + " • " + t.idTitle);
      A.alarm();
      S.save();
    }
  
    /* ============================================================
       ЛОГИКА «ПРИНЯТЬ» — списать CR в счёт долга
       ============================================================ */
    function acceptTicket(){
      var t = S.state.ticket;
      if (!t) return;
      if (t.accepted){
        UI.pushEvent("", "🎫", "ТИКЕТ #" + t.id + " уже принят. Выполняй условие.");
        return;
      }
  
      var loans = L();
      if (!loans){ UI.pushEvent("bad","🚫","Банковский модуль недоступен."); return; }
  
      /* Сколько нужно и куда направить платёж */
      var need = 0;
      if (t.type === "collectors"){
        need = t.targetPay;
      } else if (t.type === "bank"){
        need = Math.max(0, loans.totalDebt() - t.targetDebt);
      } else if (t.type === "colleagues"){
        need = Math.max(0, colleagueDebt() - t.targetColleagueDebt);
      }
  
      if (need <= 0){
        /* Уже выполнено — закрываем успешно */
        resolveTicket(true);
        return;
      }
  
      if (S.state.bank < need){
        UI.pushEvent("bad","💸","Не хватает CR: нужно " + fmt(need) + ", а у тебя " + fmt(S.state.bank) + ".");
        A.alarm();
        return;
      }
  
      /* Списываем и направляем в погашение */
      S.state.bank -= need;
      loans.payOff(need);
  
      t.accepted = true;
      UI.pushEvent("good","💸","По тикету #" + t.id + " списано " + fmt(need) + " CR в счёт долга.");
      UI.floatNum("−" + fmt(need) + " CR", "bad");
      A.cash();
  
      /* Проверяем выполнение условия */
      if (isTicketSatisfied(t)){
        resolveTicket(true);
        return;
      }
  
      /* Если после списания всё ещё не выполнено — просто перерисовываем */
      S.save();
      renderTicket();
      UI.renderHeader();
      if (window.Loans && window.Loans.render) window.Loans.render();
    }
  
    function isTicketSatisfied(t){
      var loans = L();
      if (!loans) return false;
  
      if (t.type === "bank") return loans.totalDebt() <= t.targetDebt;
      if (t.type === "colleagues") return colleagueDebt() <= t.targetColleagueDebt;
      if (t.type === "collectors"){
        /* Коллекторы: считаем, что цель выполнена, если игрок уже принял тикет
           и заплатил положенную сумму, ИЛИ общий долг упал на targetPay */
        if (t.accepted) return true;
        return (t._startDebt != null) && (t._startDebt - loans.totalDebt() >= t.targetPay);
      }
      return false;
    }
  
    function resolveTicket(success){
      var t = S.state.ticket;
      if (!t) return;
  
      if (success){
        if (t.type === "bank"){
          var cfg = C.tickets.bank;
          S.state.trust = Math.min(100, S.state.trust + cfg.winTrust);
          S.state.health = Math.min(C.health.max, S.state.health + cfg.winHp);
          S.state.crim = Math.max(0, S.state.crim + cfg.winCrim);
          var bonus = Math.round(S.state.bank * cfg.winBankMul);
          S.state.bank += bonus;
          UI.pushEvent("good","🏦","ТИКЕТ #" + t.id + " ЗАКРЫТ. Банк доволен: +" + fmt(bonus) + " CR, доверие +" + cfg.winTrust + ", здоровье +" + cfg.winHp + ".");
        } else if (t.type === "colleagues"){
          var cfg2 = C.tickets.colleagues;
          S.state.trust = Math.min(100, S.state.trust + cfg2.winTrust);
          S.state.health = Math.min(C.health.max, S.state.health + cfg2.winHp);
          S.state.colleagues.forEach(function(c){
            c.grudge = Math.max(0, (c.grudge || 0) - cfg2.winGrudgeDrop);
          });
          UI.pushEvent("good","👥","ТИКЕТ #" + t.id + " ЗАКРЫТ. Коллеги остыли: доверие +" + cfg2.winTrust + ", здоровье +" + cfg2.winHp + ", обида −" + cfg2.winGrudgeDrop + ".");
        } else if (t.type === "collectors"){
          var cfg3 = C.tickets.collectors;
          S.state.trust = Math.min(100, S.state.trust + cfg3.winTrust);
          S.state.health = Math.min(C.health.max, S.state.health + cfg3.winHp);
          S.state.crim = Math.max(0, S.state.crim + cfg3.winCrim);
          S.state.bank += cfg3.winBankFlat;
          UI.pushEvent("good","🕴️","ТИКЕТ #" + t.id + " ЗАКРЫТ. Коллекторы уехали: +" + fmt(cfg3.winBankFlat) + " CR, крим " + cfg3.winCrim + ".");
        }
        A.win();
      } else {
        if (t.type === "bank"){
          var fb = C.tickets.bank;
          S.state.trust = Math.max(0, S.state.trust + fb.failTrust);
          S.state.health = Math.max(0, S.state.health + fb.failHp);
          S.state.crim = Math.min(100, S.state.crim + fb.failCrim);
          var loss = Math.round(S.state.bank * fb.failBankMul);
          S.state.bank = Math.max(0, S.state.bank - loss);
          UI.pushEvent("bad","🏦","ТИКЕТ #" + t.id + " ПРОВАЛЕН. Банк заморозил активы: −" + fmt(loss) + " CR, доверие " + fb.failTrust + ", здоровье " + fb.failHp + ".");
        } else if (t.type === "colleagues"){
          var fc = C.tickets.colleagues;
          S.state.trust = Math.max(0, S.state.trust + fc.failTrust);
          S.state.health = Math.max(0, S.state.health + fc.failHp);
          S.state.colleagues.forEach(function(c){
            c.grudge = Math.min(100, (c.grudge || 0) + fc.failGrudgeAdd);
          });
          UI.pushEvent("bad","👥","ТИКЕТ #" + t.id + " ПРОВАЛЕН. Коллеги в ярости: доверие " + fc.failTrust + ", здоровье " + fc.failHp + ", обида +" + fc.failGrudgeAdd + ".");
        } else if (t.type === "collectors"){
          var fk = C.tickets.collectors;
          S.state.trust = Math.max(0, S.state.trust + fk.failTrust);
          S.state.health = Math.max(0, S.state.health + fk.failHp);
          S.state.crim = Math.min(100, S.state.crim + fk.failCrim);
          S.state.bank = Math.max(0, S.state.bank - fk.failBankFlat);
          UI.pushEvent("bad","🕴️","ТИКЕТ #" + t.id + " ПРОВАЛЕН. Коллекторы забрали своё: −" + fmt(fk.failBankFlat) + " CR, здоровье " + fk.failHp + ", крим +" + fk.failCrim + ".");
        }
        A.lose();
      }
  
      S.state.ticket = null;
      S.state.nextTicketAt = Math.round(rndInt(C.tickets.minDelaySec, C.tickets.maxDelaySec) / 5);
      renderTicket();
      UI.renderHeader();
      S.save();
    }
  
    function tick(){
      var st = S.state;
  
      if (st.health < C.health.max && st.collapseLeft <= 0){
        st.health = Math.min(C.health.max, st.health + C.health.regenPerTick);
      }
  
      checkMob();
  
      if (st.ticket){
        var loans = L();
        if (loans && st.ticket._startDebt == null) st.ticket._startDebt = loans.totalDebt();
        if (isTicketSatisfied(st.ticket)){
          resolveTicket(true);
        } else {
          st.ticket.secondsLeft -= 5;
          if (st.ticket.secondsLeft <= 0) resolveTicket(false);
          else renderTicket();
        }
      } else {
        if (st.nextTicketAt > 0) st.nextTicketAt--;
        else spawnTicket();
      }
  
      UI.renderHeader();
      S.save();
    }
  
    function fmtTime(sec){
      if (sec <= 0) return "00:00";
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return (m<10?"0":"") + m + ":" + (s<10?"0":"") + s;
    }
  
    function renderTicket(){
      var box = UI.$("ticketBox"); if (!box) return;
      var t = S.state.ticket;
      if (!t){ box.innerHTML = ""; return; }
  
      var cls = "ticket " + t.type;
      var prioCls = t.priorityCls === "high" ? "" : (t.priorityCls === "med" ? "med" : "low");
      var urgent = t.secondsLeft <= 30 ? " urgent" : "";
  
      /* Кнопка ПРИНЯТЬ — заблокирована, если уже принято */
      var acceptDisabled = t.accepted ? " disabled" : "";
      var acceptLabel = t.accepted ? "ПРИНЯТО" : "ПРИНЯТЬ";
  
      box.innerHTML =
        '<div class="' + cls + '">' +
          '<div class="tk-head">' +
            '<span class="tk-id">ТИКЕТ #' + t.id + ' • ' + t.idTitle + '</span>' +
            '<span class="tk-priority ' + prioCls + '">ПРИОРИТЕТ: ' + t.priority + '</span>' +
          '</div>' +
          '<div class="tk-title">🎫 ' + t.title + '</div>' +
          '<div class="tk-body">' + t.body + '</div>' +
          '<div class="tk-req">' + t.requirement + '</div>' +
          '<div class="tk-timer' + urgent + '">ОСТАЛОСЬ: ' + fmtTime(t.secondsLeft) + '</div>' +
          '<div class="tk-actions">' +
            '<button class="tk-btn primary" id="tkAck" type="button"' + acceptDisabled + '>' + acceptLabel + '</button>' +
            '<button class="tk-btn" id="tkAbandon" type="button">ОТКАЗАТЬСЯ</button>' +
          '</div>' +
        '</div>';
  
      var ack = UI.$("tkAck");
      if (ack) ack.addEventListener("click", function(){
        if (t.accepted) return;
        acceptTicket();
      });
      var ab = UI.$("tkAbandon");
      if (ab) ab.addEventListener("click", function(){
        if (!confirm("Отказаться от тикета? Штраф за провал сработает немедленно.")) return;
        resolveTicket(false);
      });
    }
  
    return { tick: tick, spawnTicket: spawnTicket, renderTicket: renderTicket };
  })();