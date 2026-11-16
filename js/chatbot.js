/* =========================================================
   CHATBOT "KUHAR BOT"
   Vrsta: chatbot temeljen na pravilima i prepoznavanju namjera.
   Dodatne funkcionalnosti:
   1) odgovore oblikuje iz podataka web sjedišta (podaci.js)
   2) pamti kontekst razgovora (zadnji recept, zadnji filteri)
      i čuva razgovor u localStorage
   Koristi funkcije iz main.js (normaliziraj, pronadiRecept, ...).
   ========================================================= */
"use strict";

(function () {
  const IME_BOTA = "Kuhar Bot";
  const KLJUC_POVIJEST = "chat-povijest";
  const KLJUC_KONTEKST = "chat-kontekst";
  const PO_STRANICI = 3; // koliko recepata bot predlaže odjednom

  /* ---------- Rječnici za prepoznavanje ---------- */

  // riječi koje nisu sastojci (da "kako" ne bi bilo "kakao" i sl.)
  const STOP_RIJECI = new Set(
    ("imam imamo imas ima sto mogu moze mozes skuhati kuhati skuham napraviti napravim pripremiti " +
      "od do nesto neko neki neku nesta recept recepte recepta recepti daj dajte mi me koji koja koje " +
      "jelo jela treba trebam sa za bez malo kako jos li je su se da ne to ovo onda samo ali bi bih " +
      "hocu zelim volim preporuci predlozi danas sutra vecera veceru rucak dorucak brzo brz brzu " +
      "fino dobro molim hvala kuhar bot doma kuci frizideru frizider koliko vremena minuta min sat " +
      "sata osobe osoba osobu porcije porcija dodaj planer lako lagano jednostavno vegetarijansko " +
      "vegetarijanski vegetarijansku vegetarijanska vegetarijanskog vegansko posno nemam puno kad " +
      "sam smo meni nama ono neko nesto ista isto takoder sve svega").split(" ")
  );

  // dijelovi naziva sastojaka koji ne opisuju sam sastojak
  const STOP_U_SASTOJCIMA = new Set(
    "za ili kuhani kuhanje ribani mljeveno konzerva file namaz bijelo crno crveni zelena tamna suhe povrtni vinski mineralna".split(" ")
  );

  const KATEGORIJE_KORIJENI = {
    desert: ["desert", "slatk", "kolac", "poslastic"],
    juha: ["juh"],
    salata: ["salat"],
    predjelo: ["predjel", "grickalic", "namaz"],
    glavno: ["glavn", "rucak", "rucku", "vecer"]
  };

  const BROJEVI = {
    jedan: 1, jednu: 1, jednog: 1, dva: 2, dvije: 2, dvoje: 2, tri: 3, troje: 3, cetiri: 4, cetvero: 4,
    pet: 5, petero: 5, sest: 6, sestero: 6, sedam: 7, osam: 8, devet: 9, deset: 10, dvanaest: 12
  };

  // za svaki recept skup "ključnih riječi" sastojaka, npr. "feta sir" -> feta, sir
  const SASTOJCI_RECEPTA = new Map();
  const SVI_SASTOJCI = new Set();
  RECEPTI.forEach((r) => {
    const skup = new Set();
    r.sastojci.forEach((s) => {
      normaliziraj(s.naziv)
        .split(/[^a-z]+/)
        .filter((w) => w.length >= 3 && !STOP_U_SASTOJCIMA.has(w))
        .forEach((w) => {
          skup.add(w);
          SVI_SASTOJCI.add(w);
        });
    });
    SASTOJCI_RECEPTA.set(r.id, [...skup]);
  });

  /* ---------- Stanje ---------- */

  const POCETNI_KONTEKST = { zadnjiRecept: null, ponudeni: [], rezultati: [], prikazano: 0, filteri: null, cekaDan: null };
  let kontekst = Object.assign({}, POCETNI_KONTEKST, ucitaj(KLJUC_KONTEKST, {}));
  let povijest = ucitaj(KLJUC_POVIJEST, []);

  // ako je korisnik na stranici recepta, bot zna o kojem je receptu riječ
  if (document.body.dataset.stranica === "recept" && pronadiRecept(dohvatiParametar("id"))) {
    kontekst.zadnjiRecept = Number(dohvatiParametar("id"));
  }

  // "za ponedjeljak", "za srijedu", "za nedjelju"
  const DANI_AKUZATIV = ["ponedjeljak", "utorak", "srijedu", "četvrtak", "petak", "subotu", "nedjelju"];
  const zaDan = (dan) => DANI_AKUZATIV[DANI.indexOf(dan)];

  /* ---------- Pomoćne funkcije ---------- */

  // dvije riječi se "podudaraju" ako dijele dovoljno dug početak (jaja/jaje, sir/sira, tuna/tunu)
  function podudara(a, b) {
    const n = Math.min(a.length, b.length);
    let i = 0;
    while (i < n && a[i] === b[i]) i++;
    return i >= Math.max(3, n - 1);
  }

  function receptImaSastojak(r, rijec) {
    return SASTOJCI_RECEPTA.get(r.id).some((k) => podudara(rijec, k));
  }

  function escapeHtml(tekst) {
    const div = document.createElement("div");
    div.textContent = tekst;
    return div.innerHTML;
  }

  function poveznica(r) {
    return `<a href="recept.html?id=${r.id}">${r.emoji} ${r.naziv}</a>`;
  }

  function pronadiSpomenutiRecept(n) {
    return RECEPTI.find((r) => r.kljucne.some((k) => k.split("+").every((dio) => n.includes(dio))));
  }

  function pronadiDan(n) {
    if (/\bdanas\b/.test(n)) return DANI[(new Date().getDay() + 6) % 7];
    if (/\bsutra\b/.test(n)) return DANI[(new Date().getDay() + 7) % 7];
    const uzorci = [/\bponedjelj/, /\butor/, /\bsrijed/, /\bcetvrt/, /\bpet(ak|ka|ku)\b/, /\bsubot/, /\bnedjelj/];
    const i = uzorci.findIndex((u) => u.test(n));
    return i >= 0 ? DANI[i] : null;
  }

  /* ---------- Gradnja odgovora iz podataka ---------- */

  function sazetakRecepta(r) {
    return {
      html: `<strong>${poveznica(r)}</strong><br>${r.opis}<br>
             <small>⏱ ${r.vrijeme} min${r.napomena ? " " + r.napomena : ""} · ${r.tezina} · ${r.porcije} ${mnozina(r.porcije, "porcija", "porcije", "porcija")} · ${r.kalorije} kcal</small>`,
      cipovi: ["Kako se radi?", "Koji su sastojci?", "Dodaj u planer"]
    };
  }

  function sastojciRecepta(r, porcije) {
    const faktor = porcije / r.porcije;
    const popis = r.sastojci
      .map((s) => `<li>${formatKolicina(s.kolicina * faktor)} ${s.jedinica} ${s.naziv}</li>`)
      .join("");
    return {
      html: `Za recept <strong>${r.naziv}</strong> (${porcije} ${mnozina(porcije, "porcija", "porcije", "porcija")}) trebaš:<ul>${popis}</ul>`,
      cipovi: ["Kako se radi?", "Za 2 osobe", "Dodaj u planer"]
    };
  }

  function postupakRecepta(r) {
    return {
      html: `Evo postupka za recept <strong>${r.naziv}</strong>:<ol>${r.postupak.map((k) => `<li>${k}</li>`).join("")}</ol>
             Cijeli recept s brojačem porcija: ${poveznica(r)}`,
      cipovi: ["Koji su sastojci?", "Dodaj u planer", "Nešto drugo"]
    };
  }

  function opisFiltera(f) {
    const dijelovi = [];
    if (f.kategorija) dijelovi.push(KATEGORIJE[f.kategorija].naziv.toLowerCase());
    if (f.vege) dijelovi.push("vegetarijansko");
    if (f.maxVrijeme) dijelovi.push(`do ${f.maxVrijeme} min`);
    if (f.tezina) dijelovi.push("jednostavno");
    if (f.sastojci.length) dijelovi.push("s: " + f.sastojci.map((s) => s.prikaz).join(", "));
    if (f.iskljuci.length) dijelovi.push("bez: " + f.iskljuci.map((s) => s.prikaz).join(", "));
    return dijelovi.join(" · ");
  }

  function imaFiltera(f) {
    return f.sastojci.length || f.iskljuci.length || f.kategorija || f.vege || f.maxVrijeme || f.tezina;
  }

  // iz poruke izvlači sastojke, kategoriju, vrijeme, težinu i vegetarijansko
  function izvuciFiltere(n, original) {
    const rijeci = n.split(/[^a-z0-9]+/).filter(Boolean);
    const izvorne = original.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const f = { sastojci: [], iskljuci: [], kategorija: null, vege: false, maxVrijeme: null, tezina: null };
    const iskoristene = new Set();

    Object.entries(KATEGORIJE_KORIJENI).forEach(([kat, korijeni]) => {
      rijeci.forEach((w) => {
        if (korijeni.some((k) => w.startsWith(k))) {
          f.kategorija = kat;
          iskoristene.add(w);
        }
      });
    });

    if (/vegetarij|bez mes|posn|vegan|\bvege\b/.test(n)) f.vege = true;

    const minute = n.match(/(?:do|ispod|manje od|najvise)\s*(\d+)\s*min/);
    const sati = n.match(/(?:do|ispod|manje od|najvise)\s*(\d+)\s*sat/);
    if (minute) f.maxVrijeme = Number(minute[1]);
    else if (sati) f.maxVrijeme = Number(sati[1]) * 60;
    else if (/\bbrz|na brzinu|malo vremena|nemam (puno )?vremena|zurim/.test(n)) f.maxVrijeme = 20;

    if (/\b(lak|jednostav|pocetni)/.test(n)) f.tezina = "Lako";

    rijeci.forEach((w, i) => {
      if (w.length < 3 || STOP_RIJECI.has(w) || iskoristene.has(w)) return;
      if (![...SVI_SASTOJCI].some((k) => podudara(w, k))) return;
      const sastojak = { kljuc: w, prikaz: izvorne[i] || w };
      const iza = rijeci[i - 1] === "bez" || (rijeci[i - 1] === "i" && rijeci[i - 2] === "bez");
      if (iza) {
        if (!/^mes/.test(w)) f.iskljuci.push(sastojak);
      } else {
        f.sastojci.push(sastojak);
      }
    });
    return f;
  }

  function pretrazi(f) {
    return RECEPTI.map((r) => ({
      id: r.id,
      pogoci: f.sastojci.filter((s) => receptImaSastojak(r, s.kljuc)).length
    }))
      .filter(({ id, pogoci }) => {
        const r = pronadiRecept(id);
        if (f.sastojci.length && pogoci === 0) return false;
        if (f.kategorija && r.kategorija !== f.kategorija) return false;
        if (f.vege && !r.vegetarijansko) return false;
        if (f.maxVrijeme && r.vrijeme > f.maxVrijeme) return false;
        if (f.tezina && r.tezina !== f.tezina) return false;
        if (f.iskljuci.some((s) => receptImaSastojak(r, s.kljuc))) return false;
        return true;
      })
      .sort((a, b) => b.pogoci - a.pogoci || pronadiRecept(a.id).vrijeme - pronadiRecept(b.id).vrijeme);
  }

  function prikaziRezultate(uvod) {
    const dio = kontekst.rezultati.slice(kontekst.prikazano, kontekst.prikazano + PO_STRANICI);
    kontekst.prikazano += dio.length;
    const brojSastojaka = kontekst.filteri ? kontekst.filteri.sastojci.length : 0;

    const stavke = dio
      .map(({ id, pogoci }) => {
        const r = pronadiRecept(id);
        const sastojciInfo = brojSastojaka ? ` · tvojih sastojaka: ${pogoci}/${brojSastojaka}` : "";
        const mini = r.slika ? `<img src="${r.slika}" alt="" class="chat-mini">` : `<span class="chat-mini">${r.emoji}</span>`;
        return `<li>${mini}<div>${poveznica(r)}<br><small>⏱ ${r.vrijeme} min · ${r.tezina}${sastojciInfo}</small></div></li>`;
      })
      .join("");

    // ako je ponuđen samo jedan recept, on postaje "trenutni"; inače bot pita na koji se misli
    kontekst.zadnjiRecept = kontekst.rezultati.length === 1 ? dio[0].id : null;
    kontekst.ponudeni = dio.map((x) => x.id);

    const imaJos = kontekst.prikazano < kontekst.rezultati.length;
    const cipovi = dio.map(({ id }) => pronadiRecept(id).naziv);
    if (imaJos) cipovi.push("Još prijedloga");

    return {
      html: `${uvod}<ul class="chat-recepti">${stavke}</ul>${
        imaJos ? "Imam još prijedloga ako želiš." : "Klikni naziv recepta za više detalja."
      }`,
      cipovi
    };
  }

  function prikaziPlaner() {
    const planer = dohvatiPlaner();
    const dani = DANI.filter((d) => planer[d].length);
    if (!dani.length) {
      return {
        html: 'Planer je još prazan. Reci mi npr. <em>„dodaj rižoto u planer za petak“</em> ili otvori <a href="planer.html">planer obroka</a>.',
        cipovi: ["Iznenadi me", "Brzi ručak"]
      };
    }
    const popis = dani
      .map((d) => `<li><strong>${d}:</strong> ${planer[d].map((id) => poveznica(pronadiRecept(id))).join(", ")}</li>`)
      .join("");
    return {
      html: `Ovo je tvoj plan za tjedan:<ul>${popis}</ul>Popis za kupnju složen je na stranici <a href="planer.html">Planer obroka</a>.`
    };
  }

  /* ---------- Glavna logika: prepoznavanje namjere ---------- */

  function obradi(poruka) {
    const n = normaliziraj(poruka).trim();
    const brojRijeci = n.split(/\s+/).filter(Boolean).length;
    const spomenuti = pronadiSpomenutiRecept(n);
    const dan = pronadiDan(n);

    // 1. bot je pitao za koji dan – korisnik odgovara danom
    if (kontekst.cekaDan) {
      const r = pronadiRecept(kontekst.cekaDan);
      kontekst.cekaDan = null;
      if (dan && r) {
        dodajUPlaner(dan, r.id);
        return {
          html: `Gotovo! ✅ Recept <strong>${r.naziv}</strong> je u planeru za <strong>${zaDan(dan)}</strong>.`,
          cipovi: ["Što imam u planeru?", "Nešto drugo"]
        };
      }
      if (/^(ne|nema|odustani|nista|ipak ne)\b/.test(n)) return { html: "U redu, ništa nisam dodao. 🙂" };
    }

    // 2. pozdrav, zahvala, pomoć
    if (/^(bok|hej|hey|pozdrav|zdravo|cao|hello|hi|dobar (dan|jutro|vecer)|dobro jutro)\b/.test(n) && brojRijeci <= 4) {
      return {
        html: "Bok! 👋 Reci mi koje sastojke imaš ili kakvo jelo želiš, a ja ću pronaći recept.",
        cipovi: ["Što mogu od jaja?", "Brzi vegetarijanski ručak", "Neki desert"]
      };
    }
    if (/\b(hvala|fala|zahvaljujem|super|odlicno)\b/.test(n) && brojRijeci <= 5) {
      return { html: "Nema na čemu! Dobar tek! 😊", cipovi: ["Iznenadi me", "Neki desert"] };
    }
    if (/(sto (sve )?znas|sto mozes|pomoc|pomozi|kako radis|upute)/.test(n)) {
      return {
        html: `Mogu ti pomoći s ovim:
          <ul>
            <li>🥕 pronaći recept prema sastojcima koje imaš (<em>„imam jaja i sir“</em>)</li>
            <li>🌱 filtrirati po vrsti jela, vremenu i težini (<em>„brzi vegetarijanski ručak“</em>)</li>
            <li>📖 objasniti postupak i sastojke (<em>„kako se radi tiramisu?“</em>)</li>
            <li>⚖️ preračunati sastojke (<em>„za 6 osoba“</em>)</li>
            <li>📅 dodati recept u planer (<em>„dodaj u planer za petak“</em>)</li>
          </ul>
          Pamtim o čemu pričamo, pa možeš pitati i <em>„a nešto bez mesa?“</em>`,
        cipovi: ["Što mogu od jaja?", "Iznenadi me"]
      };
    }

    // 3. favoriti i planer
    if (/(favorit|spremi recept|spremi ga|spremi to)/.test(n)) {
      const r = spomenuti || pronadiRecept(kontekst.zadnjiRecept);
      if (!r) return { html: "Koji recept da spremim u favorite? Napiši mi njegov naziv." };
      kontekst.zadnjiRecept = r.id;
      if (!dohvatiFavorite().includes(r.id)) promijeniFavorit(r.id);
      document.querySelectorAll(`.srce[data-id="${r.id}"]`).forEach((g) => azurirajSrce(g, true));
      document.dispatchEvent(new CustomEvent("favoriti-promijenjeni"));
      return { html: `❤️ Recept <strong>${r.naziv}</strong> je u tvojim favoritima.` };
    }

    if (/(dodaj|stavi|ubaci)/.test(n) && /(planer|plan|dan|ponedjelj|utor|srijed|cetvrt|petak|subot|nedjelj|danas|sutra)/.test(n)) {
      const r = spomenuti || pronadiRecept(kontekst.zadnjiRecept);
      if (!r) return { html: "Koji recept da dodam u planer? Prvo mi reci što te zanima. 🙂", cipovi: ["Iznenadi me"] };
      kontekst.zadnjiRecept = r.id;
      if (dan) {
        dodajUPlaner(dan, r.id);
        return {
          html: `Gotovo! ✅ Recept <strong>${r.naziv}</strong> je u planeru za <strong>${zaDan(dan)}</strong>.`,
          cipovi: ["Što imam u planeru?"]
        };
      }
      kontekst.cekaDan = r.id;
      return { html: `Za koji dan da dodam <strong>${r.naziv}</strong>?`, cipovi: [...DANI] };
    }

    if (/(planer|popis za kupnju|kupnj|sto imam u planu|moj plan)/.test(n)) return prikaziPlaner();

    // 4. preračun porcija ("za 6 osoba", "za dvoje")
    const porcijeMatch = n.match(/(\d+|[a-z]+)\s*(osob|porcij|ljud|gost)/) || n.match(/\bza (dvoje|troje|cetvero|petero|sestero)\b/);
    if (porcijeMatch) {
      const broj = Number(porcijeMatch[1]) || BROJEVI[porcijeMatch[1]];
      const fp = izvuciFiltere(n, poruka);
      const jePretraga = !spomenuti && (fp.sastojci.length || fp.kategorija);
      const r = jePretraga ? null : spomenuti || pronadiRecept(kontekst.zadnjiRecept);
      if (broj && r) {
        kontekst.zadnjiRecept = r.id;
        return sastojciRecepta(r, Math.min(broj, 50));
      }
      if (broj && !r && !jePretraga) return { html: "Za koji recept da preračunam sastojke?", cipovi: ["Iznenadi me"] };
    }

    // 5. pitanje o točno određenom receptu
    if (spomenuti) {
      kontekst.zadnjiRecept = spomenuti.id;
      if (/(kako|postupak|priprem|radi se|koraci)/.test(n)) return postupakRecepta(spomenuti);
      if (/(sastoj|sto treba|treba mi|potrebno)/.test(n)) return sastojciRecepta(spomenuti, spomenuti.porcije);
      if (/(kalorij|kcal)/.test(n)) return { html: `Jedna porcija (${poveznica(spomenuti)}) ima oko <strong>${spomenuti.kalorije} kcal</strong>.` };
      if (/(traje|dugo|koliko vremena)/.test(n)) {
        return { html: `Priprema recepta ${poveznica(spomenuti)} traje oko <strong>${spomenuti.vrijeme} min</strong>${spomenuti.napomena ? " " + spomenuti.napomena : ""}.` };
      }
      return sazetakRecepta(spomenuti);
    }

    // 6. dodatno pitanje o receptu iz konteksta ("koliko to traje?")
    const zadnji = pronadiRecept(kontekst.zadnjiRecept);
    if (zadnji) {
      if (/(postupak|kako se (radi|priprema|pravi)|koraci|kako ga|kako ju|kako to)/.test(n)) return postupakRecepta(zadnji);
      if (/(sastojc|sastojak|sto (mi )?treba)/.test(n)) return sastojciRecepta(zadnji, zadnji.porcije);
      if (/(kalorij|kcal)/.test(n)) return { html: `Jedna porcija (${poveznica(zadnji)}) ima oko <strong>${zadnji.kalorije} kcal</strong>.` };
      if (/(koliko (to |ovo )?traje|koliko dugo|koliko vremena)/.test(n)) {
        return { html: `Priprema recepta ${poveznica(zadnji)} traje oko <strong>${zadnji.vrijeme} min</strong>${zadnji.napomena ? " " + zadnji.napomena : ""}.` };
      }
    }

    if (!zadnji && kontekst.ponudeni && kontekst.ponudeni.length > 1 &&
        /(postupak|kako se (radi|priprema|pravi)|koraci|sastojc|kalorij|koliko (to )?traje|koliko dugo)/.test(n)) {
      return {
        html: "Ponudio sam ti nekoliko recepata. Na koji od njih misliš?",
        cipovi: kontekst.ponudeni.map((id) => pronadiRecept(id).naziv)
      };
    }

    // 7. nasumični prijedlog
    if (/(iznenadi|nasumic|bilo sto|svejedno|ne znam sto)/.test(n)) {
      const r = RECEPTI[Math.floor(Math.random() * RECEPTI.length)];
      kontekst.zadnjiRecept = r.id;
      const odg = sazetakRecepta(r);
      odg.html = "Što kažeš na ovo? 🎲<br>" + odg.html;
      odg.cipovi = ["Kako se radi?", "Iznenadi me opet", "Dodaj u planer"];
      return odg;
    }

    // 8. još prijedloga iz prethodne pretrage
    if (/^(jos|daj jos|jos nesto|nesto drugo|drugo|drugi|vise|ima li jos)\b/.test(n) && !imaFiltera(izvuciFiltere(n, poruka))) {
      if (kontekst.prikazano < kontekst.rezultati.length) return prikaziRezultate("Evo još prijedloga:");
      return { html: "To su svi recepti koji odgovaraju. Probaj s drugim sastojcima ili vrstom jela.", cipovi: ["Neki desert", "Iznenadi me"] };
    }

    // 9. pretraga po sastojcima i filterima
    let f = izvuciFiltere(n, poruka);
    if (imaFiltera(f)) {
      // nastavak prethodnog upita: "a nešto bez mesa?", "i da je brzo"
      const nastavak = kontekst.filteri && /^(a|i|ali|moze|a moze|sto je s)\b/.test(n);
      if (nastavak) {
        const st = kontekst.filteri;
        f = {
          sastojci: f.sastojci.length ? f.sastojci : st.sastojci,
          iskljuci: [...st.iskljuci, ...f.iskljuci],
          kategorija: f.kategorija || st.kategorija,
          vege: f.vege || st.vege,
          maxVrijeme: f.maxVrijeme || st.maxVrijeme,
          tezina: f.tezina || st.tezina
        };
      }
      kontekst.filteri = f;
      kontekst.rezultati = pretrazi(f);
      kontekst.prikazano = 0;

      if (!kontekst.rezultati.length) {
        // pokušaj samo sa sastojcima, bez ostalih uvjeta
        if (f.sastojci.length && (f.kategorija || f.vege || f.maxVrijeme || f.tezina || f.iskljuci.length)) {
          const blaze = { ...f, kategorija: null, vege: false, maxVrijeme: null, tezina: null, iskljuci: [] };
          const rez = pretrazi(blaze);
          if (rez.length) {
            kontekst.filteri = blaze;
            kontekst.rezultati = rez;
            return prikaziRezultate(`Nemam recept koji odgovara svemu (${opisFiltera(f)}) 😕<br>Ali s tim sastojcima imam:`);
          }
        }
        return {
          html: `Nažalost, nemam recept za to (${opisFiltera(f)}). 😕 Probaj s drugim sastojcima.`,
          cipovi: ["Iznenadi me", "Što sve znaš?"]
        };
      }
      return prikaziRezultate(`Evo što predlažem (${opisFiltera(f)}):`);
    }

    // 10. nije prepoznato
    return {
      html: "Hmm, nisam siguran što misliš. 🤔 Probaj npr. <em>„što mogu od piletine?“</em>, <em>„neka juha“</em> ili <em>„kako se radi rižoto?“</em>",
      cipovi: ["Što sve znaš?", "Iznenadi me"]
    };
  }

  /* ---------- Sučelje ---------- */

  document.body.insertAdjacentHTML(
    "beforeend",
    `<button class="chat-gumb" id="chat-gumb" aria-label="Otvori chat s Kuhar Botom" aria-expanded="false">
       <span class="chat-gumb-ikona">💬</span>
     </button>
     <section class="chat-prozor" id="chat-prozor" hidden aria-label="Chat s Kuhar Botom">
       <header class="chat-zaglavlje">
         <div class="chat-avatar">👩‍🍳</div>
         <div class="chat-naslov"><strong>${IME_BOTA}</strong><small>Pomoćnik za recepte</small></div>
         <button class="chat-akcija" id="chat-ocisti" title="Novi razgovor" aria-label="Započni novi razgovor">↺</button>
         <button class="chat-akcija" id="chat-zatvori" aria-label="Zatvori chat">✕</button>
       </header>
       <div class="chat-poruke" id="chat-poruke" aria-live="polite"></div>
       <div class="chat-cipovi" id="chat-cipovi"></div>
       <form class="chat-forma" id="chat-forma" autocomplete="off">
         <label for="chat-unos" class="vizualno-skriveno">Tvoja poruka</label>
         <input id="chat-unos" type="text" placeholder="Npr. imam jaja i sir…" maxlength="200">
         <button type="submit" aria-label="Pošalji">➤</button>
       </form>
     </section>`
  );

  const gumb = document.getElementById("chat-gumb");
  const prozor = document.getElementById("chat-prozor");
  const poruke = document.getElementById("chat-poruke");
  const cipovi = document.getElementById("chat-cipovi");
  const forma = document.getElementById("chat-forma");
  const unos = document.getElementById("chat-unos");

  function spremiStanje() {
    spremi(KLJUC_POVIJEST, povijest.slice(-40));
    spremi(KLJUC_KONTEKST, kontekst);
  }

  function nacrtajPoruku(p) {
    const el = document.createElement("div");
    el.className = `chat-poruka ${p.uloga}`;
    el.innerHTML = p.html;
    poruke.appendChild(el);
    poruke.scrollTop = poruke.scrollHeight;
  }

  function prikaziCipove(lista) {
    cipovi.innerHTML = "";
    (lista || []).forEach((tekst) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "cip";
      c.textContent = tekst;
      cipovi.appendChild(c);
    });
  }

  function dodajPoruku(uloga, html, listaCipova) {
    const p = { uloga, html };
    if (listaCipova) p.cipovi = listaCipova;
    povijest.push(p);
    nacrtajPoruku(p);
    spremiStanje();
  }

  function pozdravnaPoruka() {
    let tekst = `Bok! 👋 Ja sam ${IME_BOTA}. Reci mi koje sastojke imaš ili kakvo jelo želiš, a ja ću predložiti recept.`;
    const r = pronadiRecept(kontekst.zadnjiRecept);
    if (document.body.dataset.stranica === "recept" && r) {
      tekst += `<br>Vidim da gledaš <strong>${r.naziv}</strong>, pa me slobodno pitaj nešto o tom receptu.`;
    }
    dodajPoruku("bot", tekst, ["Što mogu od jaja?", "Brzi vegetarijanski ručak", "Neki desert", "Što sve znaš?"]);
    prikaziCipove(povijest[povijest.length - 1].cipovi);
  }

  function posalji(tekst) {
    tekst = tekst.trim();
    if (!tekst) return;
    dodajPoruku("korisnik", escapeHtml(tekst));
    prikaziCipove([]);
    unos.value = "";

    // indikator "bot piše..."
    const pise = document.createElement("div");
    pise.className = "chat-poruka bot pise";
    pise.innerHTML = "<span></span><span></span><span></span>";
    poruke.appendChild(pise);
    poruke.scrollTop = poruke.scrollHeight;

    setTimeout(() => {
      pise.remove();
      let odgovor;
      try {
        odgovor = obradi(tekst);
      } catch (e) {
        console.error(e);
        odgovor = { html: "Ups, nešto je pošlo krivo. Pokušaj ponovno. 🙈" };
      }
      dodajPoruku("bot", odgovor.html, odgovor.cipovi);
      prikaziCipove(odgovor.cipovi);
    }, 450 + Math.random() * 400);
  }

  function otvori() {
    prozor.hidden = false;
    gumb.setAttribute("aria-expanded", "true");
    gumb.classList.add("otvoren");
    if (!poruke.children.length) {
      povijest.forEach(nacrtajPoruku);
      if (!povijest.length) pozdravnaPoruka();
      else prikaziCipove(povijest[povijest.length - 1].cipovi);
    }
    poruke.scrollTop = poruke.scrollHeight;
    unos.focus();
  }

  function zatvori() {
    prozor.hidden = true;
    gumb.setAttribute("aria-expanded", "false");
    gumb.classList.remove("otvoren");
    gumb.focus();
  }

  gumb.addEventListener("click", () => (prozor.hidden ? otvori() : zatvori()));
  document.getElementById("chat-zatvori").addEventListener("click", zatvori);
  document.getElementById("chat-ocisti").addEventListener("click", () => {
    povijest = [];
    const naStraniciRecepta = document.body.dataset.stranica === "recept" ? kontekst.zadnjiRecept : null;
    kontekst = Object.assign({}, POCETNI_KONTEKST, { zadnjiRecept: naStraniciRecepta });
    poruke.innerHTML = "";
    pozdravnaPoruka();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !prozor.hidden) zatvori();
  });

  forma.addEventListener("submit", (e) => {
    e.preventDefault();
    posalji(unos.value);
  });
  cipovi.addEventListener("click", (e) => {
    const c = e.target.closest(".cip");
    if (c) posalji(c.textContent);
  });

  // gumbi na stranici koji otvaraju chat (npr. na početnoj)
  document.querySelectorAll(".otvori-chat").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      otvori();
    })
  );

  // za testiranje u konzoli preglednika: kuharBot("imam jaja")
  window.kuharBot = (tekst) => obradi(tekst);
})();
