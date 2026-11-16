/* =========================================================
   GLAVNA SKRIPTA STRANICE
   - zajedničko: tema, mobilni izbornik, favoriti, obavijesti
   - po stranicama: početna, recepti, recept, planer, kontakt
   ========================================================= */
"use strict";

/* ---------- Pomoćne funkcije ---------- */

// mala slova i bez dijakritika ("Rižoto" -> "rizoto") radi lakše pretrage
function normaliziraj(tekst) {
  return String(tekst)
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// čitanje i spremanje u localStorage (u try/catch jer preglednik može blokirati pohranu)
function ucitaj(kljuc, zadano) {
  try {
    const vrijednost = localStorage.getItem(kljuc);
    return vrijednost ? JSON.parse(vrijednost) : zadano;
  } catch (e) {
    return zadano;
  }
}

function spremi(kljuc, vrijednost) {
  try {
    localStorage.setItem(kljuc, JSON.stringify(vrijednost));
  } catch (e) {
    /* pohrana nije dostupna – stranica i dalje radi */
  }
}

function dohvatiParametar(ime) {
  return new URLSearchParams(window.location.search).get(ime);
}

function pronadiRecept(id) {
  return RECEPTI.find((r) => r.id === Number(id));
}

// 1,5 umjesto 1.5 i zaokruživanje na jednu decimalu
function formatKolicina(broj) {
  return String(Math.round(broj * 10) / 10).replace(".", ",");
}

// hrvatska množina: 1 recept, 2 recepta, 5 recepata
function mnozina(n, jedan, dva, pet) {
  const zadnja = n % 10;
  const zadnjeDvije = n % 100;
  if (zadnja === 1 && zadnjeDvije !== 11) return jedan;
  if (zadnja >= 2 && zadnja <= 4 && (zadnjeDvije < 12 || zadnjeDvije > 14)) return dva;
  return pet;
}

// kratka poruka u kutu ekrana (dinamičko dodavanje i uklanjanje elementa)
function obavijest(tekst) {
  let kontejner = document.querySelector(".obavijesti");
  if (!kontejner) {
    kontejner = document.createElement("div");
    kontejner.className = "obavijesti";
    kontejner.setAttribute("aria-live", "polite");
    document.body.appendChild(kontejner);
  }
  const poruka = document.createElement("div");
  poruka.className = "obavijest";
  poruka.textContent = tekst;
  kontejner.appendChild(poruka);
  setTimeout(() => {
    poruka.classList.add("nestaje");
    setTimeout(() => poruka.remove(), 400);
  }, 2500);
}

/* ---------- Favoriti ---------- */

function dohvatiFavorite() {
  return ucitaj("favoriti", []);
}

function promijeniFavorit(id) {
  let favoriti = dohvatiFavorite();
  if (favoriti.includes(id)) {
    favoriti = favoriti.filter((x) => x !== id);
    obavijest("Uklonjeno iz favorita");
  } else {
    favoriti.push(id);
    obavijest("Dodano u favorite ❤️");
  }
  spremi("favoriti", favoriti);
  return favoriti.includes(id);
}

function azurirajSrce(gumb, jeFavorit) {
  gumb.classList.toggle("aktivno", jeFavorit);
  gumb.setAttribute("aria-pressed", jeFavorit);
  if (gumb.classList.contains("srce-veliko")) {
    gumb.textContent = jeFavorit ? "♥ Spremljeno" : "♡ Spremi";
  } else {
    gumb.textContent = jeFavorit ? "♥" : "♡";
  }
}

// jedan "click" slušač za sva srca na stranici (delegiranje događaja)
document.addEventListener("click", (e) => {
  const srce = e.target.closest(".srce");
  if (!srce) return;
  e.preventDefault();
  const id = Number(srce.dataset.id);
  const jeFavorit = promijeniFavorit(id);
  document.querySelectorAll(`.srce[data-id="${id}"]`).forEach((g) => azurirajSrce(g, jeFavorit));
  document.dispatchEvent(new CustomEvent("favoriti-promijenjeni"));
});

/* ---------- Planer (spremljen u localStorage) ---------- */

function dohvatiPlaner() {
  const planer = ucitaj("planer", {});
  DANI.forEach((dan) => {
    if (!Array.isArray(planer[dan])) planer[dan] = [];
  });
  return planer;
}

function dodajUPlaner(dan, id) {
  const planer = dohvatiPlaner();
  planer[dan].push(Number(id));
  spremi("planer", planer);
}

/* ---------- Slika recepta (fotografija ili emoji ako slike nema) ---------- */

function slikaRecepta(r) {
  return r.slika
    ? `<img src="${r.slika}" alt="${r.naziv}" loading="lazy"${r.fokus ? ` style="object-position:${r.fokus}"` : ""}>`
    : `<span>${r.emoji}</span>`;
}

/* ---------- Kartica recepta ---------- */

function kreirajKarticu(r) {
  const kat = KATEGORIJE[r.kategorija];
  const jeFavorit = dohvatiFavorite().includes(r.id);
  const kartica = document.createElement("article");
  kartica.className = "kartica";
  kartica.innerHTML = `
    <a href="recept.html?id=${r.id}" class="kartica-slika" style="--boja:${kat.boja}" aria-hidden="true" tabindex="-1">
      ${slikaRecepta(r)}
    </a>
    <button class="srce ${jeFavorit ? "aktivno" : ""}" data-id="${r.id}" aria-pressed="${jeFavorit}"
      aria-label="Spremi u favorite">${jeFavorit ? "♥" : "♡"}</button>
    <div class="kartica-tijelo">
      <span class="oznaka">${kat.jednina}</span>
      <h3><a href="recept.html?id=${r.id}">${r.naziv}</a></h3>
      <p>${r.opis}</p>
      <div class="meta">
        <span>⏱ ${r.vrijeme} min</span>
        <span>📊 ${r.tezina}</span>
        ${r.vegetarijansko ? '<span title="Vegetarijansko">🌱</span>' : ""}
      </div>
    </div>
    <div class="kartica-nutri">🔥 ${r.kalorije} kcal po porciji · ${r.sastojci.length} sastojaka</div>
  `;
  // mouseover: prikaz dodatnih informacija
  kartica.addEventListener("mouseover", () => kartica.classList.add("prikazi-nutri"));
  kartica.addEventListener("mouseleave", () => kartica.classList.remove("prikazi-nutri"));
  return kartica;
}

/* ---------- Tema (svijetla / tamna) ---------- */

function postaviTemu(tema) {
  document.documentElement.dataset.tema = tema;
  const gumb = document.getElementById("tema-gumb");
  if (gumb) {
    gumb.textContent = tema === "tamna" ? "☀️" : "🌙";
    gumb.setAttribute("aria-label", tema === "tamna" ? "Uključi svijetlu temu" : "Uključi tamnu temu");
  }
  spremi("tema", tema);
}

function inicijalizirajTemu() {
  const sustavTamna = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  postaviTemu(ucitaj("tema", sustavTamna ? "tamna" : "svijetla"));
  const gumb = document.getElementById("tema-gumb");
  if (gumb) {
    gumb.addEventListener("click", () => {
      const nova = document.documentElement.dataset.tema === "tamna" ? "svijetla" : "tamna";
      postaviTemu(nova);
    });
  }
}

/* ---------- Mobilni izbornik ---------- */

function inicijalizirajNavigaciju() {
  const gumb = document.getElementById("izbornik-gumb");
  const nav = document.getElementById("navigacija");
  if (!gumb || !nav) return;
  gumb.addEventListener("click", () => {
    const otvoren = nav.classList.toggle("otvoren");
    gumb.setAttribute("aria-expanded", otvoren);
    gumb.textContent = otvoren ? "✕" : "☰";
  });
}

/* =========================================================
   POČETNA
   ========================================================= */
function inicijalizirajPocetnu() {
  // recept dana – nasumični odabir, gumb daje novi prijedlog
  const receptDana = document.getElementById("recept-dana");
  const gumbNovi = document.getElementById("novi-prijedlog");
  let trenutni = -1;

  function prikaziReceptDana() {
    let i;
    do {
      i = Math.floor(Math.random() * RECEPTI.length);
    } while (i === trenutni && RECEPTI.length > 1);
    trenutni = i;
    const r = RECEPTI[i];
    const kat = KATEGORIJE[r.kategorija];
    receptDana.innerHTML = `
      <div class="istaknuto-slika" style="--boja:${kat.boja}">${slikaRecepta(r)}</div>
      <div class="istaknuto-tekst">
        <span class="oznaka">${kat.jednina}</span>
        <h3>${r.naziv}</h3>
        <p>${r.opis}</p>
        <div class="meta">
          <span>⏱ ${r.vrijeme} min</span><span>📊 ${r.tezina}</span><span>🍽 ${r.porcije} ${mnozina(r.porcije, "porcija", "porcije", "porcija")}</span>
        </div>
        <a href="recept.html?id=${r.id}" class="gumb gumb-primarni">Pogledaj recept →</a>
      </div>`;
    // ponovno pokretanje animacije
    receptDana.classList.remove("animacija");
    void receptDana.offsetWidth;
    receptDana.classList.add("animacija");
  }
  gumbNovi.addEventListener("click", prikaziReceptDana);
  prikaziReceptDana();

  // kategorije
  const kategorije = document.getElementById("kategorije");
  Object.entries(KATEGORIJE).forEach(([kljuc, k]) => {
    const broj = RECEPTI.filter((r) => r.kategorija === kljuc).length;
    kategorije.insertAdjacentHTML(
      "beforeend",
      `<a class="kategorija" href="recepti.html?kategorija=${kljuc}" style="--boja:${k.boja}">
         <span class="kategorija-emoji">${k.emoji}</span>
         <strong>${k.naziv}</strong>
         <small>${broj} ${mnozina(broj, "recept", "recepta", "recepata")}</small>
       </a>`
    );
  });

  // tri najbrža recepta
  const najbrzi = document.getElementById("najbrzi");
  [...RECEPTI]
    .sort((a, b) => a.vrijeme - b.vrijeme)
    .slice(0, 3)
    .forEach((r) => najbrzi.appendChild(kreirajKarticu(r)));

  // favoriti – sekcija se prikazuje samo ako ih ima
  const sekcijaFav = document.getElementById("favoriti-sekcija");
  const mrezaFav = document.getElementById("favoriti-mreza");
  function prikaziFavorite() {
    const favoriti = dohvatiFavorite().map(pronadiRecept).filter(Boolean);
    mrezaFav.innerHTML = "";
    favoriti.forEach((r) => mrezaFav.appendChild(kreirajKarticu(r)));
    sekcijaFav.hidden = favoriti.length === 0;
  }
  prikaziFavorite();
  document.addEventListener("favoriti-promijenjeni", prikaziFavorite);
}

/* =========================================================
   RECEPTI – pretraga i filtriranje
   ========================================================= */
function inicijalizirajRecepte() {
  const pretraga = document.getElementById("pretraga");
  const kategorija = document.getElementById("filter-kategorija");
  const vrijeme = document.getElementById("filter-vrijeme");
  const tezina = document.getElementById("filter-tezina");
  const vege = document.getElementById("filter-vege");
  const samoFavoriti = document.getElementById("filter-favoriti");
  const ponisti = document.getElementById("ponisti-filtere");
  const mreza = document.getElementById("mreza-recepata");
  const brojac = document.getElementById("brojac");
  const prazno = document.getElementById("nema-rezultata");

  Object.entries(KATEGORIJE).forEach(([kljuc, k]) => kategorija.add(new Option(k.naziv, kljuc)));

  // početne vrijednosti iz URL-a (npr. recepti.html?kategorija=desert)
  const katIzUrla = dohvatiParametar("kategorija");
  if (katIzUrla && KATEGORIJE[katIzUrla]) kategorija.value = katIzUrla;
  const traziIzUrla = dohvatiParametar("trazi");
  if (traziIzUrla) pretraga.value = traziIzUrla;

  function filtriraj() {
    const rijeci = normaliziraj(pretraga.value.trim()).split(/\s+/).filter(Boolean);
    const favoriti = dohvatiFavorite();

    const rezultati = RECEPTI.filter((r) => {
      const tekst = normaliziraj([r.naziv, r.opis, ...r.sastojci.map((s) => s.naziv)].join(" "));
      if (!rijeci.every((rijec) => tekst.includes(rijec))) return false;
      if (kategorija.value && r.kategorija !== kategorija.value) return false;
      if (vrijeme.value && r.vrijeme > Number(vrijeme.value)) return false;
      if (tezina.value && r.tezina !== tezina.value) return false;
      if (vege.checked && !r.vegetarijansko) return false;
      if (samoFavoriti.checked && !favoriti.includes(r.id)) return false;
      return true;
    });

    mreza.innerHTML = "";
    rezultati.forEach((r) => mreza.appendChild(kreirajKarticu(r)));
    brojac.textContent = `Pronađeno: ${rezultati.length} ${mnozina(rezultati.length, "recept", "recepta", "recepata")}`;
    prazno.hidden = rezultati.length > 0;
  }

  pretraga.addEventListener("input", filtriraj);
  [kategorija, vrijeme, tezina, vege, samoFavoriti].forEach((el) => el.addEventListener("change", filtriraj));
  ponisti.addEventListener("click", () => {
    pretraga.value = "";
    kategorija.value = "";
    vrijeme.value = "";
    tezina.value = "";
    vege.checked = false;
    samoFavoriti.checked = false;
    history.replaceState(null, "", "recepti.html");
    filtriraj();
    pretraga.focus();
  });
  document.addEventListener("favoriti-promijenjeni", () => {
    if (samoFavoriti.checked) filtriraj();
  });

  filtriraj();
}

/* =========================================================
   POJEDINAČNI RECEPT
   ========================================================= */
function inicijalizirajRecept() {
  const sadrzaj = document.getElementById("recept-sadrzaj");
  const r = pronadiRecept(dohvatiParametar("id"));

  if (!r) {
    sadrzaj.innerHTML = `
      <div class="prazno">
        <p class="prazno-emoji">🍽️</p>
        <h1>Recept nije pronađen</h1>
        <p>Možda je poveznica neispravna. Pogledaj sve recepte.</p>
        <a href="recepti.html" class="gumb gumb-primarni">Svi recepti</a>
      </div>`;
    document.getElementById("slicni-sekcija").hidden = true;
    return;
  }

  const kat = KATEGORIJE[r.kategorija];
  const jeFavorit = dohvatiFavorite().includes(r.id);
  document.title = `${r.naziv} | Kuharica`;

  sadrzaj.innerHTML = `
    <nav class="mrvice" aria-label="Putanja"><a href="recepti.html">Recepti</a> › <a href="recepti.html?kategorija=${r.kategorija}">${kat.naziv}</a> › <span>${r.naziv}</span></nav>
    <div class="recept-zaglavlje">
      <div class="recept-emoji" style="--boja:${kat.boja}">${slikaRecepta(r)}</div>
      <div class="recept-uvod">
        <span class="oznaka">${kat.jednina}</span>
        <h1>${r.naziv}</h1>
        <p class="recept-opis">${r.opis}</p>
        <ul class="recept-meta">
          <li>⏱ <strong>${r.vrijeme} min</strong>${r.napomena ? ` <small>${r.napomena}</small>` : ""}</li>
          <li>📊 ${r.tezina}</li>
          <li>🔥 ${r.kalorije} kcal / porcija</li>
          <li>${r.vegetarijansko ? "🌱 Vegetarijansko" : "🍖 Sadrži meso"}</li>
        </ul>
        <div class="recept-akcije">
          <button class="gumb srce srce-veliko ${jeFavorit ? "aktivno" : ""}" data-id="${r.id}" aria-pressed="${jeFavorit}">${jeFavorit ? "♥ Spremljeno" : "♡ Spremi"}</button>
          <div class="dodaj-planer">
            <label for="planer-dan" class="vizualno-skriveno">Dan u tjednu</label>
            <select id="planer-dan">${DANI.map((d) => `<option>${d}</option>`).join("")}</select>
            <button class="gumb gumb-primarni" id="dodaj-u-planer">📅 Dodaj u planer</button>
          </div>
        </div>
      </div>
    </div>

    <div class="recept-tijelo">
      <section class="blok">
        <h2>Sastojci</h2>
        <div class="porcije">
          <span>Porcije:</span>
          <button class="gumb-ikona" id="manje-porcija" aria-label="Manje porcija">−</button>
          <input type="number" id="broj-porcija" min="1" max="50" value="${r.porcije}" aria-label="Broj porcija">
          <button class="gumb-ikona" id="vise-porcija" aria-label="Više porcija">+</button>
        </div>
        <ul class="sastojci-popis" id="sastojci-popis"></ul>
        <p class="savjet">💡 Klikni sastojak kad ga pripremiš.</p>
      </section>

      <section class="blok">
        <h2>Postupak</h2>
        <ol class="postupak" id="postupak">
          ${r.postupak.map((korak) => `<li tabindex="0">${korak}</li>`).join("")}
        </ol>
        <div class="napredak" aria-hidden="true"><div class="napredak-traka" id="napredak-traka"></div></div>
        <p class="savjet" id="napredak-tekst">💡 Klikni korak kad ga završiš.</p>
      </section>
    </div>`;

  // --- preračun porcija ---
  const unosPorcija = document.getElementById("broj-porcija");
  const popis = document.getElementById("sastojci-popis");
  const oznaceni = new Set();

  function prikaziSastojke() {
    let porcije = parseInt(unosPorcija.value, 10);
    if (isNaN(porcije) || porcije < 1) return;
    porcije = Math.min(porcije, 50);
    const faktor = porcije / r.porcije;
    popis.innerHTML = r.sastojci
      .map(
        (s, i) => `<li data-i="${i}" class="${oznaceni.has(i) ? "oznaceno" : ""}">
          <span class="kolicina">${formatKolicina(s.kolicina * faktor)} ${s.jedinica}</span> ${s.naziv}</li>`
      )
      .join("");
  }

  function promijeniPorcije(za) {
    const nova = Math.min(50, Math.max(1, (parseInt(unosPorcija.value, 10) || r.porcije) + za));
    unosPorcija.value = nova;
    prikaziSastojke();
  }

  document.getElementById("manje-porcija").addEventListener("click", () => promijeniPorcije(-1));
  document.getElementById("vise-porcija").addEventListener("click", () => promijeniPorcije(1));
  unosPorcija.addEventListener("input", prikaziSastojke);
  unosPorcija.addEventListener("change", () => {
    if (!(parseInt(unosPorcija.value, 10) >= 1)) unosPorcija.value = r.porcije;
    prikaziSastojke();
  });

  popis.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const i = Number(li.dataset.i);
    if (oznaceni.has(i)) oznaceni.delete(i);
    else oznaceni.add(i);
    li.classList.toggle("oznaceno");
  });

  prikaziSastojke();

  // --- označavanje koraka i traka napretka ---
  const postupak = document.getElementById("postupak");
  const traka = document.getElementById("napredak-traka");
  const tekstNapretka = document.getElementById("napredak-tekst");

  function oznaciKorak(li) {
    li.classList.toggle("gotovo");
    const ukupno = r.postupak.length;
    const gotovo = postupak.querySelectorAll(".gotovo").length;
    traka.style.width = `${(gotovo / ukupno) * 100}%`;
    tekstNapretka.textContent = gotovo === 0 ? "💡 Klikni korak kad ga završiš." : `Završeno ${gotovo} od ${ukupno} koraka`;
    if (gotovo === ukupno) obavijest("Sve gotovo – dobar tek! 🎉");
  }
  postupak.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) oznaciKorak(li);
  });
  postupak.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("li")) {
      e.preventDefault();
      oznaciKorak(e.target);
    }
  });

  // --- dodavanje u planer ---
  document.getElementById("dodaj-u-planer").addEventListener("click", () => {
    const dan = document.getElementById("planer-dan").value;
    dodajUPlaner(dan, r.id);
    obavijest(`Dodano u planer: ${dan} 📅`);
  });

  // --- slični recepti ---
  const slicni = RECEPTI.filter((x) => x.kategorija === r.kategorija && x.id !== r.id).slice(0, 3);
  const mrezaSlicnih = document.getElementById("slicni-mreza");
  slicni.forEach((x) => mrezaSlicnih.appendChild(kreirajKarticu(x)));
  document.getElementById("slicni-sekcija").hidden = slicni.length === 0;
}

