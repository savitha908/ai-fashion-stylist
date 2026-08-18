from flask import Flask, render_template, request, jsonify
import random
import time

app = Flask(__name__)

# ─── Design Variants ──────────────────────────────────────────────────────────
DESIGN_VARIANTS = [
    {
        "id": 1,
        "title": "Midnight Bloom Midi Dress",
        "tags": ["Boho", "Floral", "Feminine", "Midi Length"],
        "color1": "#9333ea",
        "color2": "#ec4899",
        "pattern": True,
        "specs": {
            "silhouette": "A-Line Midi",
            "neckline": "Off-Shoulder",
            "sleeve": "Short Flutter",
            "fabric": "Chiffon / Lace",
            "occasion": "Casual / Garden Party",
            "cost": "$45 – $120",
        },
        "complexity": 60,
        "complexity_label": "Medium",
        "suggestions": ["Add lace hem", "Try pastel tones", "Add belt detail", "Floral embroidery"],
        "keywords": ["boho", "floral", "dress", "midi", "garden", "flowy", "cottagecore", "prairie"],
    },
    {
        "id": 2,
        "title": "Obsidian Power Blazer",
        "tags": ["Formal", "Minimalist", "Power", "Structured"],
        "color1": "#1e293b",
        "color2": "#475569",
        "pattern": False,
        "specs": {
            "silhouette": "Tailored Fit",
            "neckline": "V-Neck",
            "sleeve": "Long",
            "fabric": "Wool Blend",
            "occasion": "Office / Evening",
            "cost": "$80 – $220",
        },
        "complexity": 45,
        "complexity_label": "Low-Med",
        "suggestions": ["Try white lapel", "Add pinstripe", "Oversized cut", "Double-breasted"],
        "keywords": ["blazer", "suit", "formal", "office", "work", "power", "tailored", "minimalist"],
    },
    {
        "id": 3,
        "title": "Coastal Breeze Co-ord",
        "tags": ["Casual", "Summer", "Coastal", "Matching Set"],
        "color1": "#0891b2",
        "color2": "#38bdf8",
        "pattern": True,
        "specs": {
            "silhouette": "Relaxed Fit",
            "neckline": "Square",
            "sleeve": "Sleeveless",
            "fabric": "Linen / Cotton",
            "occasion": "Beach / Resort",
            "cost": "$30 – $85",
        },
        "complexity": 35,
        "complexity_label": "Simple",
        "suggestions": ["Add wrap skirt", "Try tie-dye", "Crop top variant", "Wide leg pants"],
        "keywords": ["coast", "beach", "summer", "sea", "linen", "resort", "casual", "tropical"],
    },
    {
        "id": 4,
        "title": "Urban Oversized Hoodie Set",
        "tags": ["Streetwear", "Casual", "Oversized", "Cool"],
        "color1": "#dc2626",
        "color2": "#991b1b",
        "pattern": False,
        "specs": {
            "silhouette": "Oversized Drop",
            "neckline": "Hood",
            "sleeve": "Long Cuff",
            "fabric": "Fleece / Terry",
            "occasion": "Everyday / Street",
            "cost": "$35 – $95",
        },
        "complexity": 30,
        "complexity_label": "Simple",
        "suggestions": ["Add graphic print", "Try monogram", "Cargo pants match", "Colour-block"],
        "keywords": ["street", "hoodie", "urban", "hip hop", "oversized", "hype", "cargo", "cool"],
    },
    {
        "id": 5,
        "title": "Emerald Evening Gown",
        "tags": ["Formal", "Elegant", "Evening", "Floor Length"],
        "color1": "#059669",
        "color2": "#34d399",
        "pattern": False,
        "specs": {
            "silhouette": "Column / Sheath",
            "neckline": "Halter V",
            "sleeve": "Sleeveless",
            "fabric": "Satin / Velvet",
            "occasion": "Gala / Wedding Guest",
            "cost": "$120 – $350",
        },
        "complexity": 85,
        "complexity_label": "Complex",
        "suggestions": ["Add cape back", "Try slit detail", "Ruching at waist", "Beaded bodice"],
        "keywords": ["gown", "evening", "gala", "elegant", "ball", "luxury", "velvet", "satin"],
    },
]

