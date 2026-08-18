/* ═══════════════════════════════════════════════════════════
   AI Fashion Stylist — Frontend Logic
   Talks to Flask API at /api/*
═══════════════════════════════════════════════════════════ */

let currentRec  = null;
let wishlist    = [];
let wishCount   = 0;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Set greeting time in chat
  const gt = document.getElementById("greetTime");
  if (gt) gt.textContent = now();

  // Load wishlist count from server
  loadWishlistCount();

  // Update user label from name input if present
  const fName = document.getElementById("fName");
  if (fName) {
    fName.addEventListener("input", () => {
      const label = document.getElementById("userLabel");
      if (label) label.textContent = fName.value.trim() || "Guest";
    });
  }
});

// ─── Page Navigation ──────────────────────────────────────────────────────────
function showPage(name, linkEl) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-" + name);
  if (page) page.classList.add("active");
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  if (linkEl) linkEl.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Load wishlist page items if needed
  if (name === "wishlist") renderWishlist();
}

// ─── Occasion Filter ──────────────────────────────────────────────────────────
function filterOccasion(val, btn) {
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  const sel = document.getElementById("fOccasion");
  if (!sel) return;
  if (val === "All") return;
  const map = { Casual: "Casual Day Out", Formal: "Formal / Corporate", Wedding: "Wedding", College: "College" };
  if (map[val]) sel.value = map[val];
}

// ─── Generate Recommendation ──────────────────────────────────────────────────
async function generateRecommendation() {
  const name = document.getElementById("fName").value.trim();
  const age  = document.getElementById("fAge").value.trim();
  if (!name) { toast("Please enter your name! ✦"); return; }
  if (!age)  { toast("Please enter your age! ✦");  return; }

  const style = document.getElementById("fStyle").value;
  if (!style) { toast("Please select a style preference! ✦"); return; }

  const btn = document.getElementById("genBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Generating…`;

  const payload = {
    name,
    age,
    gender:   document.getElementById("fGender").value,
    occasion: document.getElementById("fOccasion").value,
    budget:   document.getElementById("fBudget").value,
    style,
    bodyType: document.getElementById("fBody").value,
    skinTone: document.getElementById("fSkin").value,
    color:    document.getElementById("fColor").value,
  };

  try {
    const res  = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.error) {
      toast("Error: " + data.error);
    } else {
      currentRec = data.recommendation;
      renderResult(data.recommendation, name);
      document.getElementById("userLabel").textContent = name;
      toast("✦ Outfit ready! Scroll down to see your recommendation.");
    }
  } catch (err) {
    toast("Network error. Is Flask running? 🔌");
  }

  btn.disabled = false;
  btn.innerHTML = "✦ Generate AI Recommendation";
}

