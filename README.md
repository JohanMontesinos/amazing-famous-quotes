# Wisdom Deck — 100 Famous Quotes Web Application

A responsive web application built with **Python Flask**, **Vanilla JavaScript**, and **HTML5/CSS3** to explore, search, and discover 100 timeless quotes across Science, Philosophy, Technology, Literature, Leadership, Art, and Wisdom.

## Features

- **Hero "Quote of the Moment"**:
  - Displays a random famous quote with category badge and author.
  - "🎲 Roll New Quote" button to quickly draw a new quote.
  - Category selector to limit random rolls to specific topics.
  - "📋 Copy" button to quickly copy formatted quotes with author attribution.
- **Dynamic Search & Filtering**:
  - Full-text search matching keywords across quotes, authors, and categories.
  - Filter dropdown by Category (Science, Philosophy, Technology, Literature, Leadership, Art, Wisdom).
  - Filter dropdown by Author.
  - Quick-select category chip pills.
  - Live result count (`Showing X of 100 quotes`).
  - Clear/reset filters in one click.
- **Interactive Catalog**:
  - Responsive grid cards showing each quote, author, category badge, and copy button.
  - Click any author or category tag on a card to instantly filter the catalog.
- **Zero Heavy Frontend Dependencies**:
  - Written in plain vanilla JavaScript (no npm build step, no React/Vue required).
  - Clean, dark-mode-first aesthetic with Google Fonts (`Cinzel`, `Lora`, `Inter`).
- **Python Environment via `uv`**:
  - Fast dependency resolution and environment management using Astral's `uv`.

---

## Getting Started

### Prerequisites

- [uv](https://docs.astral.sh/uv/) installed on your machine (`brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`).

### Running the Application

1. From the project directory (`famous-quotes/`), run:
   ```bash
   uv run python app.py
   ```
   Or via Flask CLI:
   ```bash
   uv run flask --app app run --port 5000
   ```

2. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Serves the single-page application UI |
| `/api/quotes/random` | `GET` | Returns a random quote. Supports optional `?category=...` or `?author=...` |
| `/api/quotes` | `GET` | Returns quotes filtered by `?q=...`, `?category=...`, or `?author=...` |
| `/api/categories` | `GET` | Returns list of all categories and their quote counts |
| `/api/authors` | `GET` | Returns list of all unique authors and their quote counts |

---

## Running Automated Tests

Run the test suite with `pytest` using `uv`:

```bash
uv run pytest -v
```

All 11 tests will run, validating:
- Dataset integrity (100 quotes, valid IDs 1–100, no empty fields).
- All REST API endpoints and query filters.
- UI template delivery.
