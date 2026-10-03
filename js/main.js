/* ============================================================
   MAIN — инициализация, привязка событий, таймеры
   ============================================================ */
   (function(){
    "use strict";
    var C = window.CONFIG, S = window.State, UI = window.UI, A = window.Audio2,
        Col = window.Colleagues, L = window.Loans, Cash = window.Cash,
        Slot = window.Slot, GE = window.GlobalEvents;
  
    function $(id){ return document.getElementById(id); }
  
    function initUI(){
      UI.renderHeader();
      UI.renderEventsEmpty();
      Col.ensure();
      Col.render();
      Slot.initPicks();
      Slot.initBets();
      Slot.initCalcSelects();
      Cash.refreshRestButton();
      Slot.updateCalc();
      L.render();
      GE.renderTicket();
    }
  
    function bind(){
      $("spinBtn").addEventListener("click", function(e){ e.preventDefault(); Slot.spin(); });
      $("lever").addEventListener("click", function(e){ e.preventDefault(); Slot.spin(); });
      document.addEventListener("keydown", function(e){
        if (e.code === "Space" && !e.repeat){
          var tag = (e.target && e.target.tagName) || "";
          if (tag === "INPUT" || tag === "TEXTAREA") return;
          e.preventDefault(); Slot.spin();
        }
      });
      $("repayBtn").addEventListener("click", L.repay);
      $("repayAllBtn").addEventListener("click", L.repayAll);
      $("selfLoanBtn").addEventListener("click", L.takeOnSelf);
      $("restructBtn").addEventListener("click", L.restructure);
      $("autoPayBtn").addEventListener("click", L.toggleAutoPay);
      $("restBtn").addEventListener("click", Cash.startRest);
      $("ccAmount").addEventListener("change", Slot.updateCalc);
      $("ccCollateral").addEventListener("change", Slot.updateCalc);
      $("ccGuarantor").addEventListener("change", Slot.updateCalc);
      $("resetBtn").addEventListener("click", resetAll);
      $("sndBtn").addEventListener("click", function(){
        A.setEnabled(!A.isEnabled());
        this.classList.toggle("on", A.isEnabled());
        this.textContent = A.isEnabled() ? "🔊" : "🔇";
        if (A.isEnabled()) A.click();
      });
      var hr = $("hardResetBtn");
      if (hr){
        hr.addEventListener("click", function(e){
          e.preventDefault();
          if (!confirm("Обнулить ВСЁ и начать заново? Прогресс, долги, кредиты и история будут удалены.")) return;
          hardReset();
        });
      }
    }
  
    /* Обычный сброс (кнопка «🧹 СБРОС» в панели микрозайма) */
    function resetAll(){
      try{ localStorage.removeItem(C.historyKey); }catch(e){}
      S.reset();
      Col.ensure();
      S.save();
  
      // чистим DOM
      var evBox = $("events");
      if (evBox) evBox.innerHTML = "";
      UI.renderEventsEmpty();
  
      UI.renderHeader();
      L.render();
      Cash.render();
      GE.renderTicket();
      $("autoPayBtn").textContent = "🤖 АВТОПЛАТЁЖ: OFF";
      $("autoPayBtn").classList.remove("warn");
      $("result").textContent = "🧹 ВСЁ ОБНУЛЕНО.";
    }
  
    /* Полный жёсткий сброс */
    function hardReset(){
      try{
        localStorage.removeItem(C.stateKey);
        localStorage.removeItem(C.historyKey);
      }catch(e){}
  
      S.reset();
      Col.ensure();
      S.save();
  
      var evBox = $("events");
      if (evBox) evBox.innerHTML = "";
      UI.renderEventsEmpty();
      var ticketBox = $("ticketBox");
      if (ticketBox) ticketBox.innerHTML = "";
  
      UI.renderHeader();
      L.render();
      Cash.render();
      $("autoPayBtn").textContent = "🤖 АВТОПЛАТЁЖ: OFF";
      $("autoPayBtn").classList.remove("warn");
      $("result").textContent = "🧹 ПОЛНЫЙ СБРОС. Игра началась заново.";
      UI.pushEvent("", "🧹", "Полный сброс. Игра началась заново.");
    }
  
    function startTimers(){
      var tickLeft = 5;
      setInterval(function(){
        tickLeft--;
        var box = $("tickBox"), sec = $("tickSec");
        if (tickLeft <= 1) box.classList.add("soon"); else box.classList.remove("soon");
        sec.textContent = Math.max(0, tickLeft);
        if (tickLeft <= 0){
          tickLeft = 5;
          L.accrue();
          Object.keys(S.state.cashCd).forEach(function(k){ if (S.state.cashCd[k] > 0) S.state.cashCd[k]--; });
          if (S.state.resting) Cash.updateRestTimer();
          GE.tick();
        }
        Cash.render();
        UI.renderHeader();
      }, 1000);
    }
  
    S.load();
    Col.ensure();
    S.save();
    initUI();
    bind();
    startTimers();
  
    console.log("[LUDO-DESK] OK.");
  })();