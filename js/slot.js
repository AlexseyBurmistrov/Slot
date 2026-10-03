/* ============================================================
   SLOT — слот-автомат (2026-10-03 FINAL)
   Результат генерируется ОДИН раз. Барабаны и текст берут
   данные из одного и того же объекта res. Тикер останавливает
   каждый барабан отдельно — уже остановленные не перетираются.
   ============================================================ */
   console.log("SLOT VERSION: 2026-10-03 FINAL");

   window.Slot = (function(){
     var C = window.CONFIG, S = window.State, D = window.Departments, UI = window.UI, A = window.Audio2;
   
     /* ============================================================
        ИНИЦИАЛИЗАЦИЯ
        ============================================================ */
     function initPicks(){
       var box = UI.$("picks"); box.innerHTML = "";
       D.all().forEach(function(d){
         var b = document.createElement("button");
         b.type = "button"; b.className = "pick";
         b.innerHTML = d.short + '<small>' + d.desc.split(" / ")[0] + '</small>';
         b.addEventListener("click", function(){
           if (S.state.spinning) return;
           var all = box.querySelectorAll(".pick");
           for (var k=0;k<all.length;k++) all[k].classList.remove("active");
           b.classList.add("active");
           S.state.selectedDept = d;
           UI.$("pickLabel").textContent = d.short;
           A.click();
         });
         box.appendChild(b);
       });
     }
   
     function initBets(){
       var box = UI.$("bets"); box.innerHTML = "";
       C.slot.bets.forEach(function(v){
         var b = document.createElement("button");
         b.type = "button";
         b.className = "bet" + (v === C.slot.defaultBet ? " active" : "");
         b.setAttribute("data-bet", v);
         b.textContent = v;
         b.addEventListener("click", function(){
           if (S.state.spinning) return;
           var all = box.querySelectorAll(".bet");
           for (var k=0;k<all.length;k++) all[k].classList.remove("active");
           b.classList.add("active");
           S.state.bet = v;
           UI.renderHeader();
           A.click();
         });
         box.appendChild(b);
       });
     }
   
     function initCalcSelects(){
       var amt = UI.$("ccAmount");
       amt.innerHTML = "";
       C.loans.amounts.forEach(function(v){
         var o = document.createElement("option"); o.value = v; o.textContent = v + " CR"; amt.appendChild(o);
       });
       var col = UI.$("ccCollateral");
       col.innerHTML = "";
       Object.keys(C.loans.collateral).forEach(function(k){
         var o = document.createElement("option"); o.value = k;
         o.textContent = C.loans.collateral[k].label + " (" + (C.loans.collateral[k].bonus >= 0 ? "+" : "") + C.loans.collateral[k].bonus + "%)";
         col.appendChild(o);
       });
     }
   
     function updateCalc(){
       var amount = Number(UI.$("ccAmount").value) || C.loans.amounts[0];
       var collateral = UI.$("ccCollateral").value || "none";
       var guarantorId = UI.$("ccGuarantor").value || null;
       var rate = window.Loans.calcRate(S.state.me.debtScore, S.state.me.loans.length, 0, S.state.crim, collateral);
       if (guarantorId) rate = Math.max(20, rate + C.loans.guarantorRateBonus);
       var pay = Math.max(1, Math.round(amount * (rate/100) * C.loans.interestPerTick));
       var hour = pay * 720;
       UI.$("ccRate").textContent = rate + "%";
       UI.$("ccPay5").textContent = pay + " CR";
       UI.$("ccOverHour").textContent = UI.fmt(hour) + " CR";
       var term = UI.$("ccTerm");
       if (term) term.textContent = window.Loans.fmtTime(C.loans.termSeconds);
     }
   
     /* ============================================================
        УТИЛИТЫ
        ============================================================ */
     function setReel(el, d){
       if (!el || !d) return;
       el.querySelector("span").textContent = d.short;
     }
     function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
     function randDept(){ return D.all()[Math.floor(Math.random()*D.all().length)]; }
   
     function pickDistinctFrom(usedNames, excludeName){
       var guard = 0;
       while (guard++ < 200){
         var d = randDept();
         if (d.name === excludeName) continue;
         var dup = false;
         for (var i=0;i<usedNames.length;i++){
           if (usedNames[i] === d.name){ dup = true; break; }
         }
         if (!dup) return d;
       }
       return randDept();
     }
   
     /* ============================================================
        ГЕНЕРАЦИЯ РЕЗУЛЬТАТА
        ============================================================ */
     function generateResult(selectedDept){
       var willWin = Math.random() < C.slot.winChance;
       var a, b, c;
   
       if (willWin){
         var lucky = Math.floor(Math.random()*3);
         var others = [0,1,2].filter(function(i){ return i !== lucky; });
         var roll = Math.random();
         var o1, o2;
   
         if (roll < C.slot.tripleChanceInWin){
           o1 = selectedDept;
           o2 = selectedDept;
         } else if (roll < C.slot.tripleChanceInWin + C.slot.pairChanceInWin){
           var other = pickDistinctFrom([selectedDept.name], selectedDept.name);
           if (Math.random() < 0.5){ o1 = selectedDept; o2 = other; }
           else { o1 = other; o2 = selectedDept; }
         } else {
           o1 = pickDistinctFrom([selectedDept.name], selectedDept.name);
           o2 = pickDistinctFrom([selectedDept.name, o1.name], selectedDept.name);
         }
   
         var arr = [];
         arr[lucky] = selectedDept;
         arr[others[0]] = o1;
         arr[others[1]] = o2;
         a = arr[0]; b = arr[1]; c = arr[2];
       } else {
         a = pickDistinctFrom([], selectedDept.name);
         b = pickDistinctFrom([a.name], selectedDept.name);
         c = pickDistinctFrom([a.name, b.name], selectedDept.name);
       }
   
       return { a: a, b: b, c: c };
     }
   
     /* ============================================================
        ПОДСЧЁТ РЕЗУЛЬТАТА
        ============================================================ */
     function computeResult(res, selectedDept){
       var names = [res.a.name, res.b.name, res.c.name];
       var isTriple = (names[0] === names[1] && names[1] === names[2]);
       var isPair   = !isTriple && (
         names[0] === names[1] || names[1] === names[2] || names[0] === names[2]
       );
       var won = names.indexOf(selectedDept.name) !== -1;
   
       var mult = C.slot.multiplierSingle;
       if (isTriple) mult = C.slot.multiplierTriple;
       else if (isPair) mult = C.slot.multiplierPair;
   
       return { won: won, mult: mult, isTriple: isTriple, isPair: isPair };
     }
   
     /* ============================================================
        СПИН
        ============================================================ */
     async function spin(){
       if (S.state.spinning || S.state.resting) return;
       if (!S.state.selectedDept){
         UI.$("result").textContent = "СНАЧАЛА ВЫБЕРИ ВИНОВНИКА";
         return;
       }
       if (S.state.bank < S.state.bet + C.slot.spinFee){
         UI.$("result").innerHTML =
           "НЕДОСТАТОЧНО КРЕДИТОВ<span class='sub2'>Нужно " +
           (S.state.bet + C.slot.spinFee) + " CR</span>";
         A.alarm();
         return;
       }
   
       S.state.spinning = true;
       UI.$("spinBtn").disabled = true;
       UI.$("lever").classList.add("pulled");
   
       var picks = document.querySelectorAll(".pick");
       for (var i=0;i<picks.length;i++) picks[i].disabled = true;
       var betBtns = document.querySelectorAll(".bet");
       for (var j=0;j<betBtns.length;j++) betBtns[j].disabled = true;
       var colBtns = document.querySelectorAll(".loan-btn-sm");
       for (var cb=0;cb<colBtns.length;cb++) colBtns[cb].disabled = true;
       var cashBtns = document.querySelectorAll(".cash-btn");
       for (var cbb=0;cbb<cashBtns.length;cbb++) cashBtns[cbb].disabled = true;
   
       S.state.bank -= S.state.bet + C.slot.spinFee;
       UI.floatNum("−" + C.slot.spinFee + " CR (комиссия)", "bad");
       UI.pushEvent("", "🏦", "Комиссия: −" + C.slot.spinFee + " CR.");
       UI.renderHeader();
       S.save();
   
       UI.$("result").classList.remove("win");
       UI.$("result").textContent = "АНАЛИЗ ИНЦИДЕНТА...";
   
       var reels = [UI.$("r1"), UI.$("r2"), UI.$("r3")];
       for (var k=0;k<reels.length;k++) reels[k].classList.add("spin");
   
       var res = generateResult(S.state.selectedDept);
   
       console.log("[SLOT] selected:", S.state.selectedDept.name,
                   "| generated:", res.a.name, res.b.name, res.c.name,
                   "| shorts:", res.a.short, res.b.short, res.c.short);
   
       /* Тикер, который крутит ТОЛЬКО те барабаны, что ещё не остановлены */
       var stillSpinning = [true, true, true];
   
       var ticker = setInterval(function(){
         for (var t=0;t<reels.length;t++){
           if (stillSpinning[t]) setReel(reels[t], randDept());
         }
         A.tick();
       }, C.slot.reelSpinMs);
   
       /* остановка 1-го */
       await sleep(C.slot.stopDelays[0]);
       stillSpinning[0] = false;
       setReel(reels[0], res.a);
       reels[0].classList.remove("spin");
       A.stop();
   
       /* остановка 2-го */
       await sleep(C.slot.stopDelays[1]);
       stillSpinning[1] = false;
       setReel(reels[1], res.b);
       reels[1].classList.remove("spin");
       A.stop();
   
       /* остановка 3-го */
       await sleep(C.slot.stopDelays[2]);
       stillSpinning[2] = false;
       setReel(reels[2], res.c);
       reels[2].classList.remove("spin");
       A.stop();
   
       clearInterval(ticker);
   
       var computed = computeResult(res, S.state.selectedDept);
       var payout = computed.won ? Math.round(S.state.bet * computed.mult) : 0;
   
       if (computed.won){
         S.state.bank += payout;
         UI.renderHeader();
         S.save();
         for (var m=0;m<reels.length;m++){
           reels[m].classList.add("winpulse");
           (function(el){ setTimeout(function(){ el.classList.remove("winpulse"); }, 600); })(reels[m]);
         }
       }
   
       var reelsText = [res.a.short, res.b.short, res.c.short];
   
       if (computed.won){
         var tag;
         if (computed.isTriple) tag = "🔥 ТРИПЛ";
         else if (computed.isPair) tag = "✨ ПАРА";
         else tag = "🎯 ПОПАЛ";
         UI.$("result").innerHTML =
           tag + '! +' + payout + ' CR (x' + computed.mult + ')' +
           '<span class="sub2">Выпало: ' + reelsText.join(" • ") + '</span>';
         A.win(); burstSparks(); UI.floatNum("+" + payout + " CR", "good");
       } else {
         UI.$("result").innerHTML =
           '❌ МИМО. Твой выбор ' + S.state.selectedDept.short + ' не выпал' +
           '<span class="sub2">Выпало: ' + reelsText.join(" • ") + '</span>';
         A.lose(); UI.floatNum("−" + S.state.bet + " CR", "bad");
       }
       UI.$("result").classList.toggle("win", computed.won);
   
       console.log("[SLOT] reels on screen:", reelsText.join(" • "),
                   "| computed.won:", computed.won,
                   "| mult:", computed.mult,
                   "| payout:", payout);
   
       if (typeof UI.pushRound === "function"){
         UI.pushRound(reelsText, S.state.selectedDept.short, computed.won, S.state.bet, payout, computed.mult);
       }
   
       await sleep(700);
   
       UI.$("lever").classList.remove("pulled");
       UI.$("spinBtn").disabled = false;
       for (var p=0;p<picks.length;p++) picks[p].disabled = false;
       for (var q=0;q<betBtns.length;q++) betBtns[q].disabled = false;
   
       if (window.Loans && window.Loans.render) window.Loans.render();
   
       S.state.spinning = false;
     }
   
     /* ============================================================
        ИСКРЫ
        ============================================================ */
     function burstSparks(){
       var layer = document.createElement("div");
       layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:19;overflow:hidden";
       document.body.appendChild(layer);
       for (var i=0;i<50;i++){
         var e = document.createElement("i");
         var size = 5 + Math.random()*6;
         var hue = 180 + Math.random()*120;
         e.style.cssText =
           "position:absolute;width:"+size+"px;height:"+size+"px;border-radius:50%;" +
           "background:hsl("+hue+",100%,65%);" +
           "left:"+(30+Math.random()*40)+"%;top:"+(30+Math.random()*30)+"%;" +
           "animation:sparkfall 1.2s ease-out forwards";
         e.style.setProperty("--x", (Math.random()*400-200)+"px");
         e.style.animationDelay = (Math.random()*0.2)+"s";
         layer.appendChild(e);
       }
       setTimeout(function(){ layer.remove(); }, 1600);
     }
     (function(){
       var st = document.createElement("style");
       st.textContent =
         "@keyframes sparkfall{0%{opacity:1;transform:translate(0,0) scale(1)}" +
         "100%{opacity:0;transform:translate(var(--x),100vh) rotate(720deg) scale(.6)}}";
       document.head.appendChild(st);
     })();
   
     /* ============================================================
        ЭКСПОРТ
        ============================================================ */
     return {
       initPicks: initPicks,
       initBets: initBets,
       initCalcSelects: initCalcSelects,
       spin: spin,
       updateCalc: updateCalc
     };
   })();