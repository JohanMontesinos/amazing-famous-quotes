import json
import random
from pathlib import Path

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
QUOTES_FILE = BASE_DIR / "quotes.json"

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)


def load_quotes():
    with open(QUOTES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/quotes/random")
def get_random_quote():
    quotes = load_quotes()
    category = request.args.get("category", "").strip()
    author = request.args.get("author", "").strip()

    filtered = quotes
    if category:
        filtered = [q for q in filtered if q["category"].lower() == category.lower()]
    if author:
        filtered = [q for q in filtered if author.lower() in q["author"].lower()]

    if not filtered:
        return jsonify({"error": "No quotes found matching criteria"}), 404

    return jsonify(random.choice(filtered))


@app.route("/api/quotes")
def get_quotes():
    quotes = load_quotes()
    query = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    results = quotes

    if category:
        results = [q for q in results if q["category"].lower() == category]

    if author:
        results = [q for q in results if author in q["author"].lower()]

    if query:
        results = [
            q
            for q in results
            if query in q["quote"].lower()
            or query in q["author"].lower()
            or query in q["category"].lower()
        ]

    return jsonify(
        {
            "total": len(results),
            "quotes": results,
        }
    )


@app.route("/api/categories")
def get_categories():
    quotes = load_quotes()
    counts = {}
    for q in quotes:
        cat = q["category"]
        counts[cat] = counts.get(cat, 0) + 1
    sorted_categories = sorted(
        [{"name": cat, "count": count} for cat, count in counts.items()],
        key=lambda x: x["name"],
    )
    return jsonify(sorted_categories)


@app.route("/api/authors")
def get_authors():
    quotes = load_quotes()
    counts = {}
    for q in quotes:
        auth = q["author"]
        counts[auth] = counts.get(auth, 0) + 1
    sorted_authors = sorted(
        [{"name": auth, "count": count} for auth, count in counts.items()],
        key=lambda x: x["name"],
    )
    return jsonify(sorted_authors)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