/* =========================================================
   PLANER OBROKA I POPIS ZA KUPNJU
   ========================================================= */
function inicijalizirajPlaner() {
  const forma = document.getElementById("planer-forma");
  const odabirRecepta = document.getElementById("planer-recept");
  const odabirDana = document.getElementById("planer-dan");
  const tjedan = document.getElementById("tjedan");
  const popisKupnje = document.getElementById("popis-kupnje");
  const brojacKupnje = document.getElementById("brojac-kupnje");
  const ocisti = document.getElementById("ocisti-planer");

  RECEPTI.forEach((r) => odabirRecepta.add(new Option(`${r.emoji} ${r.naziv}`, r.id)));
  DANI.forEach((d) => odabirDana.add(new Option(d, d)));

  function prikaziTjedan() {
    const planer = dohvatiPlaner();
    tjedan.innerHTML = "";
    DANI.forEach((dan) => {
      const stupac = document.createElement("div");
      stupac.className = "dan";
      const stavke = planer[dan]
        .map((id, i) => {
          const r = pronadiRecept(id);
          if (!r) return "";
          return `<li><a href="recept.html?id=${r.id}">${r.emoji} ${r.naziv}</a>
                  <button class="ukloni" data-dan="${dan}" data-i="${i}" aria-label="Ukloni ${r.naziv}">✕</button></li>`;
        })
        .join("");
      stupac.innerHTML = `<h3>${dan}</h3>${stavke ? `<ul>${stavke}</ul>` : '<p class="dan-prazno">Nema obroka</p>'}`;
      tjedan.appendChild(stupac);
    });
    prikaziPopisKupnje(planer);
  }

  function prikaziPopisKupnje(planer) {
    // zbrajanje istih sastojaka iz svih planiranih recepata
    const zbroj = {};
    Object.values(planer)
      .flat()
      .forEach((id) => {
        const r = pronadiRecept(id);
        if (!r) return;
        r.sastojci.forEach((s) => {
          const kljuc = `${s.naziv}|${s.jedinica}`;
          zbroj[kljuc] = (zbroj[kljuc] || 0) + s.kolicina;
        });
      });

    const stavke = Object.entries(zbroj).sort(([a], [b]) => a.localeCompare(b, "hr"));
    const kupljeno = ucitaj("kupljeno", []);

    if (stavke.length === 0) {
      popisKupnje.innerHTML = '<li class="dan-prazno">Dodaj recepte u planer i popis će se složiti sam.</li>';
      brojacKupnje.textContent = "";
      return;
    }

    popisKupnje.innerHTML = stavke
      .map(([kljuc, kolicina]) => {
        const [naziv, jedinica] = kljuc.split("|");
        const oznaceno = kupljeno.includes(kljuc);
        return `<li class="${oznaceno ? "kupljeno" : ""}">
          <label><input type="checkbox" data-kljuc="${kljuc}" ${oznaceno ? "checked" : ""}>
          <span><strong>${formatKolicina(kolicina)} ${jedinica}</strong> ${naziv}</span></label></li>`;
      })
      .join("");
    azurirajBrojacKupnje();
  }

  function azurirajBrojacKupnje() {
    const ukupno = popisKupnje.querySelectorAll("input").length;
    const kupljeno = popisKupnje.querySelectorAll("input:checked").length;
    brojacKupnje.textContent = `Kupljeno ${kupljeno} od ${ukupno}`;
  }

  forma.addEventListener("submit", (e) => {
    e.preventDefault();
    dodajUPlaner(odabirDana.value, odabirRecepta.value);
    const r = pronadiRecept(odabirRecepta.value);
    obavijest(`${r.naziv} → ${odabirDana.value}`);
    prikaziTjedan();
  });

  tjedan.addEventListener("click", (e) => {
    const gumb = e.target.closest(".ukloni");
    if (!gumb) return;
    const planer = dohvatiPlaner();
    planer[gumb.dataset.dan].splice(Number(gumb.dataset.i), 1);
    spremi("planer", planer);
    prikaziTjedan();
  });

  popisKupnje.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const kljuc = e.target.dataset.kljuc;
    let kupljeno = ucitaj("kupljeno", []);
    kupljeno = e.target.checked ? [...kupljeno, kljuc] : kupljeno.filter((k) => k !== kljuc);
    spremi("kupljeno", kupljeno);
    e.target.closest("li").classList.toggle("kupljeno", e.target.checked);
    azurirajBrojacKupnje();
  });

  ocisti.addEventListener("click", () => {
    if (!confirm("Želiš li obrisati cijeli tjedni plan?")) return;
    spremi("planer", {});
    spremi("kupljeno", []);
    prikaziTjedan();
    obavijest("Planer je očišćen");
  });

  prikaziTjedan();
}

