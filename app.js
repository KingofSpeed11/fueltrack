// ---------- Cloud sync (Supabase) ----------
// Personal single-user app - profile/goals/logs sync to a real database so
// they're not stuck in one phone's browser storage. Photos stay local only
// (too large to be worth syncing for a hobby project).
const SUPABASE_URL = "https://ghnmmykkbrccrlflwlqi.supabase.co";
const SUPABASE_KEY = "sb_publishable_9UK_NvTBb-KgP352aP5U8Q_NmiwvGh4";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function pullFromCloud() {
  try {
    const { data: profileRow } = await sb.from("profile").select("*").eq("id", "youssef").maybeSingle();
    if (profileRow) {
      profile = {
        name: profileRow.name,
        age: profileRow.age,
        sex: profileRow.sex,
        heightCm: profileRow.height_cm,
        weightKg: profileRow.weight_kg,
        activity: profileRow.activity,
        goal: profileRow.goal,
        manualGoals: profileRow.manual_goals || undefined,
      };
      saveProfileLocal(profile);
    }
    const { data: logRows } = await sb.from("logs").select("*").order("time", { ascending: true });
    if (logRows) {
      const localById = {};
      loadLogsLocal().forEach((l) => (localById[l.id] = l));
      logs = logRows.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        foodId: r.food_id,
        name: r.name,
        grams: r.grams,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fiber: r.fiber,
        sugar: r.sugar,
        sodium: r.sodium,
        photo: (localById[r.id] && localById[r.id].photo) || null,
      }));
      saveLogsLocal(logs);
    }
    return true;
  } catch (e) {
    console.error("Cloud sync (pull) failed, using local data:", e);
    return false;
  }
}

async function pushProfileToCloud(p) {
  try {
    await sb.from("profile").upsert({
      id: "youssef",
      name: p.name,
      age: p.age,
      sex: p.sex,
      height_cm: p.heightCm,
      weight_kg: p.weightKg,
      activity: p.activity,
      goal: p.goal,
      manual_goals: p.manualGoals || null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Cloud sync (profile) failed:", e);
  }
}

async function pushLogInsert(entry) {
  try {
    await sb.from("logs").insert({
      id: entry.id,
      date: entry.date,
      time: entry.time,
      food_id: entry.foodId || null,
      name: entry.name,
      grams: entry.grams,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      sugar: entry.sugar,
      sodium: entry.sodium,
    });
  } catch (e) {
    console.error("Cloud sync (log insert) failed:", e);
  }
}

async function pushLogDelete(id) {
  try {
    await sb.from("logs").delete().eq("id", id);
  } catch (e) {
    console.error("Cloud sync (log delete) failed:", e);
  }
}

// ---------- Local cache (instant load + offline fallback) ----------
const STORE_KEY_PROFILE = "ft_profile";
const STORE_KEY_LOGS = "ft_logs";

function loadProfileLocal() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY_PROFILE)); } catch (e) { return null; }
}
function saveProfileLocal(p) { localStorage.setItem(STORE_KEY_PROFILE, JSON.stringify(p)); }

function loadLogsLocal() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY_LOGS)) || []; } catch (e) { return []; }
}
function saveLogsLocal(logs) {
  try {
    localStorage.setItem(STORE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    // Likely quota exceeded from accumulated photos - drop oldest photo data and retry once.
    const stripped = logs.map((l, i) => (i < logs.length - 30 ? { ...l, photo: null } : l));
    localStorage.setItem(STORE_KEY_LOGS, JSON.stringify(stripped));
  }
}

function loadProfile() { return loadProfileLocal(); }
function saveProfile(p) {
  saveProfileLocal(p);
  pushProfileToCloud(p);
}

function loadLogs() { return loadLogsLocal(); }
function saveLogs(logs) { saveLogsLocal(logs); }

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ---------- Goal calculation ----------
function calcGoals(profile) {
  if (profile.manualGoals) return profile.manualGoals;
  const { age, sex, heightCm, weightKg, activity, goal } = profile;
  let bmr;
  if (sex === "male") bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  else if (sex === "female") bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  else bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78; // average offset

  const tdee = bmr * activity;

  let calories = tdee;
  if (goal === "gain") calories = tdee + 300;
  if (goal === "lose") {
    const floor = Math.max(bmr * 1.3, 1600); // safety floor for a growing teen athlete
    calories = Math.max(tdee - 300, floor);
  }

  const protein = Math.round(weightKg * 1.8);
  const fat = Math.round(weightKg * 0.9);
  const remainingCals = calories - (protein * 4 + fat * 9);
  const carbs = Math.max(Math.round(remainingCals / 4), 0);

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
  };
}

