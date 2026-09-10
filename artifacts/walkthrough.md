# Walkthrough: Famous Quotes Web Application

We have implemented a responsive web application that curates and displays 100 well-known quotes, built using **Python Flask**, Astral's **`uv`**, and plain vanilla **HTML / CSS / JavaScript**.

---

## 1. Accomplishments

### Project Setup with `uv`
- Initialized project inside `/Users/cryptoyorkie/agy-cli-projects/famous-quotes` using `uv`.
- Configured dependencies in [`pyproject.toml`](file:///Users/cryptoyorkie/agy-cli-projects/famous-quotes/pyproject.toml): `flask >= 3.1.3`, `pytest >= 9.1.1`.
- Configured pytest runner with `pythonpath = ["."]`.

### Curated Dataset
- Created [`quotes.json`](file:///Users/cryptoyorkie/agy-cli-projects/famous-quotes/quotes.json) containing exactly 100 famous, verified quotes with sequential IDs `1` to `100`.
- Categorized across 7 disciplines: **Science**, **Philosophy**, **Technology**, **Literature**, **Leadership**, **Art**, and **Wisdom**.

### Flask Backend API
- Built [`app.py`](file:///Users/cryptoyorkie/agy-cli-projects/famous-quotes/app.py) with endpoints:
  - `GET /`: Serves the single-page application.
  - `GET /api/quotes/random`: Serves a random quote, with optional `?category=...` or `?author=...`.
  - `GET /api/quotes`: Query matching against keywords, author, and category.
  - `GET /api/categories`: Returns all categories and quote counts.
  - `GET /api/authors`: Returns all unique authors and quote counts.

### Vanilla Frontend & Major UX Enhancements
- **HTML**: [`templates/index.html`](file:///Users/cryptoyorkie/agy-cli-projects/famous-quotes/templates/index.html) semantic layout.
- **CSS**: [`static/css/style.css`](file:///Users/cryptoyorkie/agy-cli-projects/famous-quotes/static/css/style.css) featuring:
  - **Dark / Light Mode Toggle**: Smooth switch overriding CSS `:root` variables (`--bg-main`, `--text-primary`, `--accent-primary`, etc.) with preference persistence in `localStorage`.
  - **Dynamic Card Styling**: Category-specific color accents and hover transitions.
  - **Search Highlighting (`<mark class="highlight">`)**: Matched keywords pop out visibly.
  - **Floating "Back to Top" Button**: Appears smoothly after scrolling down > 350px.
- **JavaScript**: [`static/js/app.js`](file:///Users/cryptoyorkie/agy-cli-projects/famous-quotes/static/js/app.js):
  - **Favorites System**: Save/remove quotes to personal collection via heart icons (♡ / ♥) stored in `localStorage`, plus a dedicated `♥ Favorites` filter tab and counter badge.
  - **Keyboard Shortcuts**:
    - <kbd>Space</kbd> or <kbd>R</kbd>: Roll a new quote instantly.
    - <kbd>/</kbd>: Jump directly to search input.
    - <kbd>Esc</kbd>: Clear search, dismiss alerts, or blur inputs.
  - **Interactive Empty State**: Popular topic suggestion chips (*Einstein*, *Courage*, *Technology*, *Dream*, *Truth*) to jump-start searches when zero results match.
  - **Dice Roll Animation**: Spinning 3D rotation on random roll.
  - **Accessibility**: `aria-live="polite"` screen reader announcements and `:focus-visible` navigation outlines.

---

## 2. Verification & Validation

### Automated Tests (`pytest`)
All 11 unit and integration tests passed cleanly:

```bash
uv run pytest -v
```

```
============================= test session starts ==============================
platform darwin -- Python 3.12.14, pytest-9.1.1, pluggy-1.6.0
rootdir: /Users/cryptoyorkie/agy-cli-projects/famous-quotes
configfile: pyproject.toml
collected 11 items

tests/test_app.py::test_quotes_file_contains_exact_100_valid_quotes PASSED [  9%]
tests/test_app.py::test_index_page PASSED                                [ 18%]
tests/test_app.py::test_random_quote_endpoint PASSED                     [ 27%]
tests/test_app.py::test_random_quote_with_category_filter PASSED         [ 36%]
tests/test_app.py::test_random_quote_nonexistent_category PASSED         [ 45%]
tests/test_app.py::test_get_all_quotes PASSED                            [ 54%]
tests/test_app.py::test_search_quotes_by_query PASSED                    [ 63%]
tests/test_app.py::test_search_quotes_by_author PASSED                   [ 72%]
tests/test_app.py::test_search_quotes_by_category PASSED                 [ 81%]
tests/test_app.py::test_get_categories_endpoint PASSED                   [ 90%]
tests/test_app.py::test_get_authors_endpoint PASSED                      [100%]

============================== 11 passed in 0.08s ==============================
```

---

## 3. How to Run the App

From the project root (`/Users/cryptoyorkie/agy-cli-projects/famous-quotes`):

```bash
uv run python app.py
```

Then open your browser to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.
