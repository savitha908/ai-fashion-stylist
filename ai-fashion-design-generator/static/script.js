/* ═══════════════════════════════════════════════════════════
   AI Fashion Design Generator — Frontend Logic
   Communicates with Flask API at /api/*
═══════════════════════════════════════════════════════════ */

let savedDesigns = [];
let currentDesign = null;
let viewFront = true;

const GEN_MESSAGES = [
  "Analyzing style prompt…",
  "Selecting silhouette and cut…",
  "Choosing fabric textures…",
  "Assembling color palette…",
  "Applying design patterns…",
  "Finalizing details and drape…",
  "Almost there…",
];

const COLOR_LABELS = {
  "#9333ea": "Purple Dream",
  "#0ea5e9": "Ocean Blue",
  "#f59e0b": "Golden Hour",
  "#10b981": "Forest Sage",
  "#ef4444": "Rose Red",
  "#2a2a3a": "Midnight",
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadGallery("all");
});

// ─── Page Navigation ──────────────────────────────────────────────────────────
function showPage(name, btn) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  document.querySelectorAll("nav button").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

// ─── Filter ───────────────────────────────────────────────────────────────────
function toggleFilter(btn) {
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

// ─── Chips ────────────────────────────────────────────────────────────────────
function useChip(el) {
  const text = el.textContent.replace(/^[^\w]+/, "").trim();
  document.getElementById("promptInput").value = text;
  document.getElementById("promptInput").focus();
}

// ─── Generate Design (calls Flask API) ───────────────────────────────────────
async function generateDesign() {
  const prompt = document.getElementById("promptInput").value.trim();
  if (!prompt) {
    toast("Please describe your outfit first! ✦");
    return;
  }

  // UI: loading state
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  document.getElementById("btnText").textContent = "Generating…";
  document.getElementById("btnIcon").textContent = "⟳";

  const overlay = document.getElementById("generatingOverlay");
  overlay.classList.add("active");

  let step = 0;
  const interval = setInterval(() => {
    document.getElementById("genSteps").textContent =
      GEN_MESSAGES[step % GEN_MESSAGES.length];
    step++;
  }, 350);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();

    clearInterval(interval);
    overlay.classList.remove("active");

    if (data.error) {
      toast("Error: " + data.error);
    } else {
      currentDesign = data.design;
      applyDesign(data.design);
      renderProducts(data.products);
      toast("✦ Design generated! Explore details →");
    }
  } catch (err) {
    clearInterval(interval);
    overlay.classList.remove("active");
    toast("Network error. Is Flask running?");
  }

  btn.disabled = false;
  document.getElementById("btnText").textContent = "Generate";
  document.getElementById("btnIcon").textContent = "✦";
}

// ─── Apply Design to SVG + Detail Panel ──────────────────────────────────────
function applyDesign(variant) {
  // SVG colors
  document.getElementById("grad-stop1").setAttribute("stop-color", variant.color1);
  document.getElementById("grad-stop2").setAttribute("stop-color", variant.color2);
  document.getElementById("grad2-stop1").setAttribute("stop-color", shadeColor(variant.color1, -20));
  document.getElementById("grad2-stop2").setAttribute("stop-color", shadeColor(variant.color2, -20));
  document.getElementById("svgPattern").setAttribute("opacity", variant.pattern ? "1" : "0");

  // Title + Tags
  document.getElementById("designTitle").textContent = variant.title;
  document.getElementById("designTags").innerHTML = variant.tags
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  // Specs
  const s = variant.specs;
  document.getElementById("specSilhouette").textContent = s.silhouette;
  document.getElementById("specNeckline").textContent   = s.neckline;
  document.getElementById("specSleeve").textContent     = s.sleeve;
  document.getElementById("specFabric").textContent     = s.fabric;
  document.getElementById("specOccasion").textContent   = s.occasion;
  document.getElementById("specCost").textContent       = s.cost;

  // Complexity
  document.getElementById("complexityFill").style.width = variant.complexity + "%";
  document.getElementById("complexityLabel").textContent = variant.complexity_label;

  // AI Suggestions
  document.getElementById("aiSuggestions").innerHTML = variant.suggestions
    .map((s) => `<span class="suggestion-pill" onclick="useChip(this)">✦ ${s}</span>`)
    .join("");

  // Reset swatches
  document.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
  const firstSwatch = document.querySelector(".swatch");
  if (firstSwatch) firstSwatch.classList.add("selected");
  document.getElementById("colorLabel").textContent = "Current Palette";
}

