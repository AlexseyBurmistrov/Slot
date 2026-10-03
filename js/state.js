/* ============================================================
   STATE — единое состояние игры + save/load
   ============================================================ */
   window.State = (function(){
    var C = window.CONFIG;
  
    var state = {
      bank: C.startBank,
      trust: C.startTrust,
      crim: C.startCrim,
      fatigue: C.startFatigue,
      health: C.startHealth,
      fatigueByMethod: {},
      resting: false,
      restLeft: 0,
      collapseLeft: 0,
      mobCooldown: 0,
      colleagues: [],
      me: { name:"ТЫ", debtScore:5, loans:[] },
      accruedTotal: 0,
      tickLeft: 5,
      currentTick: 0,
      angerTick: 0,
      autoPay: false,
      restructureUsed: 0,
      cashCd: {},
      lastFixAttempt: 0,
      selectedDept: null,
      bet: C.slot.defaultBet,
      spinning: false,
      ticket: null,
      nextTicketAt: Math.round(C.tickets.initialDelaySec / 5)
    };
  
    function save(){
      try{
        localStorage.setItem(C.stateKey, JSON.stringify({
          bank: state.bank,
          trust: state.trust,
          crim: state.crim,
          fatigue: state.fatigue,
          health: state.health,
          fatigueByMethod: state.fatigueByMethod,
          colleagues: state.colleagues,
          me: state.me,
          accrued: state.accruedTotal,
          autoPay: state.autoPay,
          cashCd: state.cashCd,
          restructureUsed: state.restructureUsed,
          lastFixAttempt: state.lastFixAttempt,
          currentTick: state.currentTick,
          angerTick: state.angerTick,
          mobCooldown: state.mobCooldown,
          collapseLeft: state.collapseLeft,
          ticket: state.ticket,
          nextTicketAt: state.nextTicketAt
        }));
      }catch(e){}
    }
  
    function load(){
      try{
        var raw = localStorage.getItem(C.stateKey);
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!s || typeof s !== "object") return;
  
        if (typeof s.bank === "number") state.bank = s.bank;
        if (typeof s.trust === "number") state.trust = s.trust;
        if (typeof s.crim === "number") state.crim = s.crim;
        if (typeof s.fatigue === "number") state.fatigue = s.fatigue;
        if (typeof s.health === "number") state.health = s.health;
        if (s.fatigueByMethod && typeof s.fatigueByMethod === "object") state.fatigueByMethod = s.fatigueByMethod;
        if (Array.isArray(s.colleagues) && s.colleagues.length) state.colleagues = s.colleagues;
        if (s.me && Array.isArray(s.me.loans)) state.me = s.me;
        if (typeof s.accrued === "number") state.accruedTotal = s.accrued;
        if (typeof s.autoPay === "boolean") state.autoPay = s.autoPay;
        if (s.cashCd && typeof s.cashCd === "object") state.cashCd = s.cashCd;
        if (typeof s.restructureUsed === "number") state.restructureUsed = s.restructureUsed;
        if (typeof s.lastFixAttempt === "number") state.lastFixAttempt = s.lastFixAttempt;
        if (typeof s.currentTick === "number") state.currentTick = s.currentTick;
        if (typeof s.angerTick === "number") state.angerTick = s.angerTick;
        if (typeof s.mobCooldown === "number") state.mobCooldown = s.mobCooldown;
        if (typeof s.collapseLeft === "number") state.collapseLeft = s.collapseLeft;
        if (s.ticket && typeof s.ticket === "object") state.ticket = s.ticket;
        if (typeof s.nextTicketAt === "number") state.nextTicketAt = s.nextTicketAt;
      }catch(e){}
    }
  
    function reset(){
      state.bank = C.startBank;
      state.trust = C.startTrust;
      state.crim = C.startCrim;
      state.fatigue = C.startFatigue;
      state.health = C.startHealth;
      state.fatigueByMethod = {};
      state.resting = false;
      state.restLeft = 0;
      state.collapseLeft = 0;
      state.mobCooldown = 0;
      state.colleagues = [];
      state.me = { name:"ТЫ", debtScore:5, loans:[] };
      state.accruedTotal = 0;
      state.tickLeft = 5;
      state.currentTick = 0;
      state.angerTick = 0;
      state.autoPay = false;
      state.restructureUsed = 0;
      state.cashCd = {};
      state.lastFixAttempt = 0;
      state.selectedDept = null;
      state.bet = C.slot.defaultBet;
      state.spinning = false;
      state.ticket = null;
      state.nextTicketAt = Math.round(C.tickets.initialDelaySec / 5);
    }
  
    return { state: state, save: save, load: load, reset: reset };
  })();