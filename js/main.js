
   "use strict";

   /* ---------- Pomoćne funkcije ---------- */
   
   // mala slova i bez dijakritika ("Rižoto" -> "rizoto") radi lakše pretrage
   function normalize(text) {
     return String(text)
       .toLowerCase()
       .replace(/đ/g, "d")
       .normalize("NFD")
       .replace(/[̀-ͯ]/g, "");
   }
   
   // čitanje i spremanje u localStorage (u try/catch jer preglednik može blokirati pohranu)
   function load(key, fallback) {
     try {
       const value = localStorage.getItem(key);
       return value ? JSON.parse(value) : fallback;
     } catch (e) {
       return fallback;
     }
   }
   
   function save(key, value) {
     try {
       localStorage.setItem(key, JSON.stringify(value));
     } catch (e) {
       /* pohrana nije dostupna – stranica i dalje radi */
     }
   }
   
   function getParam(name) {
     return new URLSearchParams(window.location.search).get(name);
   }
   
   function findRecipe(id) {
     return RECIPES.find((r) => r.id === Number(id));
   }
   
   // 1,5 umjesto 1.5 i zaokruživanje na jednu decimalu
   function formatAmount(number) {
     return String(Math.round(number * 10) / 10).replace(".", ",");
   }
   
   // hrvatska množina: 1 recept, 2 recepta, 5 recepata
   function plural(n, one, few, many) {
     const lastDigit = n % 10;
     const lastTwo = n % 100;
     if (lastDigit === 1 && lastTwo !== 11) return one;
     if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
     return many;
   }
   
   // kratka poruka u kutu ekrana (dinamičko dodavanje i uklanjanje elementa)
   function showToast(html) {
     let container = document.querySelector(".toasts");
     if (!container) {
       container = document.createElement("div");
       container.className = "toasts";
       container.setAttribute("aria-live", "polite");
       document.body.appendChild(container);
     }
     const toast = document.createElement("div");
     toast.className = "toast";
     toast.innerHTML = html;
     container.appendChild(toast);
     setTimeout(() => {
       toast.classList.add("fade-out");
       setTimeout(() => toast.remove(), 400);
     }, 2500);
   }
   
   // 3D ikona iz kolekcije Thiings (thiings.co) umjesto emojija
   function icon(name, alt = "") {
     return `<img class="icon" src="images/icons/${name}.png" alt="${alt}">`;
   }
   
   /* ---------- Favoriti ---------- */
   
   function getFavorites() {
     return load("favorites", []);
   }
   
   function toggleFavorite(id) {
     let favorites = getFavorites();
     if (favorites.includes(id)) {
       favorites = favorites.filter((x) => x !== id);
       showToast("Uklonjeno iz favorita");
     } else {
       favorites.push(id);
       showToast(`Dodano u favorite ${icon("heart")}`);
     }
     save("favorites", favorites);
     return favorites.includes(id);
   }
   
   function updateHeart(button, isFavorite) {
     button.classList.toggle("active", isFavorite);
     button.setAttribute("aria-pressed", isFavorite);
     if (button.classList.contains("heart-large")) {
       button.textContent = isFavorite ? "♥ Spremljeno" : "♡ Spremi";
     } else {
       button.textContent = isFavorite ? "♥" : "♡";
     }
   }
   
   // jedan "click" slušač za sva srca na stranici (delegiranje događaja)
   document.addEventListener("click", (e) => {
     const heart = e.target.closest(".heart");
     if (!heart) return;
     e.preventDefault();
     const id = Number(heart.dataset.id);
     const isFavorite = toggleFavorite(id);
     document.querySelectorAll(`.heart[data-id="${id}"]`).forEach((b) => updateHeart(b, isFavorite));
     document.dispatchEvent(new CustomEvent("favorites-changed"));
   });
   
   /* ---------- Planer (spremljen u localStorage) ---------- */
   
   function getPlanner() {
     const planner = load("planner", {});
     DAYS.forEach((day) => {
       if (!Array.isArray(planner[day])) planner[day] = [];
     });
     return planner;
   }
   
   function addToPlanner(day, id) {
     const planner = getPlanner();
     planner[day].push(Number(id));
     save("planner", planner);
   }
   
   /* ---------- Slika recepta (fotografija ili emoji ako slike nema) ---------- */
   
   function recipeImage(r) {
     return r.image
       ? `<img src="${r.image}" alt="${r.name}" loading="lazy"${r.focus ? ` style="object-position:${r.focus}"` : ""}>`
       : `<span>${icon(r.icon)}</span>`;
   }
   
   /* ---------- Kartica recepta ---------- */
   
   function createCard(r) {
     const cat = CATEGORIES[r.category];
     const isFavorite = getFavorites().includes(r.id);
     const card = document.createElement("article");
     card.className = "card";
     card.innerHTML = `
       <a href="recipe.html?id=${r.id}" class="card-image" style="--color:${cat.color}" aria-hidden="true" tabindex="-1">
         ${recipeImage(r)}
       </a>
       <button class="heart ${isFavorite ? "active" : ""}" data-id="${r.id}" aria-pressed="${isFavorite}"
         aria-label="Spremi u favorite">${isFavorite ? "♥" : "♡"}</button>
       <div class="card-body">
         <span class="tag">${cat.singular}</span>
         <h3><a href="recipe.html?id=${r.id}">${r.name}</a></h3>
         <p>${r.description}</p>
         <div class="meta">
           <span>${icon("stopwatch")} ${r.time} min</span>
           <span>${icon("bar-chart")} ${r.difficulty}</span>
           ${r.vegetarian ? `<span>${icon("seedling", "Vegetarijansko")}</span>` : ""}
         </div>
       </div>
       <div class="card-nutrition">${icon("fire")} ${r.calories} kcal po porciji · ${r.ingredients.length} sastojaka</div>
     `;
     // mouseover: prikaz dodatnih informacija
     card.addEventListener("mouseover", () => card.classList.add("show-nutrition"));
     card.addEventListener("mouseleave", () => card.classList.remove("show-nutrition"));
     return card;
   }
   
   /* ---------- Tema (svijetla / tamna) ---------- */
   
   function setTheme(theme) {
     document.documentElement.dataset.theme = theme;
     const button = document.getElementById("theme-toggle");
     if (button) {
       button.innerHTML = icon(theme === "dark" ? "sun" : "moon");
       button.setAttribute("aria-label", theme === "dark" ? "Uključi svijetlu temu" : "Uključi tamnu temu");
     }
     save("theme", theme);
   }
   
   function initTheme() {
     const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
     setTheme(load("theme", systemDark ? "dark" : "light"));
     const button = document.getElementById("theme-toggle");
     if (button) {
       button.addEventListener("click", () => {
         const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
         setTheme(next);
       });
     }
   }
   
   /* ---------- Mobilni izbornik ---------- */
   
   function initNavigation() {
     const button = document.getElementById("menu-toggle");
     const nav = document.getElementById("navigation");
     if (!button || !nav) return;
     button.addEventListener("click", () => {
       const isOpen = nav.classList.toggle("open");
       button.setAttribute("aria-expanded", isOpen);
       button.textContent = isOpen ? "✕" : "☰";
     });
   }
   
   /* =========================================================
      POČETNA
      ========================================================= */
   function initHome() {
     // recept dana – nasumični odabir, gumb daje novi prijedlog
     const recipeOfTheDay = document.getElementById("recipe-of-the-day");
     const newSuggestionButton = document.getElementById("new-suggestion");
     let current = -1;
   
     function showRecipeOfTheDay() {
       let i;
       do {
         i = Math.floor(Math.random() * RECIPES.length);
       } while (i === current && RECIPES.length > 1);
       current = i;
       const r = RECIPES[i];
       const cat = CATEGORIES[r.category];
       recipeOfTheDay.innerHTML = `
         <div class="featured-image" style="--color:${cat.color}">${recipeImage(r)}</div>
         <div class="featured-text">
           <span class="tag">${cat.singular}</span>
           <h3>${r.name}</h3>
           <p>${r.description}</p>
           <div class="meta">
             <span>${icon("stopwatch")} ${r.time} min</span><span>${icon("bar-chart")} ${r.difficulty}</span><span>${icon("plate")} ${r.servings} ${plural(r.servings, "porcija", "porcije", "porcija")}</span>
           </div>
           <a href="recipe.html?id=${r.id}" class="btn btn-primary">Pogledaj recept →</a>
         </div>`;
       // ponovno pokretanje animacije
       recipeOfTheDay.classList.remove("animate");
       void recipeOfTheDay.offsetWidth;
       recipeOfTheDay.classList.add("animate");
     }
     newSuggestionButton.addEventListener("click", showRecipeOfTheDay);
     showRecipeOfTheDay();
   
     // kategorije
     const categories = document.getElementById("categories");
     Object.entries(CATEGORIES).forEach(([key, c]) => {
       const count = RECIPES.filter((r) => r.category === key).length;
       categories.insertAdjacentHTML(
         "beforeend",
         `<a class="category" href="recipes.html?category=${key}" style="--color:${c.color}">
            <span class="category-emoji">${icon(c.icon)}</span>
            <strong>${c.name}</strong>
            <small>${count} ${plural(count, "recept", "recepta", "recepata")}</small>
          </a>`
       );
     });
   
     // tri najbrža recepta
     const fastest = document.getElementById("fastest");
     [...RECIPES]
       .sort((a, b) => a.time - b.time)
       .slice(0, 3)
       .forEach((r) => fastest.appendChild(createCard(r)));
   
     // favoriti – sekcija se prikazuje samo ako ih ima
     const favoritesSection = document.getElementById("favorites-section");
     const favoritesGrid = document.getElementById("favorites-grid");
     function showFavorites() {
       const favorites = getFavorites().map(findRecipe).filter(Boolean);
       favoritesGrid.innerHTML = "";
       favorites.forEach((r) => favoritesGrid.appendChild(createCard(r)));
       favoritesSection.hidden = favorites.length === 0;
     }
     showFavorites();
     document.addEventListener("favorites-changed", showFavorites);
   }
   
   /* =========================================================
      RECEPTI – pretraga i filtriranje
      ========================================================= */
   // granica za tag "Do 400 kcal" (kcal po porciji)
   const LIGHT_CALORIES = 400;
   
   function initRecipes() {
     const search = document.getElementById("search");
     const category = document.getElementById("filter-category");
     const time = document.getElementById("filter-time");
     const difficulty = document.getElementById("filter-difficulty");
     const veg = document.getElementById("filter-veg");
     const meat = document.getElementById("filter-meat");
     const light = document.getElementById("filter-light");
     const sweet = document.getElementById("filter-sweet");
     const resetButton = document.getElementById("reset-filters");
     const grid = document.getElementById("recipe-grid");
     const resultsCount = document.getElementById("results-count");
     const noResults = document.getElementById("no-results");
   
     Object.entries(CATEGORIES).forEach(([key, c]) => category.add(new Option(c.name, key)));
   
     // početne vrijednosti iz URL-a (npr. recipes.html?category=dessert)
     const categoryFromUrl = getParam("category");
     if (categoryFromUrl && CATEGORIES[categoryFromUrl]) category.value = categoryFromUrl;
     const queryFromUrl = getParam("q");
     if (queryFromUrl) search.value = queryFromUrl;
   
     function applyFilters() {
       const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
       const results = RECIPES.filter((r) => {
         const text = normalize([r.name, r.description, ...r.ingredients.map((i) => i.name)].join(" "));
         if (!words.every((word) => text.includes(word))) return false;
         if (category.value && r.category !== category.value) return false;
         if (time.value && r.time > Number(time.value)) return false;
         if (difficulty.value && r.difficulty !== difficulty.value) return false;
         if (veg.checked && !r.vegetarian) return false;
         if (meat.checked && r.vegetarian) return false;
         if (light.checked && r.calories > LIGHT_CALORIES) return false;
         if (sweet.checked && r.category !== "dessert") return false;
         return true;
       });
   
       grid.innerHTML = "";
       results.forEach((r) => grid.appendChild(createCard(r)));
       resultsCount.textContent = `Pronađeno: ${results.length} ${plural(results.length, "recept", "recepta", "recepata")}`;
       noResults.hidden = results.length > 0;
     }
   
     search.addEventListener("input", applyFilters);
     [category, time, difficulty, veg, meat, light, sweet].forEach((el) => el.addEventListener("change", applyFilters));
   
     // "Vegetarijansko" i "S mesom" se isključuju – uključivanje jednog gasi drugi
     veg.addEventListener("change", () => {
       if (veg.checked && meat.checked) {
         meat.checked = false;
         applyFilters();
       }
     });
     meat.addEventListener("change", () => {
       if (meat.checked && veg.checked) {
         veg.checked = false;
         applyFilters();
       }
     });
     resetButton.addEventListener("click", () => {
       search.value = "";
       category.value = "";
       time.value = "";
       difficulty.value = "";
       [veg, meat, light, sweet].forEach((tag) => (tag.checked = false));
       history.replaceState(null, "", "recipes.html");
       applyFilters();
       search.focus();
     });
   
     applyFilters();
   }
   
   /* =========================================================
      POJEDINAČNI RECEPT
      ========================================================= */
   function initRecipe() {
     const content = document.getElementById("recipe-content");
     const r = findRecipe(getParam("id"));
   
     if (!r) {
       content.innerHTML = `
         <div class="empty">
           <p class="empty-emoji">${icon("plate")}</p>
           <h1>Recept nije pronađen</h1>
           <p>Možda je poveznica neispravna. Pogledaj sve recepte.</p>
           <a href="recipes.html" class="btn btn-primary">Svi recepti</a>
         </div>`;
       document.getElementById("similar-section").hidden = true;
       return;
     }
   
     const cat = CATEGORIES[r.category];
     const isFavorite = getFavorites().includes(r.id);
     document.title = `${r.name} | Kuharica`;
   
     content.innerHTML = `
       <nav class="breadcrumbs" aria-label="Putanja"><a href="recipes.html">Recepti</a> › <a href="recipes.html?category=${r.category}">${cat.name}</a> › <span>${r.name}</span></nav>
       <div class="recipe-header">
         <div class="recipe-emoji" style="--color:${cat.color}">${recipeImage(r)}</div>
         <div class="recipe-intro">
           <span class="tag">${cat.singular}</span>
           <h1>${r.name}</h1>
           <p class="recipe-description">${r.description}</p>
           <ul class="recipe-meta">
             <li>${icon("stopwatch")} <strong>${r.time} min</strong>${r.note ? ` <small>${r.note}</small>` : ""}</li>
             <li>${icon("bar-chart")} ${r.difficulty}</li>
             <li>${icon("fire")} ${r.calories} kcal / porcija</li>
             <li>${r.vegetarian ? `${icon("seedling")} Vegetarijansko` : `${icon("meat")} Sadrži meso`}</li>
           </ul>
           <div class="recipe-actions">
             <button class="btn heart heart-large ${isFavorite ? "active" : ""}" data-id="${r.id}" aria-pressed="${isFavorite}">${isFavorite ? "♥ Spremljeno" : "♡ Spremi"}</button>
             <div class="add-to-planner">
               <label for="planner-day" class="visually-hidden">Dan u tjednu</label>
               <select id="planner-day">${DAYS.map((d) => `<option>${d}</option>`).join("")}</select>
               <button class="btn btn-primary" id="add-to-planner">${icon("calendar")} Dodaj u planer</button>
             </div>
           </div>
         </div>
       </div>
   
       <div class="recipe-body">
         <section class="block">
           <h2>Sastojci</h2>
           <div class="servings">
             <span>Porcije:</span>
             <button class="btn-icon" id="fewer-servings" aria-label="Manje porcija">−</button>
             <input type="number" id="servings-input" min="1" max="50" value="${r.servings}" aria-label="Broj porcija">
             <button class="btn-icon" id="more-servings" aria-label="Više porcija">+</button>
           </div>
           <ul class="ingredients-list" id="ingredients-list"></ul>
           <p class="tip">${icon("light-bulb")} Klikni sastojak kad ga pripremiš.</p>
         </section>
   
         <section class="block">
           <h2>Postupak</h2>
           <ol class="steps" id="steps">
             ${r.steps.map((step) => `<li tabindex="0">${step}</li>`).join("")}
           </ol>
           <div class="progress" aria-hidden="true"><div class="progress-bar" id="progress-bar"></div></div>
           <p class="tip" id="progress-text">${icon("light-bulb")} Klikni korak kad ga završiš.</p>
         </section>
       </div>`;
   
     // --- preračun porcija ---
     const servingsInput = document.getElementById("servings-input");
     const list = document.getElementById("ingredients-list");
     const checkedItems = new Set();
   
     function renderIngredients() {
       let servings = parseInt(servingsInput.value, 10);
       if (isNaN(servings) || servings < 1) return;
       servings = Math.min(servings, 50);
       const factor = servings / r.servings;
       list.innerHTML = r.ingredients
         .map(
           (ing, i) => `<li data-i="${i}" class="${checkedItems.has(i) ? "checked" : ""}">
             <span class="quantity">${formatAmount(ing.amount * factor)} ${ing.unit}</span> ${ing.name}</li>`
         )
         .join("");
     }
   
     function changeServings(delta) {
       const next = Math.min(50, Math.max(1, (parseInt(servingsInput.value, 10) || r.servings) + delta));
       servingsInput.value = next;
       renderIngredients();
     }
   
     document.getElementById("fewer-servings").addEventListener("click", () => changeServings(-1));
     document.getElementById("more-servings").addEventListener("click", () => changeServings(1));
     servingsInput.addEventListener("input", renderIngredients);
     servingsInput.addEventListener("change", () => {
       if (!(parseInt(servingsInput.value, 10) >= 1)) servingsInput.value = r.servings;
       renderIngredients();
     });
   
     list.addEventListener("click", (e) => {
       const li = e.target.closest("li");
       if (!li) return;
       const i = Number(li.dataset.i);
       if (checkedItems.has(i)) checkedItems.delete(i);
       else checkedItems.add(i);
       li.classList.toggle("checked");
     });
   
     renderIngredients();
   
     // --- označavanje koraka i traka napretka ---
     const steps = document.getElementById("steps");
     const progressBar = document.getElementById("progress-bar");
     const progressText = document.getElementById("progress-text");
   
     function toggleStep(li) {
       li.classList.toggle("done");
       const total = r.steps.length;
       const done = steps.querySelectorAll(".done").length;
       progressBar.style.width = `${(done / total) * 100}%`;
       progressText.innerHTML = done === 0 ? `${icon("light-bulb")} Klikni korak kad ga završiš.` : `Završeno ${done} od ${total} koraka`;
       if (done === total) showToast(`Sve gotovo – dobar tek! ${icon("party")}`);
     }
     steps.addEventListener("click", (e) => {
       const li = e.target.closest("li");
       if (li) toggleStep(li);
     });
     steps.addEventListener("keydown", (e) => {
       if ((e.key === "Enter" || e.key === " ") && e.target.matches("li")) {
         e.preventDefault();
         toggleStep(e.target);
       }
     });
   
     // --- dodavanje u planer ---
     document.getElementById("add-to-planner").addEventListener("click", () => {
       const day = document.getElementById("planner-day").value;
       addToPlanner(day, r.id);
       showToast(`Dodano u planer: ${day} ${icon("calendar")}`);
     });
   
     // --- slični recepti ---
     const similar = RECIPES.filter((x) => x.category === r.category && x.id !== r.id).slice(0, 3);
     const similarGrid = document.getElementById("similar-grid");
     similar.forEach((x) => similarGrid.appendChild(createCard(x)));
     document.getElementById("similar-section").hidden = similar.length === 0;
   }
   
   /* =========================================================
      PLANER OBROKA I POPIS ZA KUPNJU
      ========================================================= */
   function initPlanner() {
     const form = document.getElementById("planner-form");
     const recipeSelect = document.getElementById("planner-recipe");
     const daySelect = document.getElementById("planner-day");
     const week = document.getElementById("week");
     const shoppingList = document.getElementById("shopping-list");
     const shoppingCount = document.getElementById("shopping-count");
     const clearButton = document.getElementById("clear-planner");
   
     RECIPES.forEach((r) => recipeSelect.add(new Option(`${r.emoji} ${r.name}`, r.id)));
     DAYS.forEach((d) => daySelect.add(new Option(d, d)));
   
     function renderWeek() {
       const planner = getPlanner();
       week.innerHTML = "";
       DAYS.forEach((day) => {
         const column = document.createElement("div");
         column.className = "day";
         const items = planner[day]
           .map((id, i) => {
             const r = findRecipe(id);
             if (!r) return "";
             return `<li><a href="recipe.html?id=${r.id}">${icon(r.icon)} ${r.name}</a>
                     <button class="remove" data-day="${day}" data-i="${i}" aria-label="Ukloni ${r.name}">✕</button></li>`;
           })
           .join("");
         column.innerHTML = `<h3>${day}</h3>${items ? `<ul>${items}</ul>` : '<p class="day-empty">Nema obroka</p>'}`;
         week.appendChild(column);
       });
       renderShoppingList(planner);
     }
   
     function renderShoppingList(planner) {
       // zbrajanje istih sastojaka iz svih planiranih recepata
       const totals = {};
       Object.values(planner)
         .flat()
         .forEach((id) => {
           const r = findRecipe(id);
           if (!r) return;
           r.ingredients.forEach((ing) => {
             const key = `${ing.name}|${ing.unit}`;
             totals[key] = (totals[key] || 0) + ing.amount;
           });
         });
   
       const items = Object.entries(totals).sort(([a], [b]) => a.localeCompare(b, "hr"));
       const purchased = load("purchased", []);
   
       if (items.length === 0) {
         shoppingList.innerHTML = '<li class="day-empty">Dodaj recepte u planer i popis će se složiti sam.</li>';
         shoppingCount.textContent = "";
         return;
       }
   
       shoppingList.innerHTML = items
         .map(([key, amount]) => {
           const [name, unit] = key.split("|");
           const isPurchased = purchased.includes(key);
           return `<li class="${isPurchased ? "purchased" : ""}">
             <label><input type="checkbox" data-key="${key}" ${isPurchased ? "checked" : ""}>
             <span><strong>${formatAmount(amount)} ${unit}</strong> ${name}</span></label></li>`;
         })
         .join("");
       updateShoppingCount();
     }
   
     function updateShoppingCount() {
       const total = shoppingList.querySelectorAll("input").length;
       const purchased = shoppingList.querySelectorAll("input:checked").length;
       shoppingCount.textContent = `Kupljeno ${purchased} od ${total}`;
     }
   
     form.addEventListener("submit", (e) => {
       e.preventDefault();
       addToPlanner(daySelect.value, recipeSelect.value);
       const r = findRecipe(recipeSelect.value);
       showToast(`${r.name} → ${daySelect.value}`);
       renderWeek();
     });
   
     week.addEventListener("click", (e) => {
       const button = e.target.closest(".remove");
       if (!button) return;
       const planner = getPlanner();
       planner[button.dataset.day].splice(Number(button.dataset.i), 1);
       save("planner", planner);
       renderWeek();
     });
   
     shoppingList.addEventListener("change", (e) => {
       if (e.target.type !== "checkbox") return;
       const key = e.target.dataset.key;
       let purchased = load("purchased", []);
       purchased = e.target.checked ? [...purchased, key] : purchased.filter((k) => k !== key);
       save("purchased", purchased);
       e.target.closest("li").classList.toggle("purchased", e.target.checked);
       updateShoppingCount();
     });
   
     clearButton.addEventListener("click", () => {
       if (!confirm("Želiš li obrisati cijeli tjedni plan?")) return;
       save("planner", {});
       save("purchased", []);
       renderWeek();
       showToast("Planer je očišćen");
     });
   
     renderWeek();
   }
   
   /* =========================================================
      KONTAKT – provjera obrasca i česta pitanja
      ========================================================= */
   function initContact() {
     const form = document.getElementById("contact-form");
     const name = document.getElementById("name");
     const email = document.getElementById("email");
     const topic = document.getElementById("topic");
     const recipeField = document.getElementById("recipe-field");
     const recipeName = document.getElementById("recipe-name");
     const message = document.getElementById("message");
     const charCount = document.getElementById("char-count");
     const consent = document.getElementById("consent");
     const success = document.getElementById("success");
   
     // dodatno polje prikazuje se samo kad korisnik šalje recept
     topic.addEventListener("change", () => {
       recipeField.hidden = topic.value !== "recipe";
     });
   
     // brojač znakova poruke
     message.addEventListener("input", () => {
       const n = message.value.length;
       charCount.textContent = `${n} / 500`;
       charCount.classList.toggle("warning", n > 450);
     });
   
     function setError(field, text) {
       const error = field.closest(".field").querySelector(".error");
       error.textContent = text;
       field.classList.toggle("invalid", Boolean(text));
       field.setAttribute("aria-invalid", Boolean(text));
     }
   
     // greška nestaje čim korisnik ispravi polje
     form.querySelectorAll("input, textarea, select").forEach((field) => {
       field.addEventListener("input", () => setError(field, ""));
       field.addEventListener("change", () => setError(field, ""));
     });
   
     form.addEventListener("submit", (e) => {
       e.preventDefault();
       let isValid = true;
       const fail = (field, text) => {
         setError(field, text);
         isValid = false;
       };
   
       if (name.value.trim().length < 2) fail(name, "Upiši ime (najmanje 2 znaka).");
       if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) fail(email, "Upiši ispravnu e-mail adresu.");
       if (!topic.value) fail(topic, "Odaberi temu poruke.");
       if (!recipeField.hidden && recipeName.value.trim().length < 2) fail(recipeName, "Upiši naziv recepta.");
       if (message.value.trim().length < 10) fail(message, "Poruka mora imati najmanje 10 znakova.");
       if (!consent.checked) fail(consent, "Potrebna je tvoja privola.");
   
       if (!isValid) {
         form.querySelector(".invalid").focus();
         return;
       }
   
       document.getElementById("success-name").textContent = name.value.trim();
       form.reset();
       recipeField.hidden = true;
       charCount.textContent = "0 / 500";
       form.hidden = true;
       success.hidden = false;
     });
   
     document.getElementById("new-message").addEventListener("click", () => {
       success.hidden = true;
       form.hidden = false;
       name.focus();
     });
   
     // česta pitanja – harmonika
     document.querySelectorAll(".question-btn").forEach((button) => {
       button.addEventListener("click", () => {
         const answer = document.getElementById(button.getAttribute("aria-controls"));
         const isOpen = button.getAttribute("aria-expanded") === "true";
         button.setAttribute("aria-expanded", !isOpen);
         answer.hidden = isOpen;
       });
     });
   }
   
   /* =========================================================
      MOJI FAVORITI
      ========================================================= */
   function initFavorites() {
     const list = document.getElementById("favorites-list");
     const empty = document.getElementById("favorites-empty");
     const count = document.getElementById("favorites-count");
   
     function renderFavorites() {
       // ID-jevi iz localStorage pretvaraju se u recepte (filter uklanja nepostojeće)
       const favorites = getFavorites().map(findRecipe).filter(Boolean);
   
       list.innerHTML = "";
       favorites.forEach((r) => list.appendChild(createCard(r)));
   
       // ako nema favorita, prikazuje se poruka umjesto prazne mreže
       empty.hidden = favorites.length > 0;
       count.textContent = favorites.length
         ? `Spremljeno: ${favorites.length} ${plural(favorites.length, "recept", "recepta", "recepata")}`
         : "";
     }
   
     renderFavorites();
     // kad korisnik klikne srce (ili ga chatbot spremi), popis se odmah osvježi
     document.addEventListener("favorites-changed", renderFavorites);
   }
   
   /* ---------- Pokretanje ---------- */
   initTheme();
   initNavigation();
   
   const pageInits = {
     home: initHome,
     recipes: initRecipes,
     recipe: initRecipe,
     planner: initPlanner,
     favorites: initFavorites,
     contact: initContact
   };
   const page = document.body.dataset.page;
   if (pageInits[page]) pageInits[page]();