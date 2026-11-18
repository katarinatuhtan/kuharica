/* =========================================================
   PODACI O RECEPTIMA
   Ovu datoteku koriste i stranica (filtriranje, prikaz recepata,
   planer) i chatbot (pretraga recepata po sastojcima).
   ========================================================= */

const CATEGORIES = {
  starter: { name: "Predjela", singular: "Predjelo", icon: "baguette", color: "#f3d9b1" },
  soup: { name: "Juhe", singular: "Juha", icon: "pot", color: "#f6c9a8" },
  salad: { name: "Salate", singular: "Salata", icon: "salad", color: "#d4e6bc" },
  main: { name: "Glavna jela", singular: "Glavno jelo", icon: "spaghetti", color: "#f2b8a2" },
  dessert: { name: "Deserti", singular: "Desert", icon: "cake", color: "#f1c6d3" }
};

const DAYS = ["Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota", "Nedjelja"];

/* image: fotografija jela (ako je nema, prikazuje se ikona)
   icon: 3D ikona iz kolekcije Thiings (images/icons), emoji se koristi u padajućim izbornicima
   focus: koji dio fotografije ostaje vidljiv kad se izreže (CSS object-position)
   keywords: riječi po kojima chatbot prepoznaje da korisnik spominje
   baš taj recept ("+" znači da se moraju pojaviti svi dijelovi) */