# ─── Product Database ─────────────────────────────────────────────────────────
PRODUCTS = [
    {"id": 1, "name": "Floral Chiffon Midi Dress", "store": "SHEIN",          "price": "$18", "original": "$45", "match": 92, "badge": "Best Match", "emoji": "👗", "bg": "#1a0f2e"},
    {"id": 2, "name": "Boho Off-Shoulder Blouse",  "store": "Amazon Fashion",  "price": "$24", "original": "$55", "match": 87, "badge": None,          "emoji": "👚", "bg": "#0f1a2e"},
    {"id": 3, "name": "Prairie Tiered Skirt",       "store": "H&M",            "price": "$29", "original": "$59", "match": 83, "badge": "Sale",         "emoji": "🩱", "bg": "#1a2e0f"},
    {"id": 4, "name": "Linen Co-ord Set",           "store": "Zara",           "price": "$35", "original": "$79", "match": 78, "badge": None,           "emoji": "👔", "bg": "#2e1a0f"},
    {"id": 5, "name": "Flare Wide-Leg Pants",       "store": "ASOS",           "price": "$22", "original": "$48", "match": 74, "badge": "Hot",          "emoji": "👖", "bg": "#0f1a1a"},
    {"id": 6, "name": "Wrap Dress Midi",            "store": "Mango",          "price": "$42", "original": "$89", "match": 71, "badge": None,           "emoji": "👗", "bg": "#1a1a2e"},
    {"id": 7, "name": "Puff Sleeve Top",            "store": "Primark",        "price": "$12", "original": "$25", "match": 68, "badge": "Budget Pick",  "emoji": "👕", "bg": "#2e0f1a"},
    {"id": 8, "name": "Crochet Beach Cover-Up",     "store": "Romwe",          "price": "$16", "original": "$38", "match": 65, "badge": None,           "emoji": "🧶", "bg": "#2e2a0f"},
]

# ─── Gallery ──────────────────────────────────────────────────────────────────
GALLERY = [
    {"id": 1, "style": "boho",       "label": "Bohemian Dreams",   "meta": "Earthy · Flowy · Free",     "emoji": "🌸", "bg": "linear-gradient(135deg,#2d1b69,#1a0f3a)"},
    {"id": 2, "style": "formal",     "label": "Power Blazer Look", "meta": "Sharp · Tailored · Bold",   "emoji": "🖤", "bg": "linear-gradient(135deg,#1a1a2e,#0d0d18)"},
    {"id": 3, "style": "streetwear", "label": "Urban Edge",        "meta": "Oversized · Edgy · Cool",   "emoji": "🔥", "bg": "linear-gradient(135deg,#1a0a00,#2d1500)"},
    {"id": 4, "style": "minimalist", "label": "Clean Lines",       "meta": "Simple · Elegant · Calm",   "emoji": "◻", "bg": "linear-gradient(135deg,#111827,#1f2937)"},
    {"id": 5, "style": "boho",       "label": "Cottagecore Charm", "meta": "Romantic · Soft · Floral",  "emoji": "🌿", "bg": "linear-gradient(135deg,#0f2a1a,#1a3a0f)"},
    {"id": 6, "style": "formal",     "label": "Evening Gown Glam", "meta": "Luxe · Flowing · Dramatic", "emoji": "👑", "bg": "linear-gradient(135deg,#1a0929,#2d0f45)"},
    {"id": 7, "style": "streetwear", "label": "90s Nostalgia",     "meta": "Retro · Baggy · Vintage",   "emoji": "⚡", "bg": "linear-gradient(135deg,#0a0a1a,#1a1a3a)"},
    {"id": 8, "style": "minimalist", "label": "Neutral Palette",   "meta": "Beige · Ivory · Taupe",     "emoji": "🌾", "bg": "linear-gradient(135deg,#1a1610,#2a2218)"},
]


def pick_variant(prompt: str) -> dict:
    """Match prompt text to the best design variant using keywords."""
    prompt_lower = prompt.lower()
    best_match = DESIGN_VARIANTS[0]
    best_score = 0
    for variant in DESIGN_VARIANTS:
        score = sum(1 for kw in variant["keywords"] if kw in prompt_lower)
        if score > best_score:
            best_score = score
            best_match = variant
    return best_match


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", gallery=GALLERY)


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json()
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    variant = pick_variant(prompt)
    products = random.sample(PRODUCTS, 3)

    return jsonify({
        "design": variant,
        "products": products,
    })


@app.route("/api/remix", methods=["POST"])
def remix():
    variant = random.choice(DESIGN_VARIANTS)
    return jsonify({"design": variant})


@app.route("/api/products", methods=["GET"])
def products():
    shuffled = random.sample(PRODUCTS, 3)
    return jsonify({"products": shuffled})


@app.route("/api/gallery", methods=["GET"])
def gallery():
    style = request.args.get("style", "all")
    items = GALLERY if style == "all" else [g for g in GALLERY if g["style"] == style]
    return jsonify({"gallery": items})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