// ─── Render Result ────────────────────────────────────────────────────────────
function renderResult(rec, name) {
  const section = document.getElementById("resultSection");
  const grid    = document.getElementById("resultGrid");
  const tipsEl  = document.getElementById("fashionTipsCard");

  const cards = [
    { label: "👗 OUTFIT",         value: rec.outfit },
    { label: "👜 ACCESSORIES",    value: rec.accessories },
    { label: "👟 FOOTWEAR",       value: rec.footwear },
    { label: "👛 HANDBAG",        value: rec.handbag },
    { label: "💍 JEWELLERY",      value: rec.jewellery },
    { label: "💇 HAIRSTYLE",      value: rec.hairstyle },
    { label: "🎨 COLOUR ADVICE",  value: rec.colour_advice },
    { label: "📐 BODY TYPE TIP",  value: rec.body_tip },
    { label: "💰 ESTIMATED COST", value: rec.estimated_cost, highlight: true },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="result-card">
      <div class="result-card-label">${c.label}</div>
      <div class="result-card-value ${c.highlight ? 'highlight' : ''}">${c.value || "—"}</div>
    </div>
  `).join("");

  // Fashion tips
  const tips = rec.fashion_tips || [];
  tipsEl.innerHTML = `
    <div class="tips-label">✦ FASHION TIPS</div>
    <ul class="tips-list">
      ${tips.map(t => `<li>${t}</li>`).join("")}
    </ul>
  `;

  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Reset Form ───────────────────────────────────────────────────────────────
function resetForm() {
  document.getElementById("fName").value    = "";
  document.getElementById("fAge").value     = "";
  document.getElementById("fGender").value  = "Female";
  document.getElementById("fOccasion").value = "Casual Day Out";
  document.getElementById("fBudget").value  = "₹2,000 – ₹5,000";
  document.getElementById("fStyle").value   = "";
  document.getElementById("fBody").value    = "Hourglass";
  document.getElementById("fSkin").value    = "Fair / Light";
  document.getElementById("fColor").value   = "Any";
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("userLabel").textContent = "Guest";
  currentRec = null;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
async function saveToWishlist() {
  if (!currentRec) { toast("Generate a recommendation first!"); return; }
  const name = document.getElementById("fName").value.trim() || "Outfit";

  try {
    const res  = await fetch("/api/wishlist/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, recommendation: currentRec }),
    });
    const data = await res.json();
    wishCount = data.count;
    updateWishBadge(wishCount);
    toast("❤ Saved to Wishlist!");
  } catch {
    // Fallback: save locally
    wishlist.push({ name, rec: currentRec, id: Date.now() });
    wishCount = wishlist.length;
    updateWishBadge(wishCount);
    toast("❤ Saved to Wishlist! (local)");
  }
}

async function loadWishlistCount() {
  try {
    const res  = await fetch("/api/wishlist");
    const data = await res.json();
    if (data.wishlist) {
      wishlist  = data.wishlist;
      wishCount = data.wishlist.length;
      updateWishBadge(wishCount);
    }
  } catch { /* ignore */ }
}

function updateWishBadge(count) {
  const badge = document.getElementById("wishBadge");
  if (badge) badge.textContent = count;
}

function renderWishlist() {
  // Merge local + server
  const items = wishlist.length > 0 ? wishlist : [];
  const empty = document.getElementById("wishlistEmpty");
  const grid  = document.getElementById("wishlistGrid");
  if (!items.length) {
    empty.style.display = "block";
    grid.style.display  = "none";
    return;
  }
  empty.style.display = "none";
  grid.style.display  = "grid";
  grid.innerHTML = items.map((item, i) => {
    const r = item.rec || {};
    return `
      <div class="wishlist-card">
        <button class="wc-del" onclick="removeWishItem(${i})">✕ Remove</button>
        <div class="wc-title">✦ ${item.name || "Saved Outfit"}</div>
        <div class="wc-sub">AI-recommended outfit</div>
        <div class="wc-items">
          ${r.outfit      ? `<div class="wc-item"><span class="wc-item-label">Outfit</span><span>${r.outfit}</span></div>` : ""}
          ${r.accessories ? `<div class="wc-item"><span class="wc-item-label">Accessories</span><span>${r.accessories}</span></div>` : ""}
          ${r.footwear    ? `<div class="wc-item"><span class="wc-item-label">Footwear</span><span>${r.footwear}</span></div>` : ""}
          ${r.estimated_cost ? `<div class="wc-item"><span class="wc-item-label">Est. Cost</span><span style="color:var(--green)">${r.estimated_cost}</span></div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function removeWishItem(i) {
  wishlist.splice(i, 1);
  wishCount = wishlist.length;
  updateWishBadge(wishCount);
  renderWishlist();
  toast("Removed from wishlist.");
}

// ─── Download PDF ─────────────────────────────────────────────────────────────
function downloadPDF() {
  if (!currentRec) { toast("No recommendation to download!"); return; }
  const name = document.getElementById("fName").value.trim() || "Outfit";
  const lines = [
    `AI Fashion Stylist — Outfit Recommendation`,
    `For: ${name}`,
    ``,
    `OUTFIT: ${currentRec.outfit || "—"}`,
    `ACCESSORIES: ${currentRec.accessories || "—"}`,
    `FOOTWEAR: ${currentRec.footwear || "—"}`,
    `HANDBAG: ${currentRec.handbag || "—"}`,
    `JEWELLERY: ${currentRec.jewellery || "—"}`,
    `HAIRSTYLE: ${currentRec.hairstyle || "—"}`,
    ``,
    `COLOUR ADVICE: ${currentRec.colour_advice || "—"}`,
    `BODY TYPE TIP: ${currentRec.body_tip || "—"}`,
    `ESTIMATED COST: ${currentRec.estimated_cost || "—"}`,
    ``,
    `FASHION TIPS:`,
    ...(currentRec.fashion_tips || []).map(t => `  › ${t}`),
    ``,
    `Generated by AI Fashion Stylist — NSTI Fashion Design & Technology`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${name}-outfit-recommendation.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast("📄 Recommendation downloaded!");
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg   = input.value.trim();
  if (!msg) return;

  input.value = "";
  appendMessage(msg, "user");

  // Typing indicator
  const typingId = appendTyping();

  try {
    const res  = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();
    removeTyping(typingId);
    appendMessage(data.response || "I'm here to help! ✦", "bot");
  } catch {
    removeTyping(typingId);
    appendMessage("Sorry, I can't connect right now. Please check if the server is running. 🔌", "bot");
  }
}

function askTopic(topic) {
  document.querySelectorAll(".topic-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById("chatInput").value = `Suggest a ${topic.toLowerCase()} outfit for me`;
  sendMessage();
}

function appendMessage(text, role) {
  const wrap = document.getElementById("chatMessages");
  const div  = document.createElement("div");
  div.className = `msg msg-${role}`;
  div.innerHTML = role === "bot"
    ? `<div class="msg-avatar">✦</div><div class="msg-bubble">${text}<div class="msg-time">${now()}</div></div>`
    : `<div class="msg-bubble">${escHtml(text)}<div class="msg-time">${now()}</div></div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

function appendTyping() {
  const id   = "typing-" + Date.now();
  const wrap = document.getElementById("chatMessages");
  const div  = document.createElement("div");
  div.className = "msg msg-bot";
  div.id = id;
  div.innerHTML = `<div class="msg-avatar">✦</div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function clearChat() {
  const wrap = document.getElementById("chatMessages");
  wrap.innerHTML = `
    <div class="msg msg-bot">
      <div class="msg-avatar">✦</div>
      <div class="msg-bubble">
        Chat cleared! ✦ I'm still here — ask me anything about fashion. 💫
        <div class="msg-time">${now()}</div>
      </div>
    </div>
  `;
}

function setMood(mood, emoji) {
  document.getElementById("currentMood").textContent = mood;
  document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  const input = document.getElementById("chatInput");
  input.value = `I'm feeling ${mood.toLowerCase()} today. What outfit should I wear?`;
  toast(`Mood set to: ${mood} ${emoji}`);
}

function changePersona() {
  const persona = document.getElementById("personaSelect").value;
  const name    = persona.split("—")[0].trim();
  document.getElementById("agentName").textContent = `${persona.replace("✦ ","").replace("🌙 ","").replace("🪔 ","").replace("🔥 ","")} — AI Fashion Stylist`;
  appendMessage(`You're now chatting with <strong>${persona}</strong>! How can I style you today? ✦`, "bot");
}

// ─── Contact Form ─────────────────────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  toast("✦ Message sent! We'll get back to you soon.");
  e.target.reset();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