const RECIPES = [
  {
    id: 1,
    image: "images/rizoto.jpg",
    name: "Rižoto s gljivama",
    category: "main",
    emoji: "🍚",
    icon: "rice",
    description: "Kremasti rižoto s pirjanim šampinjonima i parmezanom.",
    time: 35,
    difficulty: "Srednje",
    servings: 4,
    vegetarian: true,
    calories: 420,
    keywords: ["rizot"],
    ingredients: [
      { name: "riža (arborio)", amount: 300, unit: "g" },
      { name: "gljive (šampinjoni)", amount: 400, unit: "g" },
      { name: "luk", amount: 1, unit: "kom" },
      { name: "češnjak", amount: 2, unit: "češnja" },
      { name: "povrtni temeljac", amount: 1000, unit: "ml" },
      { name: "bijelo vino", amount: 100, unit: "ml" },
      { name: "maslac", amount: 30, unit: "g" },
      { name: "parmezan", amount: 50, unit: "g" },
      { name: "maslinovo ulje", amount: 2, unit: "žlice" }
    ],
    steps: [
      "Zagrij temeljac i drži ga toplim na laganoj vatri.",
      "Na maslinovom ulju pirjaj sitno sjeckani luk i češnjak, zatim dodaj narezane gljive i pirjaj 5 minuta.",
      "Dodaj rižu, promiješaj dok ne postane staklasta pa podlij vinom.",
      "Postupno dolijevaj temeljac, kutljaču po kutljaču, i stalno miješaj oko 18 minuta.",
      "Makni s vatre, umiješaj maslac i parmezan te posluži odmah."
    ]
  },
  {
    id: 2,
    image: "images/palacinke.jpg",
    name: "Palačinke",
    category: "dessert",
    emoji: "🥞",
    icon: "pancakes",
    description: "Tanke i mekane palačinke s džemom ili čokoladnim namazom.",
    time: 25,
    difficulty: "Lako",
    servings: 4,
    vegetarian: true,
    calories: 280,
    keywords: ["palacink"],
    ingredients: [
      { name: "brašno", amount: 200, unit: "g" },
      { name: "mlijeko", amount: 400, unit: "ml" },
      { name: "jaja", amount: 2, unit: "kom" },
      { name: "mineralna voda", amount: 100, unit: "ml" },
      { name: "šećer", amount: 1, unit: "žlica" },
      { name: "sol", amount: 1, unit: "prstohvat" },
      { name: "ulje", amount: 2, unit: "žlice" },
      { name: "džem ili čokoladni namaz", amount: 150, unit: "g" }
    ],
    steps: [
      "Izmiješaj jaja, mlijeko, šećer i sol.",
      "Postupno dodaj brašno i miješaj dok smjesa ne bude glatka, zatim dodaj mineralnu vodu.",
      "Ostavi smjesu da odstoji 10 minuta.",
      "Zagrij tavu premazanu uljem i peci tanke palačinke s obje strane.",
      "Premaži džemom ili namazom i smotaj."
    ]
  },
  {
    id: 3,
    image: "images/piletina-s-povrcem.jpg",
    name: "Pileći file s povrćem",
    category: "main",
    emoji: "🍗",
    icon: "drumstick",
    description: "Sočna piletina iz tave sa šarenim povrćem i origanom.",
    time: 30,
    difficulty: "Lako",
    servings: 2,
    vegetarian: false,
    calories: 390,
    keywords: ["pileci file", "file s povrcem", "piletina s povrcem", "piletinu s povrcem"],
    ingredients: [
      { name: "piletina (file)", amount: 400, unit: "g" },
      { name: "tikvica", amount: 1, unit: "kom" },
      { name: "paprika", amount: 1, unit: "kom" },
      { name: "mrkva", amount: 1, unit: "kom" },
      { name: "češnjak", amount: 2, unit: "češnja" },
      { name: "maslinovo ulje", amount: 2, unit: "žlice" },
      { name: "origano", amount: 1, unit: "žličica" },
      { name: "sol i papar", amount: 1, unit: "žličica" }
    ],
    steps: [
      "Piletinu nareži na trakice, posoli, popapri i pospi origanom.",
      "Povrće nareži na kockice ili trakice.",
      "Na ulju prži piletinu 6–7 minuta dok ne porumeni pa je izvadi.",
      "U istoj tavi pirjaj povrće i češnjak 8 minuta.",
      "Vrati piletinu, promiješaj i kuhaj još 2 minute."
    ]
  },
  {
    id: 4,
    image: "images/juha-od-rajcice.jpg",
    name: "Juha od rajčice",
    category: "soup",
    emoji: "🍅",
    icon: "tomato",
    description: "Gusta domaća juha od rajčice s bosiljkom i malo vrhnja.",
    time: 30,
    difficulty: "Lako",
    servings: 4,
    vegetarian: true,
    calories: 160,
    keywords: ["juh+rajc"],
    ingredients: [
      { name: "rajčica", amount: 800, unit: "g" },
      { name: "luk", amount: 1, unit: "kom" },
      { name: "češnjak", amount: 2, unit: "češnja" },
      { name: "povrtni temeljac", amount: 500, unit: "ml" },
      { name: "maslinovo ulje", amount: 2, unit: "žlice" },
      { name: "bosiljak", amount: 10, unit: "listova" },
      { name: "šećer", amount: 1, unit: "žličica" },
      { name: "vrhnje za kuhanje", amount: 100, unit: "ml" }
    ],
    steps: [
      "Na ulju pirjaj luk i češnjak dok ne omekšaju.",
      "Dodaj narezane rajčice i šećer te kuhaj 10 minuta.",
      "Ulij temeljac i kuhaj još 10 minuta.",
      "Dodaj bosiljak i sve izmiksaj štapnim mikserom.",
      "Umiješaj vrhnje, posoli po ukusu i posluži."
    ]
  },
  {
    id: 5,
    image: "images/grcka-salata.jpg",
    name: "Grčka salata",
    category: "salad",
    emoji: "🥗",
    icon: "salad",
    description: "Osvježavajuća salata s feta sirom, maslinama i origanom.",
    time: 10,
    difficulty: "Lako",
    servings: 2,
    vegetarian: true,
    calories: 310,
    keywords: ["grck"],
    ingredients: [
      { name: "rajčica", amount: 2, unit: "kom" },
      { name: "krastavac", amount: 1, unit: "kom" },
      { name: "crveni luk", amount: 0.5, unit: "kom" },
      { name: "paprika", amount: 1, unit: "kom" },
      { name: "feta sir", amount: 150, unit: "g" },
      { name: "masline", amount: 50, unit: "g" },
      { name: "maslinovo ulje", amount: 3, unit: "žlice" },
      { name: "origano", amount: 1, unit: "žličica" }
    ],
    steps: [
      "Rajčice, krastavac i papriku nareži na veće komade.",
      "Luk nareži na tanke kolutove.",
      "Sve složi u zdjelu i dodaj masline.",
      "Na vrh stavi komad fete, prelij uljem i pospi origanom."
    ]
  },
  {
    id: 6,
    image: "images/spageti-bolonjez.jpg",
    name: "Špageti bolonjez",
    category: "main",
    emoji: "🍝",
    icon: "spaghetti",
    description: "Klasični umak od mljevenog mesa i rajčice uz špagete.",
    time: 45,
    difficulty: "Srednje",
    servings: 4,
    vegetarian: false,
    calories: 560,
    keywords: ["bolonj", "spaget"],
    ingredients: [
      { name: "špageti", amount: 400, unit: "g" },
      { name: "mljeveno meso", amount: 500, unit: "g" },
      { name: "luk", amount: 1, unit: "kom" },
      { name: "mrkva", amount: 1, unit: "kom" },
      { name: "češnjak", amount: 2, unit: "češnja" },
      { name: "pasirana rajčica", amount: 500, unit: "ml" },
      { name: "maslinovo ulje", amount: 2, unit: "žlice" },
      { name: "parmezan", amount: 40, unit: "g" }
    ],
    steps: [
      "Na ulju pirjaj sitno sjeckani luk, mrkvu i češnjak.",
      "Dodaj meso i prži dok ne promijeni boju.",
      "Ulij pasiranu rajčicu, posoli, popapri i kuhaj na laganoj vatri 25 minuta.",
      "U međuvremenu skuhaj špagete prema uputama na pakiranju.",
      "Posluži špagete s umakom i naribanim parmezanom."
    ]
  },
  {
    id: 7,
    image: "images/fritaja.jpg",
    name: "Fritaja s povrćem",
    category: "main",
    emoji: "🍳",
    icon: "fried-egg",
    description: "Brza talijanska omlet-pita s tikvicom, paprikom i sirom.",
    time: 20,
    difficulty: "Lako",
    servings: 2,
    vegetarian: true,
    calories: 330,
    keywords: ["fritaj"],
    ingredients: [
      { name: "jaja", amount: 5, unit: "kom" },
      { name: "tikvica", amount: 1, unit: "kom" },
      { name: "paprika", amount: 1, unit: "kom" },
      { name: "luk", amount: 0.5, unit: "kom" },
      { name: "ribani sir", amount: 60, unit: "g" },
      { name: "mlijeko", amount: 50, unit: "ml" },
      { name: "maslinovo ulje", amount: 1, unit: "žlica" }
    ],
    steps: [
      "Povrće nareži na sitne kockice i pirjaj na ulju 5 minuta.",
      "Jaja umuti s mlijekom, solju i polovicom sira.",
      "Prelij jaja preko povrća i peci na laganoj vatri 5 minuta.",
      "Pospi ostatkom sira i zapeci u pećnici na 200 °C oko 5 minuta."
    ]
  },
  {
    id: 8,
    image: "images/brownies.jpg",
    name: "Brownies",
    category: "dessert",
    emoji: "🍫",
    icon: "chocolate",
    description: "Sočni čokoladni kolač koji je iznutra mekan i ljepljiv.",
    time: 40,
    difficulty: "Srednje",
    servings: 8,
    vegetarian: true,
    calories: 350,
    keywords: ["browni"],
    ingredients: [
      { name: "tamna čokolada", amount: 200, unit: "g" },
      { name: "maslac", amount: 150, unit: "g" },
      { name: "šećer", amount: 200, unit: "g" },
      { name: "jaja", amount: 3, unit: "kom" },
      { name: "brašno", amount: 100, unit: "g" },
      { name: "kakao", amount: 30, unit: "g" }
    ],
    steps: [
      "Rastopi čokoladu i maslac na pari.",
      "Umiješaj šećer, a zatim jedno po jedno jaje.",
      "Dodaj prosijano brašno i kakao te lagano promiješaj.",
      "Izlij u kalup obložen papirom za pečenje.",
      "Peci na 180 °C oko 22 minute; sredina treba ostati vlažna."
    ]
  },
  {
    id: 9,
    image: "images/bruschette.jpg",
    focus: "50% 72%",
    name: "Bruschette s rajčicom",
    category: "starter",
    emoji: "🥖",
    icon: "baguette",
    description: "Hrskavi prepečeni kruh s rajčicom, češnjakom i bosiljkom.",
    time: 15,
    difficulty: "Lako",
    servings: 4,
    vegetarian: true,
    calories: 180,
    keywords: ["bruschet", "brusket"],
    ingredients: [
      { name: "kruh (baguette)", amount: 1, unit: "kom" },
      { name: "rajčica", amount: 4, unit: "kom" },
      { name: "češnjak", amount: 2, unit: "češnja" },
      { name: "bosiljak", amount: 8, unit: "listova" },
      { name: "maslinovo ulje", amount: 3, unit: "žlice" }
    ],
    steps: [
      "Kruh nareži na ploške i prepeci u pećnici ili na tavi.",
      "Rajčice nareži na sitne kockice i pomiješaj s uljem, solju i bosiljkom.",
      "Topli kruh natrljaj češnjakom.",
      "Na svaku plošku stavi žlicu rajčica i odmah posluži."
    ]
  },
  {
    id: 10,
    image: "images/pasticada.jpg",
    name: "Dalmatinska pašticada",
    category: "main",
    emoji: "🥩",
    icon: "steak",
    description: "Tradicionalno svečano jelo od junetine u slatko-kiselom umaku, uz njoke.",
    time: 240,
    note: "+ marinada preko noći",
    difficulty: "Zahtjevno",
    servings: 6,
    vegetarian: false,
    calories: 620,
    keywords: ["pasticad"],
    ingredients: [
      { name: "junetina (frikando)", amount: 1500, unit: "g" },
      { name: "slanina", amount: 100, unit: "g" },
      { name: "mrkva", amount: 2, unit: "kom" },
      { name: "luk", amount: 2, unit: "kom" },
      { name: "češnjak", amount: 4, unit: "češnja" },
      { name: "suhe šljive", amount: 100, unit: "g" },
      { name: "crno vino", amount: 300, unit: "ml" },
      { name: "vinski ocat", amount: 200, unit: "ml" },
      { name: "koncentrat rajčice", amount: 2, unit: "žlice" },
      { name: "njoki", amount: 1000, unit: "g" }
    ],
    steps: [
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
    image: "images/juha-od-bundeve.jpg",
    focus: "60% 55%",
    name: "Krem juha od bundeve",
    category: "soup",
    emoji: "🎃",
    icon: "pumpkin",
    description: "Baršunasta jesenska juha od bundeve s pečenim bučinim sjemenkama.",
    time: 40,
    difficulty: "Lako",
    servings: 4,
    vegetarian: true,
    calories: 210,
    keywords: ["bundev"],
    ingredients: [
      { name: "bundeva (hokaido)", amount: 1000, unit: "g" },
      { name: "krumpir", amount: 1, unit: "kom" },
      { name: "luk", amount: 1, unit: "kom" },
      { name: "češnjak", amount: 2, unit: "češnja" },
      { name: "povrtni temeljac", amount: 800, unit: "ml" },
      { name: "vrhnje za kuhanje", amount: 100, unit: "ml" },
      { name: "maslinovo ulje", amount: 2, unit: "žlice" },
      { name: "bučine sjemenke", amount: 2, unit: "žlice" }
    ],
    steps: [
      "Bundevu i krumpir oguli i nareži na kocke.",
      "Na ulju pirjaj luk i češnjak, zatim dodaj bundevu i krumpir.",
      "Ulij temeljac i kuhaj 20 minuta dok povrće ne omekša.",
      "Izmiksaj u glatku kremu i umiješaj vrhnje.",
      "Posluži posuto prepečenim bučinim sjemenkama."
    ]
  },
  {
    id: 12,
    image: "images/wrap-s-piletinom.jpg",
    name: "Wrap s piletinom",
    category: "main",
    emoji: "🌯",
    icon: "burrito",
    description: "Tortilja punjena piletinom, svježim povrćem i jogurt umakom.",
    time: 20,
    difficulty: "Lako",
    servings: 2,
    vegetarian: false,
    calories: 480,
    keywords: ["wrap", "tortilj"],
    ingredients: [
      { name: "tortilje", amount: 2, unit: "kom" },
      { name: "piletina (file)", amount: 250, unit: "g" },
      { name: "zelena salata", amount: 4, unit: "lista" },
      { name: "rajčica", amount: 1, unit: "kom" },
      { name: "kukuruz", amount: 80, unit: "g" },
      { name: "jogurt", amount: 100, unit: "g" },
      { name: "češnjak", amount: 1, unit: "češanj" }
    ],
    steps: [
      "Piletinu nareži na trakice, začini i ispeci na tavi.",
      "Jogurt pomiješaj sa zgnječenim češnjakom i prstohvatom soli.",
      "Tortilje kratko zagrij na suhoj tavi.",
      "Na tortilju složi salatu, rajčicu, kukuruz i piletinu te prelij umakom.",
      "Čvrsto zarolaj i prereži na pola."
    ]
  },
  {
    id: 13,
    image: "images/tiramisu.jpg",
    name: "Tiramisu",
    category: "dessert",
    emoji: "☕",
    icon: "coffee",
    description: "Talijanski desert od piškota natopljenih kavom i kreme od mascarponea.",
    time: 30,
    note: "+ 4 h hlađenja",
    difficulty: "Srednje",
    servings: 6,
    vegetarian: true,
    calories: 450,
    keywords: ["tiramis"],
    ingredients: [
      { name: "mascarpone", amount: 500, unit: "g" },
      { name: "jaja", amount: 4, unit: "kom" },
      { name: "šećer", amount: 100, unit: "g" },
      { name: "piškote", amount: 300, unit: "g" },
      { name: "kava (espresso)", amount: 300, unit: "ml" },
      { name: "kakao", amount: 2, unit: "žlice" }
    ],
    steps: [
      "Žumanjke umuti sa šećerom u pjenastu kremu pa umiješaj mascarpone.",
      "Bjelanjke istuci u čvrst snijeg i lagano ih umiješaj u kremu.",
      "Piškote kratko umoči u ohlađenu kavu i složi ih u posudu.",
      "Premaži slojem kreme i ponovi slojeve.",
      "Ohladi najmanje 4 sata i prije posluživanja pospi kakaom."
    ]
  },
  {
    id: 14,
    image: "images/salata-s-tunom.jpg",
    name: "Salata s tunom",
    category: "salad",
    emoji: "🐟",
    icon: "fish",
    description: "Zasitna salata s tunom, grahom i kukuruzom, gotova za čas.",
    time: 15,
    difficulty: "Lako",
    servings: 2,
    vegetarian: false,
    calories: 340,
    keywords: ["salat+tun"],
    ingredients: [
      { name: "tuna (konzerva)", amount: 160, unit: "g" },
      { name: "kuhani grah", amount: 200, unit: "g" },
      { name: "kukuruz", amount: 100, unit: "g" },
      { name: "crveni luk", amount: 0.5, unit: "kom" },
      { name: "zelena salata", amount: 0.5, unit: "glavice" },
      { name: "maslinovo ulje", amount: 2, unit: "žlice" },
      { name: "limun", amount: 0.5, unit: "kom" }
    ],
    steps: [
      "Salatu operi i natrgaj na komade.",
      "Grah i kukuruz ocijedi, a luk nareži na tanke kolutove.",
      "Sve pomiješaj u zdjeli i dodaj ocijeđenu tunu.",
      "Začini uljem, limunovim sokom, solju i paprom."
    ]
  },
  {
    id: 15,
    image: "images/hummus.jpg",
    focus: "35% 55%",
    name: "Hummus",
    category: "starter",
    emoji: "🫘",
    icon: "beans",
    description: "Kremasti namaz od slanutka i tahinija, savršen uz povrće ili kruh.",
    time: 10,
    difficulty: "Lako",
    servings: 4,
    vegetarian: true,
    calories: 220,
    keywords: ["humus", "hummus"],
    ingredients: [
      { name: "kuhani slanutak", amount: 400, unit: "g" },
      { name: "tahini", amount: 2, unit: "žlice" },
      { name: "limun", amount: 1, unit: "kom" },
      { name: "češnjak", amount: 1, unit: "češanj" },
      { name: "maslinovo ulje", amount: 3, unit: "žlice" },
      { name: "kumin", amount: 0.5, unit: "žličice" }
    ],
    steps: [
      "Slanutak ocijedi, a malo tekućine sačuvaj.",
      "Sve sastojke stavi u blender.",
      "Miksaj dok ne dobiješ glatku kremu; po potrebi dodaj malo tekućine od slanutka.",
      "Posluži preliveno maslinovim uljem i posuto kuminom."
    ]
  }
];