/* =========================================================
   KONTAKT – provjera obrasca i česta pitanja
   ========================================================= */
function inicijalizirajKontakt() {
  const forma = document.getElementById("kontakt-forma");
  const ime = document.getElementById("ime");
  const email = document.getElementById("email");
  const tema = document.getElementById("tema");
  const poljeRecept = document.getElementById("polje-recept");
  const nazivRecepta = document.getElementById("naziv-recepta");
  const poruka = document.getElementById("poruka");
  const brojZnakova = document.getElementById("broj-znakova");
  const privola = document.getElementById("privola");
  const uspjeh = document.getElementById("uspjeh");

  // dodatno polje prikazuje se samo kad korisnik šalje recept
  tema.addEventListener("change", () => {
    poljeRecept.hidden = tema.value !== "recept";
  });

  // brojač znakova poruke
  poruka.addEventListener("input", () => {
    const n = poruka.value.length;
    brojZnakova.textContent = `${n} / 500`;
    brojZnakova.classList.toggle("upozorenje", n > 450);
  });

  function postaviGresku(polje, tekst) {
    const greska = polje.closest(".polje").querySelector(".greska");
    greska.textContent = tekst;
    polje.classList.toggle("neispravno", Boolean(tekst));
    polje.setAttribute("aria-invalid", Boolean(tekst));
  }

  // greška nestaje čim korisnik ispravi polje
  forma.querySelectorAll("input, textarea, select").forEach((polje) => {
    polje.addEventListener("input", () => postaviGresku(polje, ""));
    polje.addEventListener("change", () => postaviGresku(polje, ""));
  });

  forma.addEventListener("submit", (e) => {
    e.preventDefault();
    let ispravno = true;
    const greska = (polje, tekst) => {
      postaviGresku(polje, tekst);
      ispravno = false;
    };

    if (ime.value.trim().length < 2) greska(ime, "Upiši ime (najmanje 2 znaka).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) greska(email, "Upiši ispravnu e-mail adresu.");
    if (!tema.value) greska(tema, "Odaberi temu poruke.");
    if (!poljeRecept.hidden && nazivRecepta.value.trim().length < 2) greska(nazivRecepta, "Upiši naziv recepta.");
    if (poruka.value.trim().length < 10) greska(poruka, "Poruka mora imati najmanje 10 znakova.");
    if (!privola.checked) greska(privola, "Potrebna je tvoja privola.");

    if (!ispravno) {
      forma.querySelector(".neispravno").focus();
      return;
    }

    document.getElementById("uspjeh-ime").textContent = ime.value.trim();
    forma.reset();
    poljeRecept.hidden = true;
    brojZnakova.textContent = "0 / 500";
    forma.hidden = true;
    uspjeh.hidden = false;
  });

  document.getElementById("nova-poruka").addEventListener("click", () => {
    uspjeh.hidden = true;
    forma.hidden = false;
    ime.focus();
  });

  // česta pitanja – harmonika
  document.querySelectorAll(".pitanje-gumb").forEach((gumb) => {
    gumb.addEventListener("click", () => {
      const odgovor = document.getElementById(gumb.getAttribute("aria-controls"));
      const otvoreno = gumb.getAttribute("aria-expanded") === "true";
      gumb.setAttribute("aria-expanded", !otvoreno);
      odgovor.hidden = otvoreno;
    });
  });
}

/* ---------- Pokretanje ---------- */
inicijalizirajTemu();
inicijalizirajNavigaciju();

const inicijalizacije = {
  pocetna: inicijalizirajPocetnu,
  recepti: inicijalizirajRecepte,
  recept: inicijalizirajRecept,
  planer: inicijalizirajPlaner,
  kontakt: inicijalizirajKontakt
};
const stranica = document.body.dataset.stranica;
if (inicijalizacije[stranica]) inicijalizacije[stranica]();
