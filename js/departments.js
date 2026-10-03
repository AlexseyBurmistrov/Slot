/* ============================================================
   DEPARTMENTS — отделы и имена коллег
   ============================================================ */
   window.Departments = (function(){
    var departments = [
      {name:"СЕТЕВЫЕ ИНЖЕНЕРЫ", short:"СЕТЬ",         desc:"маршрутизация / VLAN / DNS"},
      {name:"ИНФРАСТРУКТУРА",   short:"ИНФРА",        desc:"серверы / VM / storage"},
      {name:"ИБ / АНТИВИРУС",   short:"ИБ",           desc:"EDR / AV / политики"},
      {name:"ОБНОВЛЕНИЕ СИСТЕМ",short:"ОБНОВЛЕНИЕ",   desc:"патч / релиз / hotfix"},
      {name:"1С",               short:"1С",           desc:"клиент / сервер / база"},
      {name:"РАЗРАБОТЧИКИ",     short:"РАЗРАБОТКА",   desc:"код / API / интеграции"},
      {name:"БАЗЫ ДАННЫХ",      short:"БАЗА",         desc:"SQL / блокировки / backup"},
      {name:"ТЕЛЕФОНИЯ",        short:"ТЕЛЕФОНИЯ",    desc:"SIP / АТС / шлюз"},
      {name:"ВИРТУАЛИЗАЦИЯ",    short:"ВИРТУАЛИЗАЦИЯ",desc:"гипервизор / кластер"},
      {name:"ПОЧТА",            short:"ПОЧТА",        desc:"SMTP / Exchange / фильтр"},
      {name:"РАБОЧИЕ МЕСТА",    short:"РАБОЧЕЕ МЕСТО",desc:"ПК / ноутбук / профиль"},
      {name:"ПОЛЬЗОВАТЕЛЬ",     short:"ПОЛЬЗОВАТЕЛЬ", desc:"ну... бывает"}
    ];
    var firstNames = ["Иван","Пётр","Алексей","Дмитрий","Сергей","Андрей","Никита","Олег","Максим","Егор","Артём","Влад","Кирилл","Роман","Игорь","Денис","Павел","Глеб","Стас","Тимур"];
    var lastNames  = ["Петров","Сидоров","Кузнецов","Смирнов","Попов","Волков","Морозов","Новиков","Фёдоров","Егоров","Павлов","Козлов","Степанов","Николаев","Орлов","Андреев","Макаров","Никитин","Захаров","Белов"];
  
    function random(){
      var d = departments[Math.floor(Math.random()*departments.length)];
      return { dept: d.short, deptFull: d.name };
    }
    function randomName(){
      var f = firstNames[Math.floor(Math.random()*firstNames.length)];
      var l = lastNames[Math.floor(Math.random()*lastNames.length)];
      return f + " " + l;
    }
    function all(){ return departments; }
    return { all: all, random: random, randomName: randomName };
  })();