/* ============================================================
   LOANS — микрозаймы: свои, на коллег, залоги, поручители, просрочки
   ============================================================ */
   window.Loans = (function(){
    var C = window.CONFIG, S = window.State, UI = window.UI, A = window.Audio2;
  
    /* Ленивые ссылки — берём модули в момент вызова, а не при загрузке */
    function Col(){ return window.Colleagues; }
    function Cash(){ return window.Cash; }
    function Slot(){ return window.Slot; }
  
    /* ---------- расчёты ---------- */
    function calcRate(debtScore, loansCount, grudge, crim, collateral){
      var L = C.loans;
      var rate = L.baseRate
        + Math.round(debtScore * L.ratePerDebtScore)
        + loansCount * L.ratePerActiveLoan
        + (grudge ? Math.round(grudge * L.ratePerGrudge) : 0)
        + Math.round((crim||0) * L.ratePerCrim)
        + (collateral && L.collateral[collateral] ? L.collateral[collateral].bonus : 0);
      if (rate < L.rateMin) rate = L.rateMin;
      if (rate > L.rateMax) rate = L.rateMax;
      return rate;
    }
    function calcRateMe(){ return calcRate(S.state.me.debtScore, S.state.me.loans.length, 0, S.state.crim, "none"); }
    function calcRateColleague(c){ return calcRate(c.debtScore, c.loans.length, c.grudge || 0, S.state.crim, "none"); }
  
    function allLoans(){
      var out = [];
      S.state.me.loans.forEach(function(l){ out.push({ owner:"me", ownerName:"Я", loan:l }); });
      S.state.colleagues.forEach(function(c){
        c.loans.forEach(function(l){ out.push({ owner:"c", ownerName:c.name, colleague:c, loan:l }); });
      });
      return out;
    }
    function totalDebt(){
      var s = 0;
      S.state.me.loans.forEach(function(l){ s += l.amount; });
      S.state.colleagues.forEach(function(c){ c.loans.forEach(function(l){ s += l.amount; }); });
      return s;
    }
    function totalLoansCount(){
      return S.state.me.loans.length + S.state.colleagues.reduce(function(s,c){ return s + c.loans.length; }, 0);
    }
    function lateCount(){ return allLoans().filter(function(x){ return (x.loan.secondsLeft || 0) <= 0; }).length; }
    function avgRate(){
      var s = 0, n = 0;
      allLoans().forEach(function(x){ s += x.loan.rate; n++; });
      return n ? Math.round(s / n) : 0;
    }
    function maxLoanByTrust(){
      var L = C.loans;
      var base = Math.max(L.maxLoanBase, Math.round(L.maxLoanBase + S.state.trust * L.maxLoanPerTrust));
      if (S.state.crim > 50) base = Math.round(base * L.maxLoanCrimPenalty);
      return base;
    }
  
    /* ---------- создание займа ---------- */
    function makeLoan(amount, rate, opts){
      opts = opts || {};
      var seconds = opts.seconds || C.loans.termSeconds;
      return {
        id: "l_" + Math.random().toString(36).slice(2,8),
        amount: amount,
        rate: rate,
        secondsTotal: seconds,
        secondsLeft: seconds,
        collateral: opts.collateral || "none",
        guarantor: opts.guarantorId || null,
        auto: !!opts.auto,
        late: false
      };
    }
    function fmtTime(sec){
      if (sec <= 0) return "00:00";
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return (m<10?"0":"") + m + ":" + (s<10?"0":"") + s;
    }
  
    /* ---------- действия ---------- */
    function takeOnSelf(){
      if (S.state.spinning || S.state.resting) return;
      if (S.state.crim >= C.loans.crimBlockThreshold){ UI.pushEvent("bad","🚫","Чёрный список банка."); A.alarm(); return; }
      if (S.state.trust <= 0){ UI.pushEvent("bad","🚫","Банк отказал."); A.alarm(); return; }
      var amount = Number(UI.$("ccAmount").value) || C.loans.amounts[0];
      var collateral = UI.$("ccCollateral").value || "none";
      var guarantorId = UI.$("ccGuarantor").value || null;
      var maxLoan = maxLoanByTrust();
      if (amount > maxLoan){ UI.pushEvent("bad","💸","Банк не даёт больше " + UI.fmt(maxLoan) + " CR."); A.alarm(); return; }
      var rate = calcRate(S.state.me.debtScore, S.state.me.loans.length, 0, S.state.crim, collateral);
      if (guarantorId){
        var g = S.state.colleagues.find(function(c){ return c.id === guarantorId; });
        if (g){
          rate = Math.max(20, rate + C.loans.guarantorRateBonus);
          g.grudge = Math.min(100, (g.grudge || 0) + C.loans.guarantorGrudgeAdd);
          UI.pushEvent("bad","🪪", g.name + " подписался поручителем. Обида +" + C.loans.guarantorGrudgeAdd + ".");
        }
      }
      var loan = makeLoan(amount, rate, { collateral: collateral, guarantorId: guarantorId });
      S.state.me.loans.push(loan);
      S.state.me.debtScore = Math.min(100, S.state.me.debtScore + Math.round(amount/150));
      S.state.trust = Math.max(0, S.state.trust - C.loans.trustLossPerLoan);
      S.state.bank += amount;
      UI.pushEvent("", "🏦", "Займ на себя: +" + UI.fmt(amount) + " CR под " + rate + "%. Срок " + fmtTime(loan.secondsLeft) + ".");
      UI.floatNum("+" + UI.fmt(amount) + " CR", "good");
      A.cash();
      S.save(); render();
      var slot = Slot(); if (slot && slot.updateCalc) slot.updateCalc();
    }
  
    function takeOnColleague(c, btn){
      if (S.state.spinning || S.state.resting) return;
      if ((c.grudge || 0) >= C.colleagues.refuseThreshold){ UI.pushEvent("bad","🚫", c.name + " отказывает (обида " + c.grudge + "%)."); A.alarm(); return; }
      if (S.state.crim >= C.loans.crimBlockThreshold){ UI.pushEvent("bad","🚫","Чёрный список."); A.alarm(); return; }
      if (S.state.trust <= 0){ UI.pushEvent("bad","🚫","Банк отказал."); A.alarm(); return; }
      var amount = Math.min(maxLoanByTrust(), C.loans.amounts[Math.floor(Math.random()*4)]);
      var rate = calcRateColleague(c);
      var loan = makeLoan(amount, rate);
      c.loans.push(loan);
      c.debtScore = Math.min(100, c.debtScore + Math.round(amount/200));
      S.state.trust = Math.max(0, S.state.trust - C.loans.trustLossPerColleagueLoan);
      S.state.bank += amount;
      UI.pushEvent("", "💸", "Займ на " + c.name + ": +" + UI.fmt(amount) + " CR под " + rate + "%. Срок " + fmtTime(loan.secondsLeft) + ".");
      UI.floatAtEl("+" + UI.fmt(amount) + " CR", "good", btn);
      A.cash();
      if (Math.random() < C.colleagues.discoverChance){
        setTimeout(function(){
          c.debtScore = Math.min(100, c.debtScore + C.colleagues.discoverDebtAdd);
          c.grudge = Math.min(100, (c.grudge || 0) + C.colleagues.discoverGrudgeAdd);
          UI.pushEvent("bad","😡", c.name + " узнал! Обида +" + C.colleagues.discoverGrudgeAdd + ".");
          A.alarm();
          S.save(); render();
        }, 900);
      }
      S.save(); render();
    }
  
    /* ---------- погашение ---------- */
    function payOff(amount){
      var left = amount;
      for (var i = S.state.me.loans.length - 1; i >= 0 && left > 0; i--){
        var l = S.state.me.loans[i];
        var pay = Math.min(left, l.amount);
        l.amount -= pay; left -= pay;
        if (l.amount <= 0) S.state.me.loans.splice(i,1);
      }
      S.state.colleagues.forEach(function(c){
        if (left <= 0) return;
        for (var j = c.loans.length-1; j>=0 && left>0; j--){
          var l2 = c.loans[j];
          var pay2 = Math.min(left, l2.amount);
          l2.amount -= pay2; left -= pay2;
          if (l2.amount <= 0){
            c.loans.splice(j,1);
            c.grudge = Math.max(0, (c.grudge || 0) - C.loans.grudgeLossPerLoanPaid);
          }
        }
      });
      return amount - left;
    }
  
    function repay(){
      if (S.state.bank < C.loans.repayStep || totalDebt() <= 0) return;
      S.state.bank -= C.loans.repayStep;
      payOff(C.loans.repayStep);
      S.state.me.debtScore = Math.max(0, S.state.me.debtScore - 5);
      S.state.trust = Math.min(100, S.state.trust + C.loans.trustGainPerRepay);
      UI.pushEvent("good","💳","Погашено " + C.loans.repayStep + " CR. Доверие +" + C.loans.trustGainPerRepay + ".");
      A.cash();
      S.save(); render();
    }
  
    function repayAll(){
      var debt = totalDebt();
      if (debt <= 0) return;
      if (S.state.bank < debt){ UI.pushEvent("bad","💸","Не хватает CR."); A.alarm(); return; }
      S.state.bank -= debt;
      S.state.me.loans = [];
      S.state.colleagues.forEach(function(c){
        c.loans = [];
        c.grudge = Math.max(0, (c.grudge||0) - C.loans.grudgeLossOnRepayAll);
      });
      S.state.me.debtScore = Math.max(0, S.state.me.debtScore - 20);
      S.state.trust = Math.min(100, S.state.trust + C.loans.trustGainPerRepayAll);
      S.state.crim = Math.max(0, S.state.crim + C.loans.crimPerRepayAll);
      UI.pushEvent("good","🎉","Погашено ВСЁ (" + UI.fmt(debt) + " CR). Свобода!");
      A.cash();
      S.save(); render();
    }
  
    function restructure(){
      if (S.state.spinning || S.state.resting) return;
      if (S.state.me.loans.length === 0){ UI.pushEvent("bad","🔄","Нет твоих займов."); A.alarm(); return; }
      if (S.state.restructureUsed >= C.loans.restructureLimit){ UI.pushEvent("bad","🔄","Банк больше не реструктурирует."); A.alarm(); return; }
      S.state.restructureUsed++;
      var totalSum = 0;
      S.state.me.loans.forEach(function(l){ totalSum += l.amount; });
      var newRate = Math.max(30, Math.round(calcRateMe() * C.loans.restructureRateMul));
      var newLoan = makeLoan(totalSum, newRate, { seconds: C.loans.termSeconds });
      S.state.me.loans = [ newLoan ];
      S.state.me.debtScore = Math.max(0, S.state.me.debtScore - 5);
      S.state.crim = Math.min(100, S.state.crim + C.loans.crimPerRestructure);
      UI.pushEvent("good","🔄","Реструктуризация: 1 займ " + UI.fmt(totalSum) + " CR под " + newRate + "%. Крим +" + C.loans.crimPerRestructure + ".");
      A.cash();
      S.save(); render();
    }
  
    function toggleAutoPay(){
      S.state.autoPay = !S.state.autoPay;
      UI.$("autoPayBtn").textContent = "🤖 АВТОПЛАТЁЖ: " + (S.state.autoPay ? "ON" : "OFF");
      UI.$("autoPayBtn").classList.toggle("warn", S.state.autoPay);
      if (S.state.autoPay) UI.pushEvent("good","🤖","Автоплатёж: " + C.loans.autoPayAmount + " CR каждые 5 сек.");
      else UI.pushEvent("","🤖","Автоплатёж выключен.");
      S.save();
    }
  
    /* ---------- тик ---------- */
    function accrue(){
      var totalAdded = 0;
      var step = Math.max(1, C.loans.tickMs / 1000);
  
      for (var i = S.state.me.loans.length - 1; i >= 0; i--){
        var l = S.state.me.loans[i];
        var add = Math.max(1, Math.round(l.amount * (l.rate/100) * C.loans.interestPerTick));
        l.amount += add; totalAdded += add;
        l.secondsLeft -= step;
        if (l.secondsLeft <= 0){
          if (!l.late){
            l.late = true;
            S.state.crim = Math.min(100, S.state.crim + C.loans.crimPerLate);
            S.state.trust = Math.max(0, S.state.trust - C.loans.trustLossOnLate);
            UI.pushEvent("bad","⏰","ПРОСРОЧКА займа " + UI.fmt(l.amount) + " CR! Крим +" + C.loans.crimPerLate + ".");
            A.alarm();
            if (l.collateral && l.collateral !== "none" && l.collateral !== "cat"){
              var fine = Math.round(l.amount * C.loans.lateCollateralFine);
              S.state.bank = Math.max(0, S.state.bank - fine);
              UI.pushEvent("bad","🏦","Банк забрал залог: " + C.loans.collateral[l.collateral].label + ". Штраф " + fine + " CR.");
            }
            if (l.guarantor){
              var g = S.state.colleagues.find(function(c){ return c.id === l.guarantor; });
              if (g){
                var moved = Math.round(l.amount * C.loans.lateGuarantorShare);
                g.loans.push(makeLoan(moved, 120, { seconds: C.loans.termSeconds }));
                l.amount -= moved;
                g.grudge = Math.min(100, (g.grudge || 0) + C.loans.lateGuarantorGrudge);
                UI.pushEvent("bad","🪪", g.name + " как поручитель получил долг " + UI.fmt(moved) + " CR.");
              }
            }
          } else {
            var late = Math.round(l.amount * 0.05);
            l.amount += late; totalAdded += late;
            S.state.crim = Math.min(100, S.state.crim + C.loans.crimPerLateRepeat);
          }
        }
      }
      S.state.colleagues.forEach(function(c){
        c.loans.forEach(function(l){
          var add = Math.max(1, Math.round(l.amount * (l.rate/100) * C.loans.interestPerTick));
          l.amount += add; totalAdded += add;
          l.secondsLeft -= step;
          if (l.secondsLeft <= 0 && !l.late){
            l.late = true;
            c.grudge = Math.min(100, (c.grudge || 0) + C.colleagues.lateGrudgeAdd);
          }
        });
      });
  
      S.state.angerTick++;
      if (S.state.angerTick >= C.colleagues.angerTickEvery){
        S.state.angerTick = 0;
        S.state.colleagues.forEach(function(c){
          if (c.loans.length > 0) c.grudge = Math.min(100, (c.grudge || 0) + C.colleagues.angerAdd);
        });
      }
  
      if (S.state.autoPay && totalDebt() > 0 && S.state.bank >= C.loans.autoPayAmount){
        S.state.bank -= C.loans.autoPayAmount;
        payOff(C.loans.autoPayAmount);
        UI.floatNum("−" + C.loans.autoPayAmount + " CR (автоплатёж)", "good");
      }
  
      if (!S.state.resting && S.state.fatigue > 0) S.state.fatigue = Math.max(0, S.state.fatigue - C.fatigue.decayPerTick);
      Object.keys(S.state.fatigueByMethod).forEach(function(k){
        if (S.state.fatigueByMethod[k] > 0) S.state.fatigueByMethod[k] = Math.max(0, S.state.fatigueByMethod[k] - C.fatigue.decayPerTick);
      });
  
      if (totalAdded > 0){
        S.state.accruedTotal += totalAdded;
        UI.floatNum("−" + UI.fmt(totalAdded) + " CR (проценты)", "bad");
        A.accrue();
      }
      render(); S.save();
    }
  
    /* ---------- рендер ---------- */
    function render(){
      UI.$("loanTotal").textContent = UI.fmt(totalDebt());
      UI.$("loanCount").textContent = totalLoansCount();
      var avg = avgRate();
      UI.$("loanAvg").textContent = avg ? (avg + "%") : "—";
      UI.$("lateCount").textContent = lateCount();
      UI.$("accruedVal").textContent = UI.fmt(S.state.accruedTotal);
      UI.$("crimCell").textContent = Math.round(S.state.crim);
  
      UI.$("repayBtn").disabled = S.state.bank < C.loans.repayStep || totalDebt() <= 0 || S.state.resting;
      UI.$("selfLoanBtn").disabled = S.state.trust <= 0 || S.state.crim >= C.loans.crimBlockThreshold || S.state.resting;
  
      renderActiveLoans();
      renderSelfCard();
  
      var col = Col(); if (col && col.render) col.render();
      renderGuarantors();
  
      var cash = Cash(); if (cash && cash.render) cash.render();
  
      var slot = Slot(); if (slot && slot.updateCalc) slot.updateCalc();
  
      UI.renderHeader();
    }
  
    function renderActiveLoans(){
      var box = UI.$("activeLoans");
      var all = allLoans();
      if (!all.length){ box.innerHTML = '<div style="color:#65758a;font-size:11px;padding:4px">Нет активных займов.</div>'; return; }
      box.innerHTML = "";
      all.forEach(function(x){
        var l = x.loan;
        var cls = "al";
        if (l.late) cls += " late";
        if (l.auto) cls += " auto";
        var total = l.secondsTotal || C.loans.termSeconds;
        var pct = Math.min(100, Math.max(0, Math.round(l.secondsLeft / total * 100)));
        var collLabel = (l.collateral && l.collateral !== "none") ? " • " + C.loans.collateral[l.collateral].label : "";
        var status = l.late ? "⚠ ПРОСРОЧЕН" : "осталось " + fmtTime(Math.max(0,l.secondsLeft));
        var div = document.createElement("div");
        div.className = cls;
        div.innerHTML =
          '<span class="altag">' + (x.owner === "me" ? "Я" : "→ " + x.ownerName) + '</span>' +
          '<span class="alinfo">' + UI.fmt(l.amount) + ' CR' + collLabel + '<small>' + status + '</small></span>' +
          '<span class="alstat"><small>ставка</small><b>' + l.rate + '%</b></span>' +
          '<span class="alstat"><small>платёж/5с</small><b>' + Math.max(1, Math.round(l.amount * (l.rate/100) * C.loans.interestPerTick)) + ' CR</b></span>' +
          '<div class="albar"><i style="width:' + pct + '%"></i></div>';
        box.appendChild(div);
      });
    }
  
    function renderSelfCard(){
      var w = UI.$("selfCardWrap");
      if (!S.state.me.loans.length){ w.innerHTML = ""; return; }
      var col = Col();
      var r = col && col.ratingFor ? col.ratingFor(S.state.me.debtScore) : {l:"C", cls:"c"};
      var rate = calcRateMe();
      var sum = 0; S.state.me.loans.forEach(function(l){ sum += l.amount; });
      w.innerHTML =
        '<div class="self-card">' +
          '<div class="info"><b>👤 ТВОЙ ЛИЧНЫЙ ДОЛГ</b><small>Рейтинг <span class="rating ' + r.cls + '">' + r.l + '</span> • займов: ' + S.state.me.loans.length + '</small></div>' +
          '<div class="stat"><small>Долг</small><b>' + UI.fmt(sum) + ' CR</b></div>' +
          '<div class="stat"><small>Ставка</small><b>' + rate + '%</b></div>' +
          '<div class="stat"><small>Крим</small><b>' + Math.round(S.state.crim) + '</b></div>' +
        '</div>';
    }
  
    function renderGuarantors(){
      var sel = UI.$("ccGuarantor");
      if (!sel) return;
      var cur = sel.value;
      sel.innerHTML = '<option value="">— без поручителя —</option>';
      S.state.colleagues.forEach(function(c){
        if ((c.grudge || 0) >= C.colleagues.refuseThreshold) return;
        var opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name + " (" + c.dept + ")";
        sel.appendChild(opt);
      });
      if (cur) sel.value = cur;
    }
  
    return {
      calcRate: calcRate, calcRateMe: calcRateMe, calcRateColleague: calcRateColleague,
      makeLoan: makeLoan, fmtTime: fmtTime,
      takeOnSelf: takeOnSelf, takeOnColleague: takeOnColleague,
      payOff: payOff, repay: repay, repayAll: repayAll,
      restructure: restructure, toggleAutoPay: toggleAutoPay,
      accrue: accrue, render: render,
      totalDebt: totalDebt, totalLoansCount: totalLoansCount,
      maxLoanByTrust: maxLoanByTrust
    };
  })();