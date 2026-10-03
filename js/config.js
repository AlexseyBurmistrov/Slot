/* ============================================================
   CONFIG — все настройки игры
   ============================================================ */
   window.CONFIG = {

    /* ==== СТАРТ ==== */
    startBank: 2000,
    startTrust: 100,
    startCrim: 0,
    startFatigue: 0,
    startHealth: 100,
  
    /* ==== СЛОТ ====
       multiplierSingle — за одно попадание в выбранный отдел
       multiplierPair   — за пару любых одинаковых
       multiplierTriple — за три одинаковых
    */
    slot: {
      defaultBet: 50,
      bets: [10, 25, 50, 100, 250, 500, 1000],
      spinFee: 50,
      winChance: 0.28,
      multiplierSingle: 1.8,
      multiplierPair: 4,
      multiplierTriple: 7,
      reelSpinMs: 75,
      stopDelays: [1150, 600, 700],
      tripleChanceInWin: 0.05,
      pairChanceInWin: 0.25
    },
  
    /* ==== МИКРОЗАЙМ ==== */
    loans: {
      termSeconds: 300,
      amounts: [500, 1000, 1500, 2000, 2500, 5000],
      baseRate: 55,
      ratePerDebtScore: 0.8,
      ratePerActiveLoan: 25,
      ratePerGrudge: 0.6,
      ratePerCrim: 1.5,
      rateMin: 40,
      rateMax: 220,
      collateral: {
        none:   { label: "Без залога",  bonus:   0 },
        phone:  { label: "Телефон",     bonus:  -5 },
        laptop: { label: "Ноутбук",     bonus: -10 },
        car:    { label: "Машина",      bonus: -20 },
        flat:   { label: "Квартира",    bonus: -35 },
        cat:    { label: "Кошка 🐱",    bonus:  -2 }
      },
      guarantorRateBonus: -10,
      guarantorGrudgeAdd: 12,
      tickMs: 5000,
      interestPerTick: 0.018,
      maxLoanBase: 500,
      maxLoanPerTrust: 25,
      maxLoanCrimPenalty: 0.7,
      trustLossPerLoan: 12,
      trustLossPerColleagueLoan: 10,
      trustGainPerRepay: 8,
      trustGainPerRepayAll: 15,
      trustLossOnLate: 10,
      trustLossOnFixFail: 5,
      trustGainOnFixSuccess: 2,
      crimPerLate: 8,
      crimPerLateRepeat: 3,
      crimPerRestructure: 8,
      crimPerRepayAll: -20,
      crimBlockThreshold: 100,
      lateCollateralFine: 0.15,
      lateGuarantorShare: 0.5,
      lateGuarantorGrudge: 30,
      restructureLimit: 2,
      restructureRateMul: 0.65,
      autoPayAmount: 50,
      repayStep: 500,
      grudgeLossPerLoanPaid: 10,
      grudgeLossOnRepayAll: 40
    },
  
    /* ==== КОЛЛЕГИ ==== */
    colleagues: {
      count: 6,
      startDebtScoreMin: 20,
      startDebtScoreMax: 100,
      discoverChance: 0.65,
      discoverGrudgeAdd: 35,
      discoverDebtAdd: 15,
      angerTickEvery: 3,
      angerAdd: 2,
      refuseThreshold: 50,
      enemyThreshold: 80,
      fixBaseCost: 1000,
      fixCostPerGrudge: 20,
      fixCooldownTicks: 3,
      fixChance: {
        low:  { maxGrudge: 40, chance: 0.25 },
        mid:  { maxGrudge: 60, chance: 0.20 },
        high: { maxGrudge: 80, chance: 0.15 }
      },
      fixGrudgeDropMin: 10,
      fixGrudgeDropMax: 22,
      fixGrudgePenaltyOnFail: 20,
      lateGrudgeAdd: 8
    },
  
    /* ==== УСТАЛОСТЬ ==== */
    fatigue: {
      fatigueGlobalPenalty: 0.4,
      methodPenalty50: 0.5,
      methodPenalty70: 0.2,
      methodBlockAt: 90,
      decayPerTick: 1,
      restCost: 250,
      restSeconds: 30,
      restHealHp: 15
    },
  
    /* ==== ЗДОРОВЬЕ ==== */
    health: {
      max: 100,
      regenPerTick: 1,
      lowThreshold: 30,
      lowPenaltyChance: 0.2,
      collapseAt: 0,
      collapseSeconds: 30,
      collapseHealHp: 40,
      mobTrustThreshold: 30,
      mobGrudgeThreshold: 40,
      mobMinColleagues: 2,
      mobDamageBase: 3,
      mobDamageTrustDiv: 3,
      mobCooldownTicks: 6,
      lowHpChanceMult: 0.8
    },
  
    /* ==== ТИКЕТЫ ==== */
    tickets: {
      minDelaySec: 60,
      maxDelaySec: 300,
      initialDelaySec: 45,
      durationMinSec: 90,
      durationMaxSec: 180,
  
      bank: {
        idTitle: "БАНК",
        title: "ПРОВЕРКА БАНКА",
        priorityText: "ВЫСОКИЙ",
        body: "Плановая проверка выявила у тебя непогашенные долги. Банк требует немедленно снизить общую сумму долга, иначе счёт будет заморожен.",
        requirementPrefix: "ТРЕБОВАНИЕ: снизить общий долг до ≤ ",
        failTrust: -15, failHp: -10, failCrim: 10, failBankMul: 0.3,
        winTrust: 10, winHp: 5, winCrim: -5, winBankMul: 0.1
      },
      colleagues: {
        idTitle: "КОЛЛЕГИ",
        title: "УЛЬТИМАТУМ КОЛЛЕГ",
        priorityText: "СРЕДНИЙ",
        body: "Коллеги прознали про займы, оформленные на их имена. Они требуют действий. Слухи в офисе расходятся быстро.",
        requirementPrefix: "ТРЕБОВАНИЕ: снизить долг на коллег до ≤ ",
        failTrust: -20, failHp: -15, failGrudgeAdd: 15,
        winTrust: 8, winHp: 10, winGrudgeDrop: 20
      },
      collectors: {
        idTitle: "КОЛЛЕКТОРЫ",
        title: "КОЛЛЕКТОРЫ НА ПОДХОДЕ",
        priorityText: "ВЫСОКИЙ",
        body: "К тебе выехали коллекторы. Они будут на месте с минуты на минуту. Немедленно погаси часть долга, иначе последствия будут неприятными.",
        requirementPrefix: "ТРЕБОВАНИЕ: погасить минимум ",
        failTrust: -10, failHp: -20, failCrim: 20, failBankFlat: 800,
        winTrust: 5, winHp: 5, winCrim: -10, winBankFlat: 500
      }
    },
  
    /* ==== IT-СПОСОБЫ ==== */
    cashMethods: [
      {id:"bottles", name:"🍾 Сдать бутылки из-под колы", cost:0, cd:10, chance:0.95, fatigueAdd:8,
       desc:"Всегда +50–150 CR. Стабильно.",
       success:{cr:[50,150], text:"Бутылки сданы: +{cr} CR.", event:"good"},
       fail:{text:"Бутылки украли.", event:"bad"}},
      {id:"divination", name:"🧙 Погадать на кофейной гуще", cost:0, cd:25, chance:0.35, fatigueAdd:12,
       desc:"100–500 CR. Шанс 35%.",
       success:{cr:[100,500], text:"«Вижу деньги!» +{cr} CR.", event:"good"},
       fail:{text:"Гуща сказала: «плати».", event:"bad"}},
      {id:"flash", name:"💾 Слить склад флешек", cost:0, cd:20, chance:0.65, fatigueAdd:15,
       desc:"150–400 CR. Начальник не заметит.",
       success:{cr:[150,400], text:"Флешки ушли! +{cr} CR.", event:"good"},
       fail:{text:"Инвентаризация! Вернули на склад.", event:"bad"}},
      {id:"paper", name:"📦 Сдать макулатуру из архива", cost:0, cd:20, chance:0.70, fatigueAdd:12,
       desc:"80–250 CR. Документы 1998 года.",
       success:{cr:[80,250], text:"Макулатура сдана: +{cr} CR.", event:"good"},
       fail:{text:"Секретные документы конфисковали.", event:"bad"}},
      {id:"monitor", name:"📺 Заложить монитор в ломбард", cost:0, cd:20, chance:0.70, fatigueAdd:22,
       desc:"200 CR. Что скажет офис?",
       success:{cr:200, text:"Монитор сдан! +200 CR. Доверие −3.", event:"good", trust:-3},
       fail:{text:"Не приняли: битые пиксели.", event:"bad"}},
      {id:"parking", name:"☕ Продать место на парковке", cost:0, cd:25, chance:0.60, fatigueAdd:20,
       desc:"300–600 CR. Твоё место.",
       success:{cr:[300,600], text:"Место продано! +{cr} CR.", event:"good"},
       fail:{text:"Директор ставил туда машину.", event:"bad"}},
      {id:"dog", name:"🐶 Выгулять собаку тимлида", cost:0, cd:20, chance:0.70, fatigueAdd:22,
       desc:"200–400 CR и +2 доверия.",
       success:{cr:[200,400], text:"Собака счастлива! +{cr} CR.", event:"good", trust:2},
       fail:{text:"Собака убежала.", event:"bad"}},
      {id:"office", name:"🧹 Убрать офис после пятницы", cost:0, cd:20, chance:0.65, fatigueAdd:25,
       desc:"200–400 CR. Следы пятницы.",
       success:{cr:[200,400], text:"Офис блестит! +{cr} CR.", event:"good"},
       fail:{text:"Нашёл заначку кладовщика.", event:"bad"}},
      {id:"shells", name:"🎲 Напёрстки на вокзале", cost:200, cd:25, chance:0.25, fatigueAdd:25,
       desc:"Ставка 200 CR. Победа ×5.",
       success:{cr:1000, text:"Напёрстки! +1000 CR.", event:"good"},
       fail:{text:"Шарик не там. −200 CR.", event:"bad"}},
      {id:"lottery", name:"🎰 IT-лотерея", cost:200, cd:25, chance:0.25, fatigueAdd:15,
       desc:"Ставка 200 CR. Победа ×5.",
       success:{cr:1000, text:"Джекпот! +1000 CR.", event:"good"},
       fail:{text:"Не повезло. −200 CR.", event:"bad"}},
      {id:"server", name:"🖥 Продать старый сервер", cost:0, cd:30, chance:0.55, fatigueAdd:40,
       desc:"250–700 CR. Он ещё шумит.",
       success:{cr:[250,700], text:"Сервер продан за {cr} CR!", event:"good"},
       fail:{text:"Купили за «спасибо».", event:"bad"}},
      {id:"karaoke", name:"🎤 Спеть в караоке у метро", cost:0, cd:35, chance:0.45, fatigueAdd:45,
       desc:"150–500 CR. Петь громко.",
       success:{cr:[150,500], text:"Спел «Кукушку» +{cr} CR.", event:"good"},
       fail:{text:"Охрип, денег нет.", event:"bad"}},
      {id:"course", name:"🧑‍🏫 Курс «Сеньор за 3 дня»", cost:0, cd:40, chance:0.45, fatigueAdd:50,
       desc:"600–1200 CR. Джуны купят.",
       success:{cr:[600,1200], text:"Курс продан! +{cr} CR.", event:"good"},
       fail:{text:"Курс не продался.", event:"bad"}},
      {id:"bugprod", name:"🐛 Продать фикс бага в проде", cost:0, cd:35, chance:0.50, fatigueAdd:45,
       desc:"400–2000 CR за срочный фикс.",
       success:{cr:[400,2000], text:"Баг закрыт! +{cr} CR.", event:"good"},
       fail:{text:"Баг сам прошёл.", event:"bad"}},
      {id:"logo", name:"🎨 Логотип на Fiverr", cost:0, cd:30, chance:0.45, fatigueAdd:40,
       desc:"200–700 CR. Сделаешь в пейнте.",
       success:{cr:[200,700], text:"Логотип сдан! +{cr} CR.", event:"good"},
       fail:{text:"10 бесплатных правок.", event:"bad"}},
      {id:"shaurma", name:"🌯 Продать шаурму у офиса", cost:0, cd:35, chance:0.50, fatigueAdd:50,
       desc:"300–700 CR. Айтишники хотят есть.",
       success:{cr:[300,700], text:"Шаурма разлетелась! +{cr} CR.", event:"good"},
       fail:{text:"СЭС пришла. Всё выкинули.", event:"bad"}},
      {id:"gold", name:"🪙 Помыть «золото» из блоков питания", cost:0, cd:25, chance:0.50, fatigueAdd:35,
       desc:"80–300 CR за контакты.",
       success:{cr:[80,300], text:"Контакты проданы! +{cr} CR.", event:"good"},
       fail:{text:"Ничего не намыл.", event:"bad"}},
      {id:"plasma", name:"🩸 Сдать плазму в медцентре", cost:0, cd:50, chance:0.85, fatigueAdd:60,
       desc:"150 CR. Устаёшь очень сильно.",
       success:{cr:150, text:"Плазма сдана! +150 CR.", event:"good"},
       fail:{text:"Вену не нашли.", event:"bad"}},
      {id:"sofa", name:"🛋 Продать диван из переговорки", cost:0, cd:35, chance:0.55, fatigueAdd:45,
       desc:"300–800 CR. Переговорка станет стоячей.",
       success:{cr:[300,800], text:"Диван продан! +{cr} CR.", event:"good"},
       fail:{text:"Директор увидел диван у метро.", event:"bad"}},
      {id:"upwork", name:"🧑‍💻 Фриланс на Upwork ночью", cost:0, cd:50, chance:0.45, fatigueAdd:65,
       desc:"500–1500 CR. Устаёшь как собака.",
       success:{cr:[500,1500], text:"Заказ закрыт! +{cr} CR.", event:"good"},
       fail:{text:"Заказчик не отдал деньги.", event:"bad"}}
    ],
  
    /* ==== ПРОЧЕЕ ==== */
    historyMax: 12,
    eventsMax: 12,
    stateKey: "faultState",
    historyKey: "faultHistory"
  };