// ─── Color Swatches ───────────────────────────────────────────────────────────
function applyColor(el, c1, c2) {
  document.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("grad-stop1").setAttribute("stop-color", c1);
  document.getElementById("grad-stop2").setAttribute("stop-color", c2);
  document.getElementById("grad2-stop1").setAttribute("stop-color", shadeColor(c1, -25));
  document.getElementById("grad2-stop2").setAttribute("stop-color", shadeColor(c2, -25));
  document.getElementById("colorLabel").textContent = COLOR_LABELS[c1] || "Custom";
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ─── Canvas Actions ───────────────────────────────────────────────────────────
function toggleView() {
  viewFront = !viewFront;
  document.getElementById("designSvg").style.transform = viewFront ? "scaleX(1)" : "scaleX(-1)";
  toast(viewFront ? "Showing front view" : "Showing back view");
}

function saveDesign() {
  if (!currentDesign) {
    toast("Generate a design first!");
    return;
  }
  savedDesigns.push({ ...currentDesign, savedAt: Date.now() });
  toast("✦ Design saved to your wardrobe!");
  renderWardrobe();
}

async function remixDesign() {
  try {
    const res = await fetch("/api/remix", { method: "POST" });
    const data = await res.json();
    currentDesign = data.design;
    applyDesign(data.design);
    toast("↺ Remixed! Here's a new variation.");
  } catch {
    toast("Network error. Is Flask running?");
  }
}

function shareDesign() {
  toast("⤴ Design link copied to clipboard!");
}

// ─── Products ─────────────────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    renderProducts(data.products);
  } catch {
    renderProducts([]);
  }
}

async function shuffleProducts() {
  await loadProducts();
}

function renderProducts(items) {
  const grid = document.getElementById("productGrid");
  if (!items || items.length === 0) {
    grid.innerHTML = `<div style="color:var(--muted);font-size:0.88rem;">No products found.</div>`;
    return;
  }
  grid.innerHTML = items
    .map(
      (p) => `
    <div class="product-card">
      <div class="product-img" style="background:${p.bg};">
        <span>${p.emoji}</span>
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ""}
      </div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-store">${p.store}</div>
        <div class="match-meter">
          <span style="font-size:0.7rem;color:var(--muted)">Match</span>
          <div class="match-bar"><div class="match-fill" style="width:${p.match}%"></div></div>
          <span class="match-pct">${p.match}%</span>
        </div>
        <div class="product-footer">
          <div>
            <div class="product-price">${p.price}</div>
            <div class="product-original">${p.original}</div>
          </div>
          <button class="btn-shop" onclick="toast('Opening ${p.store}…')">Shop →</button>
        </div>
      </div>
    </div>`
    )
    .join("");
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
async function loadGallery(style) {
  try {
    const res = await fetch(`/api/gallery?style=${style}`);
    const data = await res.json();
    renderGallery(data.gallery);
  } catch {
    renderGallery([]);
  }
}

function filterGallery(style) {
  loadGallery(style);
}

function renderGallery(items) {
  const grid = document.getElementById("galleryGrid");
  if (!items || items.length === 0) {
    grid.innerHTML = `<div style="color:var(--muted);">No items found.</div>`;
    return;
  }
  grid.innerHTML = items
    .map(
      (item) => `
    <div class="gallery-item" onclick="loadGalleryItem('${item.label}', '${item.meta}')">
      <div class="gallery-thumb" style="background:${item.bg};">
        <span>${item.emoji}</span>
        <div class="gallery-overlay">Use This Style →</div>
      </div>
      <div class="gallery-info">
        <div class="gallery-label">${item.label}</div>
        <div class="gallery-meta">${item.meta}</div>
      </div>
    </div>`
    )
    .join("");
}

function loadGalleryItem(label, meta) {
  document.getElementById("promptInput").value = `${label} — ${meta}`;
  showPage("design", document.querySelectorAll("nav button")[0]);
  toast("✦ Style loaded! Hit Generate to create it.");
}

// ─── Wardrobe ─────────────────────────────────────────────────────────────────
function renderWardrobe() {
  const grid = document.getElementById("wardrobeGrid");
  const empty = document.getElementById("wardrobeEmpty");
  if (savedDesigns.length === 0) {
    grid.style.display = "none";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  grid.style.display = "grid";
  grid.innerHTML = savedDesigns
    .map(
      (d, i) => `
    <div class="gallery-item" onclick="loadSavedDesign(${i})">
      <div class="gallery-thumb" style="background:linear-gradient(135deg,${d.color1},${d.color2});">
        <span style="font-size:2rem">👗</span>
        <div class="gallery-overlay">Load Design →</div>
      </div>
      <div class="gallery-info">
        <div class="gallery-label">${d.title}</div>
        <div class="gallery-meta">${d.tags.join(" · ")}</div>
      </div>
    </div>`
    )
    .join("");
}

function loadSavedDesign(index) {
  const design = savedDesigns[index];
  currentDesign = design;
  applyDesign(design);
  showPage("design", document.querySelectorAll("nav button")[0]);
  toast("✦ Design loaded from wardrobe!");
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}
