/**
 * Wisdom Deck - Plain Vanilla JavaScript Application
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    currentRandomQuote: null,
    categories: [],
    authors: [],
    activeCategory: '',
    activeAuthor: '',
    searchQuery: '',
    debounceTimer: null,
  };

  // --- Category Color Helper ---
  function getCategoryClass(category) {
    if (!category) return '';
    const norm = category.toLowerCase();
    switch (norm) {
      case 'science': return 'cat-science';
      case 'philosophy': return 'cat-philosophy';
      case 'technology': return 'cat-technology';
      case 'literature': return 'cat-literature';
      case 'leadership': return 'cat-leadership';
      case 'art': return 'cat-art';
      case 'wisdom': return 'cat-wisdom';
      default: return '';
    }
  }

  // --- DOM Elements ---
  const el = {
    // Featured Hero
    featuredQuoteText: document.getElementById('featured-quote-text'),
    featuredQuoteAuthor: document.getElementById('featured-quote-author'),
    featuredQuoteCategory: document.getElementById('featured-quote-category'),
    randomCatSelect: document.getElementById('random-cat-select'),
    btnRoll: document.getElementById('btn-roll'),
    btnCopyFeatured: document.getElementById('btn-copy-featured'),
    
    // Header Stats
    statsBadge: document.getElementById('stats-badge'),
    categoryCountBadge: document.getElementById('category-count-badge'),

    // Search & Filter
    searchInput: document.getElementById('search-input'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    filterCategory: document.getElementById('filter-category'),
    filterAuthor: document.getElementById('filter-author'),
    btnResetFilters: document.getElementById('btn-reset-filters'),
    categoryChips: document.getElementById('category-chips'),
    resultsCount: document.getElementById('results-count'),

    // Catalog
    quotesGrid: document.getElementById('quotes-grid'),
    emptyState: document.getElementById('empty-state'),
    btnEmptyReset: document.getElementById('btn-empty-reset'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
  };

  // --- Toast Notification ---
  let toastTimeout = null;
  function showToast(message) {
    if (!el.toast) return;
    el.toastMessage.textContent = message;
    el.toast.classList.remove('hidden');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.toast.classList.add('hidden');
    }, 2500);
  }

  // --- Clipboard Copy ---
  async function copyToClipboard(quoteText, quoteAuthor) {
    const formatted = `"${quoteText}" — ${quoteAuthor}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formatted);
      } else {
        // Fallback for non-https / older browsers
        const textarea = document.createElement('textarea');
        textarea.value = formatted;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Quote copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy quote: ', err);
      showToast('Could not copy to clipboard');
    }
  }

  // --- API Calls ---

  // 1. Fetch random quote
  async function fetchRandomQuote(category = '') {
    try {
      el.btnRoll.disabled = true;
      el.featuredQuoteText.style.opacity = '0.4';

      let url = '/api/quotes/random';
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch quote');
      const quote = await res.json();

      state.currentRandomQuote = quote;
      renderFeaturedQuote(quote);
    } catch (err) {
      console.error(err);
      el.featuredQuoteText.textContent = 'Could not load quote. Please try again.';
      el.featuredQuoteAuthor.textContent = '';
      el.featuredQuoteCategory.textContent = '';
    } finally {
      el.btnRoll.disabled = false;
      el.featuredQuoteText.style.opacity = '1';
    }
  }

  // Render Hero Quote
  function renderFeaturedQuote(quote) {
    el.featuredQuoteText.textContent = `"${quote.quote}"`;
    el.featuredQuoteAuthor.textContent = `— ${quote.author}`;
    el.featuredQuoteCategory.textContent = quote.category;

    // Apply colored category class
    el.featuredQuoteCategory.className = `category-pill ${getCategoryClass(quote.category)}`;
  }

  // 2. Fetch categories
  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      const categories = await res.json();
      state.categories = categories;

      if (el.categoryCountBadge) {
        el.categoryCountBadge.textContent = `${categories.length} Categories`;
      }

      // Populate Hero Category Select
      el.randomCatSelect.innerHTML = '<option value="">Any Category</option>';
      categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = `${cat.name} (${cat.count})`;
        el.randomCatSelect.appendChild(opt);
      });

      // Populate Filter Category Select
      el.filterCategory.innerHTML = '<option value="">All Categories</option>';
      categories.forEach((cat) => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = `${cat.name} (${cat.count})`;
        el.filterCategory.appendChild(opt);
      });

      // Render Category Chips
      renderCategoryChips(categories);
    } catch (err) {
      console.error(err);
    }
  }

  // Render Category Chips
  function renderCategoryChips(categories) {
    el.categoryChips.innerHTML = '';

    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `chip ${state.activeCategory === '' ? 'active' : ''}`;
    allChip.textContent = 'All Categories';
    allChip.addEventListener('click', () => setCategoryFilter(''));
    el.categoryChips.appendChild(allChip);

    categories.forEach((cat) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `chip ${state.activeCategory.toLowerCase() === cat.name.toLowerCase() ? 'active' : ''}`;
      chip.textContent = `${cat.name}`;
      chip.addEventListener('click', () => setCategoryFilter(cat.name));
      el.categoryChips.appendChild(chip);
    });
  }

  // 3. Fetch Authors
  async function fetchAuthors() {
    try {
      const res = await fetch('/api/authors');
      if (!res.ok) throw new Error('Failed to load authors');
      const authors = await res.json();
      state.authors = authors;

      el.filterAuthor.innerHTML = '<option value="">All Authors</option>';
      authors.forEach((auth) => {
        const opt = document.createElement('option');
        opt.value = auth.name;
        opt.textContent = `${auth.name} (${auth.count})`;
        el.filterAuthor.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // 4. Fetch Quotes Catalog with Filters
  async function fetchCatalogQuotes() {
    try {
      const params = new URLSearchParams();
      if (state.searchQuery) params.append('q', state.searchQuery);
      if (state.activeCategory) params.append('category', state.activeCategory);
      if (state.activeAuthor) params.append('author', state.activeAuthor);

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load quotes');
      const data = await res.json();

      renderCatalog(data.quotes, data.total);
    } catch (err) {
      console.error(err);
    }
  }

  // Render Catalog Grid
  function renderCatalog(quotes, totalCount) {
    el.resultsCount.textContent = `Showing ${quotes.length} of ${totalCount || 100} quotes`;

    if (!quotes || quotes.length === 0) {
      el.quotesGrid.innerHTML = '';
      el.emptyState.classList.remove('hidden');
      return;
    }

    el.emptyState.classList.add('hidden');
    el.quotesGrid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    quotes.forEach((q) => {
      const card = document.createElement('article');
      card.className = 'quote-card';

      const catClass = getCategoryClass(q.category);

      card.innerHTML = `
        <blockquote class="card-body">
          "${escapeHtml(q.quote)}"
        </blockquote>
        <div class="card-footer">
          <div class="card-author-info">
            <span class="card-author" title="Filter by ${escapeHtml(q.author)}">${escapeHtml(q.author)}</span>
            <span class="category-pill ${catClass}" title="Filter by ${escapeHtml(q.category)}">${escapeHtml(q.category)}</span>
          </div>
          <button type="button" class="btn-card-copy" title="Copy quote">
            📋 Copy
          </button>
        </div>
      `;

      // Author click -> filter by author
      const authorSpan = card.querySelector('.card-author');
      authorSpan.addEventListener('click', () => {
        setAuthorFilter(q.author);
      });

      // Category pill click -> filter by category
      const catSpan = card.querySelector('.category-pill');
      catSpan.addEventListener('click', () => {
        setCategoryFilter(q.category);
      });

      // Copy button
      const copyBtn = card.querySelector('.btn-card-copy');
      copyBtn.addEventListener('click', () => {
        copyToClipboard(q.quote, q.author);
      });

      fragment.appendChild(card);
    });

    el.quotesGrid.appendChild(fragment);
  }

  // --- Helper: HTML Escape ---
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Filter State Setters ---
  function setCategoryFilter(category) {
    state.activeCategory = category;
    el.filterCategory.value = category;

    // Update chips active state
    renderCategoryChips(state.categories);
    fetchCatalogQuotes();
  }

  function setAuthorFilter(author) {
    state.activeAuthor = author;
    el.filterAuthor.value = author;
    fetchCatalogQuotes();
  }

  function resetAllFilters() {
    state.searchQuery = '';
    state.activeCategory = '';
    state.activeAuthor = '';

    el.searchInput.value = '';
    el.filterCategory.value = '';
    el.filterAuthor.value = '';
    el.btnClearSearch.classList.remove('visible');

    renderCategoryChips(state.categories);
    fetchCatalogQuotes();
  }

  // --- Event Listeners ---
  function initEventListeners() {
    // Roll Quote Button
    el.btnRoll.addEventListener('click', () => {
      const selectedCat = el.randomCatSelect.value;
      fetchRandomQuote(selectedCat);
    });

    // Hero category dropdown change -> immediately roll a quote from that category
    el.randomCatSelect.addEventListener('change', (e) => {
      fetchRandomQuote(e.target.value);
    });

    // Copy Featured Quote
    el.btnCopyFeatured.addEventListener('click', () => {
      if (state.currentRandomQuote) {
        copyToClipboard(state.currentRandomQuote.quote, state.currentRandomQuote.author);
      }
    });

    // Featured Category Pill Click -> filter catalog by category
    el.featuredQuoteCategory.addEventListener('click', () => {
      if (state.currentRandomQuote && state.currentRandomQuote.category) {
        setCategoryFilter(state.currentRandomQuote.category);
        el.filterCategory.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Search Input (Debounced)
    el.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      state.searchQuery = query;

      if (query.length > 0) {
        el.btnClearSearch.classList.add('visible');
      } else {
        el.btnClearSearch.classList.remove('visible');
      }

      if (state.debounceTimer) clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(() => {
        fetchCatalogQuotes();
      }, 250);
    });

    // Clear Search Button
    el.btnClearSearch.addEventListener('click', () => {
      el.searchInput.value = '';
      state.searchQuery = '';
      el.btnClearSearch.classList.remove('visible');
      fetchCatalogQuotes();
      el.searchInput.focus();
    });

    // Filter Category Select Change
    el.filterCategory.addEventListener('change', (e) => {
      setCategoryFilter(e.target.value);
    });

    // Filter Author Select Change
    el.filterAuthor.addEventListener('change', (e) => {
      setAuthorFilter(e.target.value);
    });

    // Reset Filters Buttons
    el.btnResetFilters.addEventListener('click', resetAllFilters);
    el.btnEmptyReset.addEventListener('click', resetAllFilters);
  }

  // --- Initialization ---
  async function init() {
    initEventListeners();
    await Promise.all([
      fetchCategories(),
      fetchAuthors(),
      fetchRandomQuote(),
      fetchCatalogQuotes(),
    ]);
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