// ---------- App state ----------
let profile = loadProfile();
let logs = loadLogs();
let mobilenetModel = null;
let currentScan = { photoDataUrl: null, food: null, portionMult: 1, portionGrams: null };

const $ = (id) => document.getElementById(id);

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  $(`screen-${name}`).classList.remove("hidden");
  document.querySelectorAll("nav.tabbar button").forEach((b) => {
    b.classList.toggle("active", b.dataset.screen === name);
  });
}

// ---------- Onboarding ----------
$("ob-sex").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  $("ob-sex").querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
});

$("ob-submit").addEventListener("click", () => {
  const name = $("ob-name").value.trim() || "there";
  const age = parseInt($("ob-age").value, 10);
  const sex = $("ob-sex").querySelector("button.active").dataset.val;
  const ft = parseFloat($("ob-height-ft").value) || 0;
  const inch = parseFloat($("ob-height-in").value) || 0;
  const weightLb = parseFloat($("ob-weight").value);
  const activity = parseFloat($("ob-activity").value);
  const goal = $("ob-goal").value;

  if (!age || (!ft && !inch) || !weightLb) {
    alert("Please fill in age, height, and weight.");
    return;
  }

  const heightCm = (ft * 12 + inch) * 2.54;
  const weightKg = weightLb * 0.4536;

  profile = { name, age, sex, heightCm, weightKg, activity, goal };
  saveProfile(profile);
  renderAll();
  showScreen("dashboard");
  $("tabbar").classList.remove("hidden");
  $("fab-add").classList.remove("hidden");
});

$("btn-edit-profile").addEventListener("click", () => {
  showScreen("onboarding");
  if (profile) {
    $("ob-name").value = profile.name === "there" ? "" : profile.name;
    $("ob-age").value = profile.age;
    $("ob-sex").querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.val === profile.sex));
    const totalIn = profile.heightCm / 2.54;
    $("ob-height-ft").value = Math.floor(totalIn / 12);
    $("ob-height-in").value = Math.round(totalIn % 12);
    $("ob-weight").value = Math.round(profile.weightKg / 0.4536);
    $("ob-activity").value = profile.activity;
    $("ob-goal").value = profile.goal;
  }
});

// ---------- Navigation ----------
document.querySelectorAll("nav.tabbar button").forEach((btn) => {
  btn.addEventListener("click", () => {
    showScreen(btn.dataset.screen);
    if (btn.dataset.screen === "history") renderHistory();
  });
});

$("fab-add").addEventListener("click", () => {
  resetLogFlow();
  showScreen("log");
});

