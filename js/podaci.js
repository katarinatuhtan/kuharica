/* =========================================================
   PODACI O RECEPTIMA
   Ovu datoteku koriste i stranica (filtriranje, prikaz recepata,
   planer) i chatbot (pretraga recepata po sastojcima).
   ========================================================= */

const KATEGORIJE = {
  predjelo: { naziv: "Predjela", jednina: "Predjelo", emoji: "🥖", boja: "#f3d9b1" },
  juha: { naziv: "Juhe", jednina: "Juha", emoji: "🍲", boja: "#f6c9a8" },
  salata: { naziv: "Salate", jednina: "Salata", emoji: "🥗", boja: "#d4e6bc" },
  glavno: { naziv: "Glavna jela", jednina: "Glavno jelo", emoji: "🍝", boja: "#f2b8a2" },
  desert: { naziv: "Deserti", jednina: "Desert", emoji: "🍰", boja: "#f1c6d3" }
};

const DANI = ["Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota", "Nedjelja"];

/* slika: fotografija jela (ako je nema, prikazuje se emoji)
   fokus: koji dio fotografije ostaje vidljiv kad se izreže (CSS object-position)
   kljucne: riječi po kojima chatbot prepoznaje da korisnik spominje
   baš taj recept ("+" znači da se moraju pojaviti svi dijelovi) */
