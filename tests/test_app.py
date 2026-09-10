import json
from pathlib import Path
import pytest
from app import app, load_quotes, QUOTES_FILE


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_quotes_file_contains_exact_100_valid_quotes():
    """Verify that quotes.json contains exactly 100 well-formed quotes."""
    assert QUOTES_FILE.exists(), "quotes.json must exist"
    quotes = load_quotes()
    assert len(quotes) == 100, f"Expected 100 quotes, found {len(quotes)}"

    ids = set()
    for q in quotes:
        assert "id" in q and isinstance(q["id"], int), "Quote must have an integer ID"
        assert "quote" in q and len(q["quote"].strip()) > 0, "Quote text must not be empty"
        assert "author" in q and len(q["author"].strip()) > 0, "Author must not be empty"
        assert "category" in q and len(q["category"].strip()) > 0, "Category must not be empty"
        assert q["id"] not in ids, f"Duplicate quote ID found: {q['id']}"
        ids.add(q["id"])

    assert ids == set(range(1, 101)), "Quote IDs must be sequential integers from 1 to 100"


def test_index_page(client):
    """Verify that the home route serves the HTML page."""
    res = client.get("/")
    assert res.status_code == 200
    assert b"Wisdom Deck" in res.data
    assert b"Quote of the Moment" in res.data
    assert b"search-input" in res.data


def test_random_quote_endpoint(client):
    """Verify the random quote endpoint returns a valid quote."""
    res = client.get("/api/quotes/random")
    assert res.status_code == 200
    data = res.get_json()
    assert "id" in data
    assert "quote" in data
    assert "author" in data
    assert "category" in data


def test_random_quote_with_category_filter(client):
    """Verify filtering random quotes by category."""
    res = client.get("/api/quotes/random?category=Science")
    assert res.status_code == 200
    data = res.get_json()
    assert data["category"] == "Science"


def test_random_quote_nonexistent_category(client):
    """Verify that an invalid filter returns a 404."""
    res = client.get("/api/quotes/random?category=NonExistentCategoryXYZ")
    assert res.status_code == 404
    data = res.get_json()
    assert "error" in data


def test_get_all_quotes(client):
    """Verify retrieving all quotes returns total = 100."""
    res = client.get("/api/quotes")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] == 100
    assert len(data["quotes"]) == 100


def test_search_quotes_by_query(client):
    """Verify searching quotes by keyword."""
    res = client.get("/api/quotes?q=intelligent")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] > 0
    # Alan Turing quote or Darwin quote
    found = any("intelligent" in q["quote"].lower() for q in data["quotes"])
    assert found


def test_search_quotes_by_author(client):
    """Verify searching quotes by author."""
    res = client.get("/api/quotes?author=Turing")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] >= 2
    for q in data["quotes"]:
        assert "turing" in q["author"].lower()


def test_search_quotes_by_category(client):
    """Verify filtering quotes by category."""
    res = client.get("/api/quotes?category=Philosophy")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] > 0
    for q in data["quotes"]:
        assert q["category"] == "Philosophy"


def test_get_categories_endpoint(client):
    """Verify categories summary endpoint."""
    res = client.get("/api/categories")
    assert res.status_code == 200
    cats = res.get_json()
    assert isinstance(cats, list)
    assert len(cats) >= 5
    total_quotes_in_cats = sum(c["count"] for c in cats)
    assert total_quotes_in_cats == 100


def test_get_authors_endpoint(client):
    """Verify authors summary endpoint."""
    res = client.get("/api/authors")
    assert res.status_code == 200
    authors = res.get_json()
    assert isinstance(authors, list)
    assert len(authors) > 20
    total_quotes_in_authors = sum(a["count"] for a in authors)
    assert total_quotes_in_authors == 100