// ---------- Dashboard rendering ----------
function renderDashboard() {
  if (!profile) return;
  $("dash-name").textContent = profile.name;
  $("dash-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const goals = calcGoals(profile);
  const today = todayStr();
  const todays = logs.filter((l) => l.date === today);

  const totals = todays.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein,
      carbs: acc.carbs + l.carbs,
      fat: acc.fat + l.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = Math.max(goals.calories - totals.calories, 0);
  const pct = Math.min((totals.calories / goals.calories) * 100, 100);
  $("cal-ring").style.setProperty("--pct", pct.toFixed(0));
  $("cal-remaining").textContent = remaining;

  setBar("protein", totals.protein, goals.protein);
  setBar("carbs", totals.carbs, goals.carbs);
  setBar("fat", totals.fat, goals.fat);

  const list = $("today-entries");
  list.innerHTML = "";
  if (todays.length === 0) {
    $("today-empty").classList.remove("hidden");
  } else {
    $("today-empty").classList.add("hidden");
    todays.slice().reverse().forEach((entry) => list.appendChild(renderEntryRow(entry)));
  }
}

function setBar(key, val, goal) {
  const pct = goal > 0 ? Math.min((val / goal) * 100, 100) : 0;
  $(`${key}-bar`).style.width = pct + "%";
  $(`${key}-txt`).textContent = `${Math.round(val)} / ${Math.round(goal)}g`;
}

function renderEntryRow(entry) {
  const row = document.createElement("div");
  row.className = "entry";
  row.innerHTML = `
    ${entry.photo ? `<img src="${entry.photo}" />` : `<div style="width:48px;height:48px;border-radius:8px;background:#22262f;flex-shrink:0;display:flex;align-items:center;justify-content:center;">🍽️</div>`}
    <div class="info">
      <div class="name">${entry.name}</div>
      <div class="meta">${entry.grams}g · P${entry.protein} C${entry.carbs} F${entry.fat}</div>
    </div>
    <div class="cal">${entry.calories} kcal</div>
    <button class="del">✕</button>
  `;
  row.querySelector(".del").addEventListener("click", () => {
    logs = logs.filter((l) => l.id !== entry.id);
    saveLogs(logs);
    pushLogDelete(entry.id);
    renderAll();
  });
  return row;
}

function renderProfileScreen() {
  if (!profile) return;
  const goals = calcGoals(profile);
  $("pf-cal").textContent = goals.calories;
  $("pf-protein").textContent = goals.protein + "g";
  $("pf-carbs").textContent = goals.carbs + "g";
  $("pf-fat").textContent = goals.fat + "g";
  $("pf-mode").textContent = profile.manualGoals ? "(custom)" : "(calculated)";

  $("cg-cal").value = goals.calories;
  $("cg-protein").value = goals.protein;
  $("cg-carbs").value = goals.carbs;
  $("cg-fat").value = goals.fat;
}

$("btn-save-custom").addEventListener("click", () => {
  const calories = parseFloat($("cg-cal").value);
  const proteinG = parseFloat($("cg-protein").value);
  const carbsG = parseFloat($("cg-carbs").value);
  const fatG = parseFloat($("cg-fat").value);
  if (!calories || !proteinG || !carbsG || !fatG) {
    alert("Fill in all four fields.");
    return;
  }
  profile.manualGoals = { calories: Math.round(calories), protein: Math.round(proteinG), carbs: Math.round(carbsG), fat: Math.round(fatG) };
  saveProfile(profile);
  renderAll();
});

$("btn-clear-custom").addEventListener("click", () => {
  delete profile.manualGoals;
  saveProfile(profile);
  renderAll();
});

function renderHistory() {
  const container = $("history-container");
  const byDate = {};
  logs.forEach((l) => {
    (byDate[l.date] = byDate[l.date] || []).push(l);
  });
  const dates = Object.keys(byDate).sort().reverse();
  if (dates.length === 0) {
    container.innerHTML = `<div class="empty-hint">No history yet.</div>`;
    return;
  }
  container.innerHTML = "";
  dates.forEach((date) => {
    const entries = byDate[date];
    const dayCals = entries.reduce((s, e) => s + e.calories, 0);
    const div = document.createElement("div");
    div.className = "history-day";
    div.innerHTML = `<div class="d-head"><span>${date}</span><span>${dayCals} kcal</span></div>`;
    const list = document.createElement("div");
    list.className = "entry-list";
    entries.forEach((entry) => list.appendChild(renderEntryRow(entry)));
    div.appendChild(list);
    container.appendChild(div);
  });
}

function renderAll() {
  renderDashboard();
  renderProfileScreen();
}

// ---------- Log food flow ----------
let mealItems = [];

function resetLogFlow() {
  currentScan = { photoDataUrl: null, food: null, portionMult: 1, portionGrams: null };
  mealItems = [];
  stopBarcodeScanner();
  $("log-step-capture").classList.remove("hidden");
  $("log-step-scanning").classList.add("hidden");
  $("log-step-pick").classList.add("hidden");
  $("log-step-portion").classList.add("hidden");
  $("log-step-combined").classList.add("hidden");
  $("log-step-review").classList.add("hidden");
  $("log-step-barcode").classList.add("hidden");
  $("food-search").value = "";
  $("search-results").innerHTML = "";
  $("describe-text").value = "";
  $("review-search").value = "";
  $("review-search-results").innerHTML = "";
  $("combined-photo-preview").classList.add("hidden");
  $("combined-photo-preview").src = "";
  $("btn-remove-photo").classList.add("hidden");
  $("btn-attach-photo").classList.remove("hidden");
  $("review-photo").classList.add("hidden");
  $("barcode-status").textContent = "Point your camera at the barcode";
  renderQuickAdd();
}

// ---------- Quick Add (learns your most-logged foods) ----------
function computeFrequentFoods() {
  const counts = {};
  const lastEntry = {};
  logs.forEach((l) => {
    if (!l.foodId) return;
    counts[l.foodId] = (counts[l.foodId] || 0) + 1;
    lastEntry[l.foodId] = l;
  });
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 6)
    .map((id) => {
      const known = FOOD_DB.find((f) => f.id === id);
      if (known) return { food: known, grams: lastEntry[id].grams };
      // Not in the built-in database (e.g. a scanned barcode item) -
      // rebuild a food-like object straight from the last logged entry.
      const e = lastEntry[id];
      return {
        food: {
          id: e.foodId, name: e.name, serving: `${e.grams}g`, grams: e.grams,
          calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat,
          fiber: e.fiber || 0, sugar: e.sugar || 0, sodium: e.sodium || 0,
        },
        grams: e.grams,
      };
    })
    .filter((x) => x.food);
}