const RECEPTI = [
  {
    id: 1,
    slika: "slike/rizoto.jpg",
    naziv: "Rižoto s gljivama",
    kategorija: "glavno",
    emoji: "🍚",
    opis: "Kremasti rižoto s pirjanim šampinjonima i parmezanom.",
    vrijeme: 35,
    tezina: "Srednje",
    porcije: 4,
    vegetarijansko: true,
    kalorije: 420,
    kljucne: ["rizot"],
    sastojci: [
      { naziv: "riža (arborio)", kolicina: 300, jedinica: "g" },
      { naziv: "gljive (šampinjoni)", kolicina: 400, jedinica: "g" },
      { naziv: "luk", kolicina: 1, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 2, jedinica: "češnja" },
      { naziv: "povrtni temeljac", kolicina: 1000, jedinica: "ml" },
      { naziv: "bijelo vino", kolicina: 100, jedinica: "ml" },
      { naziv: "maslac", kolicina: 30, jedinica: "g" },
      { naziv: "parmezan", kolicina: 50, jedinica: "g" },
      { naziv: "maslinovo ulje", kolicina: 2, jedinica: "žlice" }
    ],
    postupak: [
      "Zagrij temeljac i drži ga toplim na laganoj vatri.",
      "Na maslinovom ulju pirjaj sitno sjeckani luk i češnjak, zatim dodaj narezane gljive i pirjaj 5 minuta.",
      "Dodaj rižu, promiješaj dok ne postane staklasta pa podlij vinom.",
      "Postupno dolijevaj temeljac, kutljaču po kutljaču, i stalno miješaj oko 18 minuta.",
      "Makni s vatre, umiješaj maslac i parmezan te posluži odmah."
    ]
  },
  {
    id: 2,
    slika: "slike/palacinke.jpg",
    naziv: "Palačinke",
    kategorija: "desert",
    emoji: "🥞",
    opis: "Tanke i mekane palačinke s džemom ili čokoladnim namazom.",
    vrijeme: 25,
    tezina: "Lako",
    porcije: 4,
    vegetarijansko: true,
    kalorije: 280,
    kljucne: ["palacink"],
    sastojci: [
      { naziv: "brašno", kolicina: 200, jedinica: "g" },
      { naziv: "mlijeko", kolicina: 400, jedinica: "ml" },
      { naziv: "jaja", kolicina: 2, jedinica: "kom" },
      { naziv: "mineralna voda", kolicina: 100, jedinica: "ml" },
      { naziv: "šećer", kolicina: 1, jedinica: "žlica" },
      { naziv: "sol", kolicina: 1, jedinica: "prstohvat" },
      { naziv: "ulje", kolicina: 2, jedinica: "žlice" },
      { naziv: "džem ili čokoladni namaz", kolicina: 150, jedinica: "g" }
    ],
    postupak: [
      "Izmiješaj jaja, mlijeko, šećer i sol.",
      "Postupno dodaj brašno i miješaj dok smjesa ne bude glatka, zatim dodaj mineralnu vodu.",
      "Ostavi smjesu da odstoji 10 minuta.",
      "Zagrij tavu premazanu uljem i peci tanke palačinke s obje strane.",
      "Premaži džemom ili namazom i smotaj."
    ]
  },
  {
    id: 3,
    slika: "slike/piletina-s-povrcem.jpg",
    naziv: "Pileći file s povrćem",
    kategorija: "glavno",
    emoji: "🍗",
    opis: "Sočna piletina iz tave sa šarenim povrćem i origanom.",
    vrijeme: 30,
    tezina: "Lako",
    porcije: 2,
    vegetarijansko: false,
    kalorije: 390,
    kljucne: ["pileci file", "file s povrcem", "piletina s povrcem", "piletinu s povrcem"],
    sastojci: [
      { naziv: "piletina (file)", kolicina: 400, jedinica: "g" },
      { naziv: "tikvica", kolicina: 1, jedinica: "kom" },
      { naziv: "paprika", kolicina: 1, jedinica: "kom" },
      { naziv: "mrkva", kolicina: 1, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 2, jedinica: "češnja" },
      { naziv: "maslinovo ulje", kolicina: 2, jedinica: "žlice" },
      { naziv: "origano", kolicina: 1, jedinica: "žličica" },
      { naziv: "sol i papar", kolicina: 1, jedinica: "žličica" }
    ],
    postupak: [
      "Piletinu nareži na trakice, posoli, popapri i pospi origanom.",
      "Povrće nareži na kockice ili trakice.",
      "Na ulju prži piletinu 6–7 minuta dok ne porumeni pa je izvadi.",
      "U istoj tavi pirjaj povrće i češnjak 8 minuta.",
      "Vrati piletinu, promiješaj i kuhaj još 2 minute."
    ]
  },
  {
    id: 4,
    slika: "slike/juha-od-rajcice.jpg",
    naziv: "Juha od rajčice",
    kategorija: "juha",
    emoji: "🍅",
    opis: "Gusta domaća juha od rajčice s bosiljkom i malo vrhnja.",
    vrijeme: 30,
    tezina: "Lako",
    porcije: 4,
    vegetarijansko: true,
    kalorije: 160,
    kljucne: ["juh+rajc"],
    sastojci: [
      { naziv: "rajčica", kolicina: 800, jedinica: "g" },
      { naziv: "luk", kolicina: 1, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 2, jedinica: "češnja" },
      { naziv: "povrtni temeljac", kolicina: 500, jedinica: "ml" },
      { naziv: "maslinovo ulje", kolicina: 2, jedinica: "žlice" },
      { naziv: "bosiljak", kolicina: 10, jedinica: "listova" },
      { naziv: "šećer", kolicina: 1, jedinica: "žličica" },
      { naziv: "vrhnje za kuhanje", kolicina: 100, jedinica: "ml" }
    ],
    postupak: [
      "Na ulju pirjaj luk i češnjak dok ne omekšaju.",
      "Dodaj narezane rajčice i šećer te kuhaj 10 minuta.",
      "Ulij temeljac i kuhaj još 10 minuta.",
      "Dodaj bosiljak i sve izmiksaj štapnim mikserom.",
      "Umiješaj vrhnje, posoli po ukusu i posluži."
    ]
  },
  {
    id: 5,
    slika: "slike/grcka-salata.jpg",
    naziv: "Grčka salata",
    kategorija: "salata",
    emoji: "🥗",
    opis: "Osvježavajuća salata s feta sirom, maslinama i origanom.",
    vrijeme: 10,
    tezina: "Lako",
    porcije: 2,
    vegetarijansko: true,
    kalorije: 310,
    kljucne: ["grck"],
    sastojci: [
      { naziv: "rajčica", kolicina: 2, jedinica: "kom" },
      { naziv: "krastavac", kolicina: 1, jedinica: "kom" },
      { naziv: "crveni luk", kolicina: 0.5, jedinica: "kom" },
      { naziv: "paprika", kolicina: 1, jedinica: "kom" },
      { naziv: "feta sir", kolicina: 150, jedinica: "g" },
      { naziv: "masline", kolicina: 50, jedinica: "g" },
      { naziv: "maslinovo ulje", kolicina: 3, jedinica: "žlice" },
      { naziv: "origano", kolicina: 1, jedinica: "žličica" }
    ],
    postupak: [
      "Rajčice, krastavac i papriku nareži na veće komade.",
      "Luk nareži na tanke kolutove.",
      "Sve složi u zdjelu i dodaj masline.",
      "Na vrh stavi komad fete, prelij uljem i pospi origanom."
    ]
  },
  {
    id: 6,
    slika: "slike/spageti-bolonjez.jpg",
    naziv: "Špageti bolonjez",
    kategorija: "glavno",
    emoji: "🍝",
    opis: "Klasični umak od mljevenog mesa i rajčice uz špagete.",
    vrijeme: 45,
    tezina: "Srednje",
    porcije: 4,
    vegetarijansko: false,
    kalorije: 560,
    kljucne: ["bolonj", "spaget"],
    sastojci: [
      { naziv: "špageti", kolicina: 400, jedinica: "g" },
      { naziv: "mljeveno meso", kolicina: 500, jedinica: "g" },
      { naziv: "luk", kolicina: 1, jedinica: "kom" },
      { naziv: "mrkva", kolicina: 1, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 2, jedinica: "češnja" },
      { naziv: "pasirana rajčica", kolicina: 500, jedinica: "ml" },
      { naziv: "maslinovo ulje", kolicina: 2, jedinica: "žlice" },
      { naziv: "parmezan", kolicina: 40, jedinica: "g" }
    ],
    postupak: [
      "Na ulju pirjaj sitno sjeckani luk, mrkvu i češnjak.",
      "Dodaj meso i prži dok ne promijeni boju.",
      "Ulij pasiranu rajčicu, posoli, popapri i kuhaj na laganoj vatri 25 minuta.",
      "U međuvremenu skuhaj špagete prema uputama na pakiranju.",
      "Posluži špagete s umakom i naribanim parmezanom."
    ]
  },
  {
    id: 7,
    slika: "slike/fritaja.jpg",
    naziv: "Fritaja s povrćem",
    kategorija: "glavno",
    emoji: "🍳",
    opis: "Brza talijanska omlet-pita s tikvicom, paprikom i sirom.",
    vrijeme: 20,
    tezina: "Lako",
    porcije: 2,
    vegetarijansko: true,
    kalorije: 330,
    kljucne: ["fritaj"],
    sastojci: [
      { naziv: "jaja", kolicina: 5, jedinica: "kom" },
      { naziv: "tikvica", kolicina: 1, jedinica: "kom" },
      { naziv: "paprika", kolicina: 1, jedinica: "kom" },
      { naziv: "luk", kolicina: 0.5, jedinica: "kom" },
      { naziv: "ribani sir", kolicina: 60, jedinica: "g" },
      { naziv: "mlijeko", kolicina: 50, jedinica: "ml" },
      { naziv: "maslinovo ulje", kolicina: 1, jedinica: "žlica" }
    ],
    postupak: [
      "Povrće nareži na sitne kockice i pirjaj na ulju 5 minuta.",
      "Jaja umuti s mlijekom, solju i polovicom sira.",
      "Prelij jaja preko povrća i peci na laganoj vatri 5 minuta.",
      "Pospi ostatkom sira i zapeci u pećnici na 200 °C oko 5 minuta."
    ]
  },
  {
    id: 8,
    slika: "slike/brownies.jpg",
    naziv: "Brownies",
    kategorija: "desert",
    emoji: "🍫",
    opis: "Sočni čokoladni kolač koji je iznutra mekan i ljepljiv.",
    vrijeme: 40,
    tezina: "Srednje",
    porcije: 8,
    vegetarijansko: true,
    kalorije: 350,
    kljucne: ["browni"],
    sastojci: [
      { naziv: "tamna čokolada", kolicina: 200, jedinica: "g" },
      { naziv: "maslac", kolicina: 150, jedinica: "g" },
      { naziv: "šećer", kolicina: 200, jedinica: "g" },
      { naziv: "jaja", kolicina: 3, jedinica: "kom" },
      { naziv: "brašno", kolicina: 100, jedinica: "g" },
      { naziv: "kakao", kolicina: 30, jedinica: "g" }
    ],
    postupak: [
      "Rastopi čokoladu i maslac na pari.",
      "Umiješaj šećer, a zatim jedno po jedno jaje.",
      "Dodaj prosijano brašno i kakao te lagano promiješaj.",
      "Izlij u kalup obložen papirom za pečenje.",
      "Peci na 180 °C oko 22 minute; sredina treba ostati vlažna."
    ]
  },
  {
    id: 9,
    slika: "slike/bruschette.jpg",
    fokus: "50% 72%",
    naziv: "Bruschette s rajčicom",
    kategorija: "predjelo",
    emoji: "🥖",
    opis: "Hrskavi prepečeni kruh s rajčicom, češnjakom i bosiljkom.",
    vrijeme: 15,
    tezina: "Lako",
    porcije: 4,
    vegetarijansko: true,
    kalorije: 180,
    kljucne: ["bruschet", "brusket"],
    sastojci: [
      { naziv: "kruh (baguette)", kolicina: 1, jedinica: "kom" },
      { naziv: "rajčica", kolicina: 4, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 2, jedinica: "češnja" },
      { naziv: "bosiljak", kolicina: 8, jedinica: "listova" },
      { naziv: "maslinovo ulje", kolicina: 3, jedinica: "žlice" }
    ],
    postupak: [
      "Kruh nareži na ploške i prepeci u pećnici ili na tavi.",
      "Rajčice nareži na sitne kockice i pomiješaj s uljem, solju i bosiljkom.",
      "Topli kruh natrljaj češnjakom.",
      "Na svaku plošku stavi žlicu rajčica i odmah posluži."
    ]
  },
  {
    id: 10,
    slika: "slike/pasticada.jpg",
    naziv: "Dalmatinska pašticada",
    kategorija: "glavno",
    emoji: "🥩",
    opis: "Tradicionalno svečano jelo od junetine u slatko-kiselom umaku, uz njoke.",
    vrijeme: 240,
    napomena: "+ marinada preko noći",
    tezina: "Zahtjevno",
    porcije: 6,
    vegetarijansko: false,
    kalorije: 620,
    kljucne: ["pasticad"],
    sastojci: [
      { naziv: "junetina (frikando)", kolicina: 1500, jedinica: "g" },
      { naziv: "slanina", kolicina: 100, jedinica: "g" },
      { naziv: "mrkva", kolicina: 2, jedinica: "kom" },
      { naziv: "luk", kolicina: 2, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 4, jedinica: "češnja" },
      { naziv: "suhe šljive", kolicina: 100, jedinica: "g" },
      { naziv: "crno vino", kolicina: 300, jedinica: "ml" },
      { naziv: "vinski ocat", kolicina: 200, jedinica: "ml" },
      { naziv: "koncentrat rajčice", kolicina: 2, jedinica: "žlice" },
      { naziv: "njoki", kolicina: 1000, jedinica: "g" }
    ],
    postupak: [
      "Meso nadjeni slaninom i češnjakom te ga preko noći mariniraj u octu.",
      "Ocijedi meso i zapeci ga sa svih strana u loncu.",
      "Dodaj luk i mrkvu i pirjaj dok ne porumene.",
      "Dodaj šljive, koncentrat rajčice i vino te kuhaj poklopljeno oko 3 sata, uz povremeno podlijevanje vodom.",
      "Izvadi meso, umak izmiksaj, a meso nareži na šnite.",
      "Posluži s kuhanim njokima i puno umaka."
    ]
  },
  {
    id: 11,
    slika: "slike/juha-od-bundeve.jpg",
    fokus: "60% 55%",
    naziv: "Krem juha od bundeve",
    kategorija: "juha",
    emoji: "🎃",
    opis: "Baršunasta jesenska juha od bundeve s pečenim bučinim sjemenkama.",
    vrijeme: 40,
    tezina: "Lako",
    porcije: 4,
    vegetarijansko: true,
    kalorije: 210,
    kljucne: ["bundev"],
    sastojci: [
      { naziv: "bundeva (hokaido)", kolicina: 1000, jedinica: "g" },
      { naziv: "krumpir", kolicina: 1, jedinica: "kom" },
      { naziv: "luk", kolicina: 1, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 2, jedinica: "češnja" },
      { naziv: "povrtni temeljac", kolicina: 800, jedinica: "ml" },
      { naziv: "vrhnje za kuhanje", kolicina: 100, jedinica: "ml" },
      { naziv: "maslinovo ulje", kolicina: 2, jedinica: "žlice" },
      { naziv: "bučine sjemenke", kolicina: 2, jedinica: "žlice" }
    ],
    postupak: [
      "Bundevu i krumpir oguli i nareži na kocke.",
      "Na ulju pirjaj luk i češnjak, zatim dodaj bundevu i krumpir.",
      "Ulij temeljac i kuhaj 20 minuta dok povrće ne omekša.",
      "Izmiksaj u glatku kremu i umiješaj vrhnje.",
      "Posluži posuto prepečenim bučinim sjemenkama."
    ]
  },
  {
    id: 12,
    slika: "slike/wrap-s-piletinom.jpg",
    naziv: "Wrap s piletinom",
    kategorija: "glavno",
    emoji: "🌯",
    opis: "Tortilja punjena piletinom, svježim povrćem i jogurt umakom.",
    vrijeme: 20,
    tezina: "Lako",
    porcije: 2,
    vegetarijansko: false,
    kalorije: 480,
    kljucne: ["wrap", "tortilj"],
    sastojci: [
      { naziv: "tortilje", kolicina: 2, jedinica: "kom" },
      { naziv: "piletina (file)", kolicina: 250, jedinica: "g" },
      { naziv: "zelena salata", kolicina: 4, jedinica: "lista" },
      { naziv: "rajčica", kolicina: 1, jedinica: "kom" },
      { naziv: "kukuruz", kolicina: 80, jedinica: "g" },
      { naziv: "jogurt", kolicina: 100, jedinica: "g" },
      { naziv: "češnjak", kolicina: 1, jedinica: "češanj" }
    ],
    postupak: [
      "Piletinu nareži na trakice, začini i ispeci na tavi.",
      "Jogurt pomiješaj sa zgnječenim češnjakom i prstohvatom soli.",
      "Tortilje kratko zagrij na suhoj tavi.",
      "Na tortilju složi salatu, rajčicu, kukuruz i piletinu te prelij umakom.",
      "Čvrsto zarolaj i prereži na pola."
    ]
  },
  {
    id: 13,
    slika: "slike/tiramisu.jpg",
    naziv: "Tiramisu",
    kategorija: "desert",
    emoji: "☕",
    opis: "Talijanski desert od piškota natopljenih kavom i kreme od mascarponea.",
    vrijeme: 30,
    napomena: "+ 4 h hlađenja",
    tezina: "Srednje",
    porcije: 6,
    vegetarijansko: true,
    kalorije: 450,
    kljucne: ["tiramis"],
    sastojci: [
      { naziv: "mascarpone", kolicina: 500, jedinica: "g" },
      { naziv: "jaja", kolicina: 4, jedinica: "kom" },
      { naziv: "šećer", kolicina: 100, jedinica: "g" },
      { naziv: "piškote", kolicina: 300, jedinica: "g" },
      { naziv: "kava (espresso)", kolicina: 300, jedinica: "ml" },
      { naziv: "kakao", kolicina: 2, jedinica: "žlice" }
    ],
    postupak: [
      "Žumanjke umuti sa šećerom u pjenastu kremu pa umiješaj mascarpone.",
      "Bjelanjke istuci u čvrst snijeg i lagano ih umiješaj u kremu.",
      "Piškote kratko umoči u ohlađenu kavu i složi ih u posudu.",
      "Premaži slojem kreme i ponovi slojeve.",
      "Ohladi najmanje 4 sata i prije posluživanja pospi kakaom."
    ]
  },
  {
    id: 14,
    slika: "slike/salata-s-tunom.jpg",
    naziv: "Salata s tunom",
    kategorija: "salata",
    emoji: "🐟",
    opis: "Zasitna salata s tunom, grahom i kukuruzom, gotova za čas.",
    vrijeme: 15,
    tezina: "Lako",
    porcije: 2,
    vegetarijansko: false,
    kalorije: 340,
    kljucne: ["salat+tun"],
    sastojci: [
      { naziv: "tuna (konzerva)", kolicina: 160, jedinica: "g" },
      { naziv: "kuhani grah", kolicina: 200, jedinica: "g" },
      { naziv: "kukuruz", kolicina: 100, jedinica: "g" },
      { naziv: "crveni luk", kolicina: 0.5, jedinica: "kom" },
      { naziv: "zelena salata", kolicina: 0.5, jedinica: "glavice" },
      { naziv: "maslinovo ulje", kolicina: 2, jedinica: "žlice" },
      { naziv: "limun", kolicina: 0.5, jedinica: "kom" }
    ],
    postupak: [
      "Salatu operi i natrgaj na komade.",
      "Grah i kukuruz ocijedi, a luk nareži na tanke kolutove.",
      "Sve pomiješaj u zdjeli i dodaj ocijeđenu tunu.",
      "Začini uljem, limunovim sokom, solju i paprom."
    ]
  },
  {
    id: 15,
    slika: "slike/hummus.jpg",
    fokus: "35% 55%",
    naziv: "Hummus",
    kategorija: "predjelo",
    emoji: "🫘",
    opis: "Kremasti namaz od slanutka i tahinija, savršen uz povrće ili kruh.",
    vrijeme: 10,
    tezina: "Lako",
    porcije: 4,
    vegetarijansko: true,
    kalorije: 220,
    kljucne: ["humus", "hummus"],
    sastojci: [
      { naziv: "kuhani slanutak", kolicina: 400, jedinica: "g" },
      { naziv: "tahini", kolicina: 2, jedinica: "žlice" },
      { naziv: "limun", kolicina: 1, jedinica: "kom" },
      { naziv: "češnjak", kolicina: 1, jedinica: "češanj" },
      { naziv: "maslinovo ulje", kolicina: 3, jedinica: "žlice" },
      { naziv: "kumin", kolicina: 0.5, jedinica: "žličice" }
    ],
    postupak: [
      "Slanutak ocijedi, a malo tekućine sačuvaj.",
      "Sve sastojke stavi u blender.",
      "Miksaj dok ne dobiješ glatku kremu; po potrebi dodaj malo tekućine od slanutka.",
      "Posluži preliveno maslinovim uljem i posuto kuminom."
    ]
  }
];
