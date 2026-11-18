/* =========================================================
   CHATBOT "KUHAR BOT"
   Vrsta: chatbot temeljen na pravilima i prepoznavanju namjera.
   Dodatne funkcionalnosti:
   1) odgovore oblikuje iz podataka web sjedišta (data.js)
   2) pamti kontekst razgovora (zadnji recept, zadnji filteri)
      i čuva razgovor u localStorage
   Koristi funkcije iz main.js (normalize, findRecipe, ...).
   ========================================================= */
"use strict";

(function () {
  const BOT_NAME = "Kuhar Bot";
  const HISTORY_KEY = "chat-history";
  const CONTEXT_KEY = "chat-context";
  const PAGE_SIZE = 3; // koliko recepata bot predlaže odjednom

  /* ---------- Rječnici za prepoznavanje ---------- */

  // riječi koje nisu sastojci (da "kako" ne bi bilo "kakao" i sl.)
  const STOP_WORDS = new Set(
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
  const INGREDIENT_STOP_WORDS = new Set(
    "za ili kuhani kuhanje ribani mljeveno konzerva file namaz bijelo crno crveni zelena tamna suhe povrtni vinski mineralna".split(" ")
  );

  const CATEGORY_ROOTS = {
    dessert: ["desert", "slatk", "kolac", "poslastic"],
    soup: ["juh"],
    salad: ["salat"],
    starter: ["predjel", "grickalic", "namaz"],
    main: ["glavn", "rucak", "rucku", "vecer"]
  };

  const NUMBER_WORDS = {
    jedan: 1, jednu: 1, jednog: 1, dva: 2, dvije: 2, dvoje: 2, tri: 3, troje: 3, cetiri: 4, cetvero: 4,
    pet: 5, petero: 5, sest: 6, sestero: 6, sedam: 7, osam: 8, devet: 9, deset: 10, dvanaest: 12
  };

  // za svaki recept skup "ključnih riječi" sastojaka, npr. "feta sir" -> feta, sir
  const RECIPE_INGREDIENTS = new Map();
  const ALL_INGREDIENTS = new Set();
  RECIPES.forEach((r) => {
    const set = new Set();
    r.ingredients.forEach((ing) => {
      normalize(ing.name)
        .split(/[^a-z]+/)
        .filter((w) => w.length >= 3 && !INGREDIENT_STOP_WORDS.has(w))
        .forEach((w) => {
          set.add(w);
          ALL_INGREDIENTS.add(w);
        });
    });
    RECIPE_INGREDIENTS.set(r.id, [...set]);
  });

  /* ---------- Stanje ---------- */

  const INITIAL_CONTEXT = { lastRecipe: null, offered: [], results: [], shown: 0, filters: null, awaitingDay: null };
  let context = Object.assign({}, INITIAL_CONTEXT, load(CONTEXT_KEY, {}));
  let history = load(HISTORY_KEY, []);

  // ako je korisnik na stranici recepta, bot zna o kojem je receptu riječ
  if (document.body.dataset.page === "recipe" && findRecipe(getParam("id"))) {
    context.lastRecipe = Number(getParam("id"));
  }

  // "za ponedjeljak", "za srijedu", "za nedjelju"
  const DAYS_ACCUSATIVE = ["ponedjeljak", "utorak", "srijedu", "četvrtak", "petak", "subotu", "nedjelju"];
  const forDay = (day) => DAYS_ACCUSATIVE[DAYS.indexOf(day)];

  /* ---------- Pomoćne funkcije ---------- */

  // dvije riječi se "podudaraju" ako dijele dovoljno dug početak (jaja/jaje, sir/sira, tuna/tunu)
  function wordsMatch(a, b) {
    const n = Math.min(a.length, b.length);
    let i = 0;
    while (i < n && a[i] === b[i]) i++;
    return i >= Math.max(3, n - 1);
  }

  function recipeHasIngredient(r, word) {
    return RECIPE_INGREDIENTS.get(r.id).some((k) => wordsMatch(word, k));
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function recipeLink(r) {
    return `<a href="recipe.html?id=${r.id}">${icon(r.icon)} ${r.name}</a>`;
  }

  function findMentionedRecipe(n) {
    return RECIPES.find((r) => r.keywords.some((k) => k.split("+").every((part) => n.includes(part))));
  }

  function findDay(n) {
    if (/\bdanas\b/.test(n)) return DAYS[(new Date().getDay() + 6) % 7];
    if (/\bsutra\b/.test(n)) return DAYS[(new Date().getDay() + 7) % 7];
    const patterns = [/\bponedjelj/, /\butor/, /\bsrijed/, /\bcetvrt/, /\bpet(ak|ka|ku)\b/, /\bsubot/, /\bnedjelj/];
    const i = patterns.findIndex((p) => p.test(n));
    return i >= 0 ? DAYS[i] : null;
  }

  /* ---------- Gradnja odgovora iz podataka ---------- */

  function recipeSummary(r) {
    return {
      html: `<strong>${recipeLink(r)}</strong><br>${r.description}<br>
             <small>${icon("stopwatch")} ${r.time} min${r.note ? " " + r.note : ""} · ${r.difficulty} · ${r.servings} ${plural(r.servings, "porcija", "porcije", "porcija")} · ${r.calories} kcal</small>`,
      chips: ["Kako se radi?", "Koji su sastojci?", "Dodaj u planer"]
    };
  }

  function recipeIngredients(r, servings) {
    const factor = servings / r.servings;
    const list = r.ingredients
      .map((ing) => `<li>${formatAmount(ing.amount * factor)} ${ing.unit} ${ing.name}</li>`)
      .join("");
    return {
      html: `Za recept <strong>${r.name}</strong> (${servings} ${plural(servings, "porcija", "porcije", "porcija")}) trebaš:<ul>${list}</ul>`,
      chips: ["Kako se radi?", "Za 2 osobe", "Dodaj u planer"]
    };
  }

  function recipeSteps(r) {
    return {
      html: `Evo postupka za recept <strong>${r.name}</strong>:<ol>${r.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
             Cijeli recept s brojačem porcija: ${recipeLink(r)}`,
      chips: ["Koji su sastojci?", "Dodaj u planer", "Nešto drugo"]
    };
  }

  function describeFilters(f) {
    const parts = [];
    if (f.category) parts.push(CATEGORIES[f.category].name.toLowerCase());
    if (f.veg) parts.push("vegetarijansko");
    if (f.maxTime) parts.push(`do ${f.maxTime} min`);
    if (f.difficulty) parts.push("jednostavno");
    if (f.ingredients.length) parts.push("s: " + f.ingredients.map((i) => i.display).join(", "));
    if (f.excluded.length) parts.push("bez: " + f.excluded.map((i) => i.display).join(", "));
    return parts.join(" · ");
  }

  function hasFilters(f) {
    return f.ingredients.length || f.excluded.length || f.category || f.veg || f.maxTime || f.difficulty;
  }

  // iz poruke izvlači sastojke, kategoriju, vrijeme, težinu i vegetarijansko
  function extractFilters(n, original) {
    const words = n.split(/[^a-z0-9]+/).filter(Boolean);
    const originalWords = original.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const f = { ingredients: [], excluded: [], category: null, veg: false, maxTime: null, difficulty: null };
    const used = new Set();

    Object.entries(CATEGORY_ROOTS).forEach(([cat, roots]) => {
      words.forEach((w) => {
        if (roots.some((root) => w.startsWith(root))) {
          f.category = cat;
          used.add(w);
        }
      });
    });

    if (/vegetarij|bez mes|posn|vegan|\bvege\b/.test(n)) f.veg = true;

    const minutes = n.match(/(?:do|ispod|manje od|najvise)\s*(\d+)\s*min/);
    const hours = n.match(/(?:do|ispod|manje od|najvise)\s*(\d+)\s*sat/);
    if (minutes) f.maxTime = Number(minutes[1]);
    else if (hours) f.maxTime = Number(hours[1]) * 60;
    else if (/\bbrz|na brzinu|malo vremena|nemam (puno )?vremena|zurim/.test(n)) f.maxTime = 20;

    if (/\b(lak|jednostav|pocetni)/.test(n)) f.difficulty = "Lako";

    words.forEach((w, i) => {
      if (w.length < 3 || STOP_WORDS.has(w) || used.has(w)) return;
      if (![...ALL_INGREDIENTS].some((k) => wordsMatch(w, k))) return;
      const ingredient = { key: w, display: originalWords[i] || w };
      const afterWithout = words[i - 1] === "bez" || (words[i - 1] === "i" && words[i - 2] === "bez");
      if (afterWithout) {
        if (!/^mes/.test(w)) f.excluded.push(ingredient);
      } else {
        f.ingredients.push(ingredient);
      }
    });
    return f;
  }

  function search(f) {
    return RECIPES.map((r) => ({
      id: r.id,
      hits: f.ingredients.filter((i) => recipeHasIngredient(r, i.key)).length
    }))
      .filter(({ id, hits }) => {
        const r = findRecipe(id);
        if (f.ingredients.length && hits === 0) return false;
        if (f.category && r.category !== f.category) return false;
        if (f.veg && !r.vegetarian) return false;
        if (f.maxTime && r.time > f.maxTime) return false;
        if (f.difficulty && r.difficulty !== f.difficulty) return false;
        if (f.excluded.some((i) => recipeHasIngredient(r, i.key))) return false;
        return true;
      })
      .sort((a, b) => b.hits - a.hits || findRecipe(a.id).time - findRecipe(b.id).time);
  }

  function showResults(intro) {
    const page = context.results.slice(context.shown, context.shown + PAGE_SIZE);
    context.shown += page.length;
    const ingredientCount = context.filters ? context.filters.ingredients.length : 0;

    const items = page
      .map(({ id, hits }) => {
        const r = findRecipe(id);
        const ingredientInfo = ingredientCount ? ` · tvojih sastojaka: ${hits}/${ingredientCount}` : "";
        const thumb = r.image ? `<img src="${r.image}" alt="" class="chat-mini">` : `<span class="chat-mini">${icon(r.icon)}</span>`;
        return `<li>${thumb}<div>${recipeLink(r)}<br><small>${icon("stopwatch")} ${r.time} min · ${r.difficulty}${ingredientInfo}</small></div></li>`;
      })
      .join("");

    // ako je ponuđen samo jedan recept, on postaje "trenutni"; inače bot pita na koji se misli
    context.lastRecipe = context.results.length === 1 ? page[0].id : null;
    context.offered = page.map((x) => x.id);

    const hasMore = context.shown < context.results.length;
    const chips = page.map(({ id }) => findRecipe(id).name);
    if (hasMore) chips.push("Još prijedloga");

    return {
      html: `${intro}<ul class="chat-recipes">${items}</ul>${
        hasMore ? "Imam još prijedloga ako želiš." : "Klikni naziv recepta za više detalja."
      }`,
      chips
    };
  }

  function showPlanner() {
    const planner = getPlanner();
    const days = DAYS.filter((d) => planner[d].length);
    if (!days.length) {
      return {
        html: 'Planer je još prazan. Reci mi npr. <em>„dodaj rižoto u planer za petak“</em> ili otvori <a href="planner.html">planer obroka</a>.',
        chips: ["Iznenadi me", "Brzi ručak"]
      };
    }
    const list = days
      .map((d) => `<li><strong>${d}:</strong> ${planner[d].map((id) => recipeLink(findRecipe(id))).join(", ")}</li>`)
      .join("");
    return {
      html: `Ovo je tvoj plan za tjedan:<ul>${list}</ul>Popis za kupnju složen je na stranici <a href="planner.html">Planer obroka</a>.`
    };
  }

  /* ---------- Glavna logika: prepoznavanje namjere ---------- */

  function respond(message) {
    const n = normalize(message).trim();
    const wordCount = n.split(/\s+/).filter(Boolean).length;
    const mentioned = findMentionedRecipe(n);
    const day = findDay(n);

    // 1. bot je pitao za koji dan – korisnik odgovara danom
    if (context.awaitingDay) {
      const r = findRecipe(context.awaitingDay);
      context.awaitingDay = null;
      if (day && r) {
        addToPlanner(day, r.id);
        return {
          html: `Gotovo! ${icon("check")} Recept <strong>${r.name}</strong> je u planeru za <strong>${forDay(day)}</strong>.`,
          chips: ["Što imam u planeru?", "Nešto drugo"]
        };
      }
      if (/^(ne|nema|odustani|nista|ipak ne)\b/.test(n)) return { html: `U redu, ništa nisam dodao. ${icon("smile")}` };
    }

    // 2. pozdrav, zahvala, pomoć
    if (/^(bok|hej|hey|pozdrav|zdravo|cao|hello|hi|dobar (dan|jutro|vecer)|dobro jutro)\b/.test(n) && wordCount <= 4) {
      return {
        html: `Bok! ${icon("wave")} Reci mi koje sastojke imaš ili kakvo jelo želiš, a ja ću pronaći recept.`,
        chips: ["Što mogu od jaja?", "Brzi vegetarijanski ručak", "Neki desert"]
      };
    }
    if (/\b(hvala|fala|zahvaljujem|super|odlicno)\b/.test(n) && wordCount <= 5) {
      return { html: `Nema na čemu! Dobar tek! ${icon("happy")}`, chips: ["Iznenadi me", "Neki desert"] };
    }
    if (/(sto (sve )?znas|sto mozes|pomoc|pomozi|kako radis|upute)/.test(n)) {
      return {
        html: `Mogu ti pomoći s ovim:
          <ul>
            <li>${icon("carrot")} pronaći recept prema sastojcima koje imaš (<em>„imam jaja i sir“</em>)</li>
            <li>${icon("seedling")} filtrirati po vrsti jela, vremenu i težini (<em>„brzi vegetarijanski ručak“</em>)</li>
            <li>${icon("book")} objasniti postupak i sastojke (<em>„kako se radi tiramisu?“</em>)</li>
            <li>${icon("scale")} preračunati sastojke (<em>„za 6 osoba“</em>)</li>
            <li>${icon("calendar")} dodati recept u planer (<em>„dodaj u planer za petak“</em>)</li>
          </ul>
          Pamtim o čemu pričamo, pa možeš pitati i <em>„a nešto bez mesa?“</em>`,
        chips: ["Što mogu od jaja?", "Iznenadi me"]
      };
    }

    // 3. favoriti i planer
    if (/(favorit|spremi recept|spremi ga|spremi to)/.test(n)) {
      const r = mentioned || findRecipe(context.lastRecipe);
      if (!r) return { html: "Koji recept da spremim u favorite? Napiši mi njegov naziv." };
      context.lastRecipe = r.id;
      if (!getFavorites().includes(r.id)) toggleFavorite(r.id);
      document.querySelectorAll(`.heart[data-id="${r.id}"]`).forEach((b) => updateHeart(b, true));
      document.dispatchEvent(new CustomEvent("favorites-changed"));
      return { html: `${icon("heart")} Recept <strong>${r.name}</strong> je u tvojim favoritima.` };
    }

    if (/(dodaj|stavi|ubaci)/.test(n) && /(planer|plan|dan|ponedjelj|utor|srijed|cetvrt|petak|subot|nedjelj|danas|sutra)/.test(n)) {
      const r = mentioned || findRecipe(context.lastRecipe);
      if (!r) return { html: `Koji recept da dodam u planer? Prvo mi reci što te zanima. ${icon("smile")}`, chips: ["Iznenadi me"] };
      context.lastRecipe = r.id;
      if (day) {
        addToPlanner(day, r.id);
        return {
          html: `Gotovo! ${icon("check")} Recept <strong>${r.name}</strong> je u planeru za <strong>${forDay(day)}</strong>.`,
          chips: ["Što imam u planeru?"]
        };
      }
      context.awaitingDay = r.id;
      return { html: `Za koji dan da dodam <strong>${r.name}</strong>?`, chips: [...DAYS] };
    }

    if (/(planer|popis za kupnju|kupnj|sto imam u planu|moj plan)/.test(n)) return showPlanner();

    // 4. preračun porcija ("za 6 osoba", "za dvoje")
    const servingsMatch = n.match(/(\d+|[a-z]+)\s*(osob|porcij|ljud|gost)/) || n.match(/\bza (dvoje|troje|cetvero|petero|sestero)\b/);
    if (servingsMatch) {
      const count = Number(servingsMatch[1]) || NUMBER_WORDS[servingsMatch[1]];
      const fs = extractFilters(n, message);
      const isSearch = !mentioned && (fs.ingredients.length || fs.category);
      const r = isSearch ? null : mentioned || findRecipe(context.lastRecipe);
      if (count && r) {
        context.lastRecipe = r.id;
        return recipeIngredients(r, Math.min(count, 50));
      }
      if (count && !r && !isSearch) return { html: "Za koji recept da preračunam sastojke?", chips: ["Iznenadi me"] };
    }

    // 5. pitanje o točno određenom receptu
    if (mentioned) {
      context.lastRecipe = mentioned.id;
      if (/(kako|postupak|priprem|radi se|koraci)/.test(n)) return recipeSteps(mentioned);
      if (/(sastoj|sto treba|treba mi|potrebno)/.test(n)) return recipeIngredients(mentioned, mentioned.servings);
      if (/(kalorij|kcal)/.test(n)) return { html: `Jedna porcija (${recipeLink(mentioned)}) ima oko <strong>${mentioned.calories} kcal</strong>.` };
      if (/(traje|dugo|koliko vremena)/.test(n)) {
        return { html: `Priprema recepta ${recipeLink(mentioned)} traje oko <strong>${mentioned.time} min</strong>${mentioned.note ? " " + mentioned.note : ""}.` };
      }
      return recipeSummary(mentioned);
    }

    // 6. dodatno pitanje o receptu iz konteksta ("koliko to traje?")
    const last = findRecipe(context.lastRecipe);
    if (last) {
      if (/(postupak|kako se (radi|priprema|pravi)|koraci|kako ga|kako ju|kako to)/.test(n)) return recipeSteps(last);
      if (/(sastojc|sastojak|sto (mi )?treba)/.test(n)) return recipeIngredients(last, last.servings);
      if (/(kalorij|kcal)/.test(n)) return { html: `Jedna porcija (${recipeLink(last)}) ima oko <strong>${last.calories} kcal</strong>.` };
      if (/(koliko (to |ovo )?traje|koliko dugo|koliko vremena)/.test(n)) {
        return { html: `Priprema recepta ${recipeLink(last)} traje oko <strong>${last.time} min</strong>${last.note ? " " + last.note : ""}.` };
      }
    }

    if (!last && context.offered && context.offered.length > 1 &&
        /(postupak|kako se (radi|priprema|pravi)|koraci|sastojc|kalorij|koliko (to )?traje|koliko dugo)/.test(n)) {
      return {
        html: "Ponudio sam ti nekoliko recepata. Na koji od njih misliš?",
        chips: context.offered.map((id) => findRecipe(id).name)
      };
    }

    // 7. nasumični prijedlog
    if (/(iznenadi|nasumic|bilo sto|svejedno|ne znam sto)/.test(n)) {
      const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
      context.lastRecipe = r.id;
      const reply = recipeSummary(r);
      reply.html = `Što kažeš na ovo? ${icon("dice")}<br>` + reply.html;
      reply.chips = ["Kako se radi?", "Iznenadi me opet", "Dodaj u planer"];
      return reply;
    }

    // 8. još prijedloga iz prethodne pretrage
    if (/^(jos|daj jos|jos nesto|nesto drugo|drugo|drugi|vise|ima li jos)\b/.test(n) && !hasFilters(extractFilters(n, message))) {
      if (context.shown < context.results.length) return showResults("Evo još prijedloga:");
      return { html: "To su svi recepti koji odgovaraju. Probaj s drugim sastojcima ili vrstom jela.", chips: ["Neki desert", "Iznenadi me"] };
    }

    // 9. pretraga po sastojcima i filterima
    let f = extractFilters(n, message);
    if (hasFilters(f)) {
      // nastavak prethodnog upita: "a nešto bez mesa?", "i da je brzo"
      const isFollowUp = context.filters && /^(a|i|ali|moze|a moze|sto je s)\b/.test(n);
      if (isFollowUp) {
        const prev = context.filters;
        f = {
          ingredients: f.ingredients.length ? f.ingredients : prev.ingredients,
          excluded: [...prev.excluded, ...f.excluded],
          category: f.category || prev.category,
          veg: f.veg || prev.veg,
          maxTime: f.maxTime || prev.maxTime,
          difficulty: f.difficulty || prev.difficulty
        };
      }
      context.filters = f;
      context.results = search(f);
      context.shown = 0;

      if (!context.results.length) {
        // pokušaj samo sa sastojcima, bez ostalih uvjeta
        if (f.ingredients.length && (f.category || f.veg || f.maxTime || f.difficulty || f.excluded.length)) {
          const relaxed = { ...f, category: null, veg: false, maxTime: null, difficulty: null, excluded: [] };
          const relaxedResults = search(relaxed);
          if (relaxedResults.length) {
            context.filters = relaxed;
            context.results = relaxedResults;
            return showResults(`Nemam recept koji odgovara svemu (${describeFilters(f)}) ${icon("confused")}<br>Ali s tim sastojcima imam:`);
          }
        }
        return {
          html: `Nažalost, nemam recept za to (${describeFilters(f)}). ${icon("confused")} Probaj s drugim sastojcima.`,
          chips: ["Iznenadi me", "Što sve znaš?"]
        };
      }
      return showResults(`Evo što predlažem (${describeFilters(f)}):`);
    }

    // 10. nije prepoznato
    return {
      html: `Hmm, nisam siguran što misliš. ${icon("thinking")} Probaj npr. <em>„što mogu od piletine?“</em>, <em>„neka juha“</em> ili <em>„kako se radi rižoto?“</em>`,
      chips: ["Što sve znaš?", "Iznenadi me"]
    };
  }

  /* ---------- Sučelje ---------- */

  document.body.insertAdjacentHTML(
    "beforeend",
    `<button class="chat-btn" id="chat-toggle" aria-label="Otvori chat s Kuhar Botom" aria-expanded="false">
       <span class="chat-btn-icon">${icon("speech-bubble")}</span>
     </button>
     <section class="chat-window" id="chat-window" hidden aria-label="Chat s Kuhar Botom">
       <header class="chat-header">
         <div class="chat-avatar">${icon("chef")}</div>
         <div class="chat-title"><strong>${BOT_NAME}</strong><small>Pomoćnik za recepte</small></div>
         <button class="chat-action" id="chat-clear" title="Novi razgovor" aria-label="Započni novi razgovor">↺</button>
         <button class="chat-action" id="chat-close" aria-label="Zatvori chat">✕</button>
       </header>
       <div class="chat-messages" id="chat-messages" aria-live="polite"></div>
       <div class="chat-chips" id="chat-chips"></div>
       <form class="chat-form" id="chat-form" autocomplete="off">
         <label for="chat-input" class="visually-hidden">Tvoja poruka</label>
         <input id="chat-input" type="text" placeholder="Npr. imam jaja i sir…" maxlength="200">
         <button type="submit" aria-label="Pošalji">➤</button>
       </form>
     </section>`
  );

  const toggleButton = document.getElementById("chat-toggle");
  const chatWindow = document.getElementById("chat-window");
  const messages = document.getElementById("chat-messages");
  const chipsContainer = document.getElementById("chat-chips");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");

  function saveState() {
    save(HISTORY_KEY, history.slice(-40));
    save(CONTEXT_KEY, context);
  }

  function renderMessage(m) {
    const el = document.createElement("div");
    el.className = `chat-message ${m.role}`;
    el.innerHTML = m.html;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function showChips(list) {
    chipsContainer.innerHTML = "";
    (list || []).forEach((text) => {
      const c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.textContent = text;
      chipsContainer.appendChild(c);
    });
  }

  function addMessage(role, html, chips) {
    const m = { role, html };
    if (chips) m.chips = chips;
    history.push(m);
    renderMessage(m);
    saveState();
  }

  function greet() {
    let text = `Bok! ${icon("wave")} Ja sam ${BOT_NAME}. Reci mi koje sastojke imaš ili kakvo jelo želiš, a ja ću predložiti recept.`;
    const r = findRecipe(context.lastRecipe);
    if (document.body.dataset.page === "recipe" && r) {
      text += `<br>Vidim da gledaš <strong>${r.name}</strong>, pa me slobodno pitaj nešto o tom receptu.`;
    }
    addMessage("bot", text, ["Što mogu od jaja?", "Brzi vegetarijanski ručak", "Neki desert", "Što sve znaš?"]);
    showChips(history[history.length - 1].chips);
  }

  function send(text) {
    text = text.trim();
    if (!text) return;
    addMessage("user", escapeHtml(text));
    showChips([]);
    input.value = "";

    // indikator "bot piše..."
    const typing = document.createElement("div");
    typing.className = "chat-message bot typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      typing.remove();
      let reply;
      try {
        reply = respond(text);
      } catch (e) {
        console.error(e);
        reply = { html: `Ups, nešto je pošlo krivo. Pokušaj ponovno. ${icon("monkey")}` };
      }
      addMessage("bot", reply.html, reply.chips);
      showChips(reply.chips);
    }, 450 + Math.random() * 400);
  }

  function open() {
    chatWindow.hidden = false;
    toggleButton.setAttribute("aria-expanded", "true");
    toggleButton.classList.add("open");
    if (!messages.children.length) {
      history.forEach(renderMessage);
      if (!history.length) greet();
      else showChips(history[history.length - 1].chips);
    }
    messages.scrollTop = messages.scrollHeight;
    input.focus();
  }

  function close() {
    chatWindow.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.classList.remove("open");
    toggleButton.focus();
  }

  toggleButton.addEventListener("click", () => (chatWindow.hidden ? open() : close()));
  document.getElementById("chat-close").addEventListener("click", close);
  document.getElementById("chat-clear").addEventListener("click", () => {
    history = [];
    const recipeOnPage = document.body.dataset.page === "recipe" ? context.lastRecipe : null;
    context = Object.assign({}, INITIAL_CONTEXT, { lastRecipe: recipeOnPage });
    messages.innerHTML = "";
    greet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !chatWindow.hidden) close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    send(input.value);
  });
  chipsContainer.addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (c) send(c.textContent);
  });

  // gumbi na stranici koji otvaraju chat (npr. na početnoj)
  document.querySelectorAll(".open-chat").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    })
  );

  // za testiranje u konzoli preglednika: kuharBot("imam jaja")
  window.kuharBot = (text) => respond(text);
})();