function renderQuickAdd() {
  const frequent = computeFrequentFoods();
  const card = $("quick-add-card");
  const list = $("quick-add-list");
  if (frequent.length === 0) {
    card.classList.add("hidden");
    return;
  }
  card.classList.remove("hidden");
  list.innerHTML = "";
  frequent.forEach(({ food, grams }) => {
    const chip = document.createElement("button");
    chip.className = "btn secondary small";
    chip.style.cssText = "width:auto; margin-top:0; padding:8px 14px; font-size:13px;";
    chip.textContent = food.name;
    chip.addEventListener("click", () => selectFood(food, grams));
    list.appendChild(chip);
  });
}

// ---------- Meal description parser (no API - simple on-device matching) ----------
const QTY_WORDS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, couple: 2, few: 3, several: 3, single: 1, double: 2, triple: 3,
};
const QTY_FILLERS = new Set([
  "of", "cup", "cups", "slice", "slices", "piece", "pieces", "bowl", "bowls",
  "serving", "servings", "can", "cans", "bottle", "bottles", "some", "the", "with", "and",
  "grilled", "cooked", "medium", "large", "small", "fresh", "baked", "steamed", "raw", "plain",
]);

function extractQuantity(beforeText) {
  const words = beforeText.trim().split(/\s+/).slice(-6);
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i].replace(/[^a-z0-9./]/g, "");
    if (!w) continue;
    if (/^\d+(\.\d+)?$/.test(w)) return parseFloat(w);
    if (/^\d+\/\d+$/.test(w)) {
      const [n, d] = w.split("/").map(Number);
      return d ? n / d : 1;
    }
    if (w === "half") return 0.5;
    if (w === "a" || w === "an" || w === "one") {
      const prev = words[i - 1] ? words[i - 1].replace(/[^a-z]/g, "") : "";
      if (prev === "half") return 0.5;
      return 1;
    }
    if (QTY_WORDS[w] !== undefined) return QTY_WORDS[w];
    if (QTY_FILLERS.has(w)) continue;
    break;
  }
  return 1;
}

function parseMealText(text) {
  const lower = " " + text.toLowerCase() + " ";
  const aliasPairs = [];
  FOOD_DB.forEach((food) => {
    (food.aliases || [food.name.toLowerCase()]).forEach((alias) => {
      aliasPairs.push({ food, alias: alias.toLowerCase() });
    });
  });
  aliasPairs.sort((a, b) => b.alias.length - a.alias.length);

  let working = lower;
  const found = [];

  aliasPairs.forEach(({ food, alias }) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "g");
    let match;
    while ((match = re.exec(working)) !== null) {
      const idx = match.index;
      const before = working.slice(Math.max(0, idx - 30), idx);
      const qty = extractQuantity(before);
      const existing = found.find((f) => f.food.id === food.id);
      if (existing) existing.multiplier += qty;
      else found.push({ food, multiplier: qty });
      working = working.slice(0, idx) + " ".repeat(match[0].length) + working.slice(idx + match[0].length);
      re.lastIndex = idx;
    }
  });

  return found;
}

function addOrUpdateMealItem(food, multiplier) {
  const existing = mealItems.find((m) => m.food.id === food.id);
  if (existing) existing.multiplier += multiplier;
  else mealItems.push({ food, multiplier });
}

function renderMealReview() {
  const list = $("review-list");
  list.innerHTML = "";
  $("review-empty").classList.toggle("hidden", mealItems.length > 0);

  mealItems.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "entry";
    const cal = Math.round(item.food.calories * item.multiplier);
    row.innerHTML = `
      <div style="width:48px;height:48px;border-radius:8px;background:#22262f;flex-shrink:0;display:flex;align-items:center;justify-content:center;">🍽️</div>
      <div class="info">
        <div class="name">${item.food.name}</div>
        <div class="meta">
          <button class="qty-btn" data-act="minus" data-idx="${idx}" style="background:none;border:1px solid var(--border);color:var(--text);border-radius:6px;width:22px;height:22px;cursor:pointer;">-</button>
          <span style="margin:0 6px;">${item.multiplier}x</span>
          <button class="qty-btn" data-act="plus" data-idx="${idx}" style="background:none;border:1px solid var(--border);color:var(--text);border-radius:6px;width:22px;height:22px;cursor:pointer;">+</button>
        </div>
      </div>
      <div class="cal">${cal} kcal</div>
      <button class="del" data-idx="${idx}">✕</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll(".del").forEach((btn) => {
    btn.addEventListener("click", () => {
      mealItems.splice(parseInt(btn.dataset.idx, 10), 1);
      renderMealReview();
    });
  });
  list.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const item = mealItems[idx];
      if (btn.dataset.act === "plus") item.multiplier += 0.5;
      else item.multiplier = Math.max(0.5, item.multiplier - 0.5);
      renderMealReview();
    });
  });

  const totals = mealItems.reduce(
    (acc, m) => ({
      calories: acc.calories + m.food.calories * m.multiplier,
      protein: acc.protein + m.food.protein * m.multiplier,
      carbs: acc.carbs + m.food.carbs * m.multiplier,
      fat: acc.fat + m.food.fat * m.multiplier,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  $("rt-cal").textContent = Math.round(totals.calories);
  $("rt-protein").textContent = Math.round(totals.protein) + "g";
  $("rt-carbs").textContent = Math.round(totals.carbs) + "g";
  $("rt-fat").textContent = Math.round(totals.fat) + "g";
}

$("btn-log-meal-combined").addEventListener("click", () => {
  $("log-step-capture").classList.add("hidden");
  $("log-step-combined").classList.remove("hidden");
});

$("btn-cancel-describe").addEventListener("click", () => {
  resetLogFlow();
  showScreen("dashboard");
});

$("btn-attach-photo").addEventListener("click", () => $("photo-input").click());

$("btn-remove-photo").addEventListener("click", () => {
  currentScan.photoDataUrl = null;
  $("combined-photo-preview").classList.add("hidden");
  $("combined-photo-preview").src = "";
  $("btn-remove-photo").classList.add("hidden");
  $("btn-attach-photo").classList.remove("hidden");
});

$("photo-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    resizeImage(reader.result, 500, (resized) => {
      currentScan.photoDataUrl = resized;
      $("combined-photo-preview").src = resized;
      $("combined-photo-preview").classList.remove("hidden");
      $("btn-remove-photo").classList.remove("hidden");
      $("btn-attach-photo").classList.add("hidden");
    });
  };
  reader.readAsDataURL(file);
});

function resizeImage(dataUrl, maxWidth, cb) {
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    cb(canvas.toDataURL("image/jpeg", 0.65), canvas);
  };
  img.src = dataUrl;
}

function matchFoodFromLabel(label) {
  const lower = label.toLowerCase();
  for (const [keyword, foodId] of AI_KEYWORD_MAP) {
    if (lower.includes(keyword)) {
      return FOOD_DB.find((f) => f.id === foodId);
    }
  }
  return null;
}

$("btn-analyze-meal").addEventListener("click", async () => {
  const text = $("describe-text").value.trim();
  const hasPhoto = !!currentScan.photoDataUrl;
  if (!text && !hasPhoto) return;

  mealItems = text ? parseMealText(text) : [];

  if (hasPhoto) {
    $("log-step-combined").classList.add("hidden");
    $("log-step-scanning").classList.remove("hidden");
    $("scan-preview").src = currentScan.photoDataUrl;
    $("scan-status").textContent = "Loading AI model…";
    try {
      if (!mobilenetModel) {
        mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
      }
      $("scan-status").textContent = "Analyzing photo…";
      const predictions = await mobilenetModel.classify($("scan-preview"), 5);
      predictions.forEach((p) => {
        const food = matchFoodFromLabel(p.className);
        if (food && !mealItems.find((m) => m.food.id === food.id)) {
          mealItems.push({ food, multiplier: 1 });
        }
      });
    } catch (err) {
      console.error(err);
    }
    $("log-step-scanning").classList.add("hidden");
  }

  $("log-step-combined").classList.add("hidden");
  $("log-step-review").classList.remove("hidden");
  if (hasPhoto) {
    $("review-photo").src = currentScan.photoDataUrl;
    $("review-photo").classList.remove("hidden");
  }
  renderMealReview();
});

$("review-search").addEventListener("input", () => {
  const q = $("review-search").value.trim().toLowerCase();
  const results = $("review-search-results");
  results.innerHTML = "";
  if (!q) return;
  FOOD_DB.filter((f) => f.name.toLowerCase().includes(q))
    .slice(0, 20)
    .forEach((f) => {
      const el = document.createElement("div");
      el.className = "search-item";
      el.textContent = `${f.name} — ${f.calories} kcal / ${f.serving}`;
      el.addEventListener("click", () => {
        addOrUpdateMealItem(f, 1);
        $("review-search").value = "";
        results.innerHTML = "";
        renderMealReview();
      });
      results.appendChild(el);
    });
});

$("btn-cancel-review").addEventListener("click", () => {
  resetLogFlow();
  showScreen("dashboard");
});

$("btn-log-meal").addEventListener("click", () => {
  if (mealItems.length === 0) return;
  mealItems.forEach((item) => {
    const ratio = item.multiplier;
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      date: todayStr(),
      time: new Date().toISOString(),
      foodId: item.food.id,
      name: item.food.name,
      grams: Math.round(item.food.grams * ratio),
      calories: Math.round(item.food.calories * ratio),
      protein: Math.round(item.food.protein * ratio),
      carbs: Math.round(item.food.carbs * ratio),
      fat: Math.round(item.food.fat * ratio),
      fiber: Math.round(item.food.fiber * ratio),
      sugar: Math.round(item.food.sugar * ratio),
      sodium: Math.round(item.food.sodium * ratio),
      photo: currentScan.photoDataUrl || null,
    };
    logs.push(entry);
    pushLogInsert(entry);
  });
  saveLogs(logs);
  renderAll();
  resetLogFlow();
  showScreen("dashboard");
});

$("btn-skip-photo").addEventListener("click", () => {
  $("log-step-capture").classList.add("hidden");
  $("log-step-pick").classList.remove("hidden");
});

$("btn-cancel-pick").addEventListener("click", () => {
  resetLogFlow();
  showScreen("dashboard");
});

// ---------- Barcode scanner (Open Food Facts - free, no key needed) ----------
let html5QrCode = null;

async function stopBarcodeScanner() {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (e) {
      // already stopped
    }
    html5QrCode = null;
  }
}

function buildFoodFromBarcodeProduct(product, code) {
  const n = product.nutriments || {};
  const per100 = {
    calories: n["energy-kcal_100g"] ?? 0,
    protein: n["proteins_100g"] ?? 0,
    carbs: n["carbohydrates_100g"] ?? 0,
    fat: n["fat_100g"] ?? 0,
    fiber: n["fiber_100g"] ?? 0,
    sugar: n["sugars_100g"] ?? 0,
    sodium: (n["sodium_100g"] ?? 0) * 1000, // g -> mg
  };
  let grams = 100;
  const match = (product.serving_size || "").match(/(\d+(\.\d+)?)\s*g/i);
  if (match) grams = parseFloat(match[1]);
  const ratio = grams / 100;
  return {
    id: "off_" + code,
    name: product.product_name || "Scanned Product",
    serving: product.serving_size ? `1 serving (${product.serving_size})` : "100g",
    grams: grams,
    calories: Math.round(per100.calories * ratio),
    protein: Math.round(per100.protein * ratio),
    carbs: Math.round(per100.carbs * ratio),
    fat: Math.round(per100.fat * ratio),
    fiber: Math.round(per100.fiber * ratio),
    sugar: Math.round(per100.sugar * ratio),
    sodium: Math.round(per100.sodium * ratio),
  };
}

async function onBarcodeDecoded(code) {
  await stopBarcodeScanner();
  $("barcode-status").textContent = `Looking up ${code}…`;
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const food = buildFoodFromBarcodeProduct(data.product, code);
      selectFood(food);
    } else {
      $("barcode-status").textContent = "Couldn't find that product in the database. Try Search or Describe instead.";
    }
  } catch (e) {
    console.error(e);
    $("barcode-status").textContent = "Network error looking that up. Check your connection and try again.";
  }
}

$("btn-scan-barcode").addEventListener("click", async () => {
  $("log-step-capture").classList.add("hidden");
  $("log-step-barcode").classList.remove("hidden");
  $("barcode-status").textContent = "Starting camera…";
  try {
    html5QrCode = new Html5Qrcode("barcode-reader");
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      },
      (decodedText) => onBarcodeDecoded(decodedText),
      () => {} // ignore per-frame "no barcode found" noise
    );
    $("barcode-status").textContent = "Point your camera at the barcode";
  } catch (e) {
    console.error(e);
    $("barcode-status").textContent = "Couldn't access the camera. Check permissions, or use Search instead.";
  }
});

$("btn-cancel-barcode").addEventListener("click", () => {
  resetLogFlow();
  showScreen("dashboard");
});

$("food-search").addEventListener("input", () => {
  const q = $("food-search").value.trim().toLowerCase();
  const results = $("search-results");
  results.innerHTML = "";
  if (!q) return;
  FOOD_DB.filter((f) => f.name.toLowerCase().includes(q))
    .slice(0, 20)
    .forEach((f) => {
      const el = document.createElement("div");
      el.className = "search-item";
      el.textContent = `${f.name} — ${f.calories} kcal / ${f.serving}`;
      el.addEventListener("click", () => selectFood(f));
      results.appendChild(el);
    });
});

function selectFood(food, defaultGrams) {
  const grams = defaultGrams || food.grams;
  currentScan.food = food;
  currentScan.portionMult = grams / food.grams;
  currentScan.portionGrams = grams;
  $("log-step-capture").classList.add("hidden");
  $("log-step-pick").classList.add("hidden");
  $("log-step-barcode").classList.add("hidden");
  $("log-step-portion").classList.remove("hidden");
  $("portion-food-name").textContent = food.name;
  $("portion-base-macro").innerHTML = `<span>Base serving: ${food.serving}</span>`;
  $("portion-grams").value = Math.round(grams);
  $("portion-grid").querySelectorAll("button").forEach((b) => b.classList.toggle("active", parseFloat(b.dataset.mult) === currentScan.portionMult));
  updatePortionTotals();
}

$("portion-grid").addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  $("portion-grid").querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
  const mult = parseFloat(e.target.dataset.mult);
  currentScan.portionMult = mult;
  currentScan.portionGrams = currentScan.food.grams * mult;
  $("portion-grams").value = Math.round(currentScan.portionGrams);
  updatePortionTotals();
});

$("portion-grams").addEventListener("input", () => {
  const grams = parseFloat($("portion-grams").value) || 0;
  currentScan.portionGrams = grams;
  $("portion-grid").querySelectorAll("button").forEach((b) => b.classList.remove("active"));
  updatePortionTotals();
});

function updatePortionTotals() {
  const food = currentScan.food;
  if (!food) return;
  const ratio = currentScan.portionGrams / food.grams;
  $("pt-cal").textContent = Math.round(food.calories * ratio);
  $("pt-protein").textContent = Math.round(food.protein * ratio) + "g";
  $("pt-carbs").textContent = Math.round(food.carbs * ratio) + "g";
  $("pt-fat").textContent = Math.round(food.fat * ratio) + "g";
}

$("btn-log-it").addEventListener("click", () => {
  const food = currentScan.food;
  const ratio = currentScan.portionGrams / food.grams;
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    date: todayStr(),
    time: new Date().toISOString(),
    foodId: food.id,
    name: food.name,
    grams: Math.round(currentScan.portionGrams),
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio),
    carbs: Math.round(food.carbs * ratio),
    fat: Math.round(food.fat * ratio),
    fiber: Math.round(food.fiber * ratio),
    sugar: Math.round(food.sugar * ratio),
    sodium: Math.round(food.sodium * ratio),
    photo: currentScan.photoDataUrl,
  };
  logs.push(entry);
  pushLogInsert(entry);
  saveLogs(logs);
  renderAll();
  resetLogFlow();
  showScreen("dashboard");
});

$("btn-cancel-log").addEventListener("click", () => {
  resetLogFlow();
  showScreen("dashboard");
});

// ---------- Init ----------
function init() {
  if (profile) {
    renderAll();
    showScreen("dashboard");
    $("tabbar").classList.remove("hidden");
    $("fab-add").classList.remove("hidden");
  } else {
    showScreen("onboarding");
  }

  // Cloud is the source of truth - refresh from it once it responds,
  // so any device opening the app picks up the latest profile/goals/logs.
  pullFromCloud().then((ok) => {
    if (!ok) return;
    if (profile) {
      renderAll();
      if (!$("screen-onboarding").classList.contains("hidden")) {
        showScreen("dashboard");
        $("tabbar").classList.remove("hidden");
        $("fab-add").classList.remove("hidden");
      }
      if (!$("screen-history").classList.contains("hidden")) renderHistory();
    }
  });
}
init();
