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
    favorites: new Set(),
    showOnlyFavorites: false,
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
    btnFavoriteFeatured: document.getElementById('btn-favorite-featured'),
    btnCopyFeatured: document.getElementById('btn-copy-featured'),
    
    // Header Stats & Controls
    statsBadge: document.getElementById('stats-badge'),
    categoryCountBadge: document.getElementById('category-count-badge'),
    btnFavoritesToggle: document.getElementById('btn-favorites-toggle'),
    favoritesCount: document.getElementById('favorites-count'),
    themeToggle: document.getElementById('theme-toggle'),

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
    emptyTitle: document.getElementById('empty-title'),
    emptyDescription: document.getElementById('empty-description'),
    emptySuggestions: document.getElementById('empty-suggestions'),
    btnEmptyReset: document.getElementById('btn-empty-reset'),

    // Floating Back to Top
    btnBackToTop: document.getElementById('btn-back-to-top'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
  };

  // --- Theme Management ---
  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      // Ignore if localStorage unavailable
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // Ignore if localStorage unavailable
    }
  }

  function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const nextTheme = isLight ? 'dark' : 'light';
    applyTheme(nextTheme);
  }

  // --- Favorites Management ---
  function loadFavorites() {
    try {
      const stored = localStorage.getItem('favorite_quotes');
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) {
          state.favorites = new Set(ids);
        }
      }
    } catch (e) {
      console.warn('Failed to parse favorites from localStorage:', e);
    }
    updateFavoritesUI();
  }

  function saveFavorites() {
    try {
      localStorage.setItem('favorite_quotes', JSON.stringify(Array.from(state.favorites)));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage:', e);
    }
    updateFavoritesUI();
  }

  function toggleFavorite(id) {
    if (!id) return;
    id = Number(id);
    const isFav = state.favorites.has(id);
    if (isFav) {
      state.favorites.delete(id);
      showToast('Removed from favorites');
    } else {
      state.favorites.add(id);
      showToast('Added to favorites! ♥');
    }
    saveFavorites();

    // Re-filter if viewing favorites catalog
    if (state.showOnlyFavorites) {
      fetchCatalogQuotes();
    } else {
      // Update individual card if in view
      updateCardFavoriteButton(id);
    }
  }

  function updateFavoritesUI() {
    if (el.favoritesCount) {
      el.favoritesCount.textContent = state.favorites.size;
    }
    if (el.btnFavoritesToggle) {
      el.btnFavoritesToggle.classList.toggle('active', state.showOnlyFavorites);
    }
    updateHeroFavoriteButton();
  }

  function updateHeroFavoriteButton() {
    if (!el.btnFavoriteFeatured || !state.currentRandomQuote) return;
    const isFav = state.favorites.has(Number(state.currentRandomQuote.id));
    el.btnFavoriteFeatured.classList.toggle('active', isFav);
    el.btnFavoriteFeatured.innerHTML = isFav 
      ? '<span class="fav-icon-hero">♥</span> Favorited'
      : '<span class="fav-icon-hero">♡</span> Favorite';
  }

  function updateCardFavoriteButton(id) {
    const btn = document.querySelector(`.btn-card-fav[data-id="${id}"]`);
    if (btn) {
      const isFav = state.favorites.has(Number(id));
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav ? '♥' : '♡';
      btn.title = isFav ? 'Remove from favorites' : 'Save to favorites';
    }
  }

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

  // --- Search Highlighting Helper ---
  function highlightMatch(text, query) {
    if (!query || !query.trim()) return escapeHtml(text);
    const safeText = escapeHtml(text);
    const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return safeText.replace(regex, '<mark class="highlight">$1</mark>');
  }

  // --- API Calls ---

  // 1. Fetch random quote
  async function fetchRandomQuote(category = '') {
    try {
      el.btnRoll.disabled = true;
      el.featuredQuoteText.style.opacity = '0.4';

      // Dice animation
      const dice = el.btnRoll.querySelector('.dice-icon');
      if (dice) {
        dice.classList.add('rolling');
        setTimeout(() => dice.classList.remove('rolling'), 500);
      }

      let url = '/api/quotes/random';
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch quote');
      const quote = await res.json();

      state.currentRandomQuote = quote;
      renderFeaturedQuote(quote);
      updateHeroFavoriteButton();
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
    allChip.className = `chip ${state.activeCategory === '' && !state.showOnlyFavorites ? 'active' : ''}`;
    allChip.textContent = 'All Categories';
    allChip.addEventListener('click', () => {
      state.showOnlyFavorites = false;
      setCategoryFilter('');
    });
    el.categoryChips.appendChild(allChip);

    categories.forEach((cat) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `chip ${state.activeCategory.toLowerCase() === cat.name.toLowerCase() && !state.showOnlyFavorites ? 'active' : ''}`;
      chip.textContent = `${cat.name}`;
      chip.addEventListener('click', () => {
        state.showOnlyFavorites = false;
        setCategoryFilter(cat.name);
      });
      el.categoryChips.appendChild(chip);
    });

    // Add Favorites Chip
    const favChip = document.createElement('button');
    favChip.type = 'button';
    favChip.className = `chip ${state.showOnlyFavorites ? 'active' : ''}`;
    favChip.innerHTML = `♥ Favorites (${state.favorites.size})`;
    favChip.addEventListener('click', toggleFavoritesFilter);
    el.categoryChips.appendChild(favChip);
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

      let quotes = data.quotes;
      if (state.showOnlyFavorites) {
        quotes = quotes.filter((q) => state.favorites.has(Number(q.id)));
      }

      renderCatalog(quotes, data.total);
    } catch (err) {
      console.error(err);
    }
  }

  // Render Catalog Grid
  function renderCatalog(quotes, totalCount) {
    const totalLabel = state.showOnlyFavorites ? `${quotes.length} favorites` : `${totalCount || 100} quotes`;
    el.resultsCount.textContent = `Showing ${quotes.length} of ${totalLabel}`;

    if (!quotes || quotes.length === 0) {
      el.quotesGrid.innerHTML = '';
      el.emptyState.classList.remove('hidden');

      if (state.showOnlyFavorites) {
        el.emptyTitle.textContent = 'No favorite quotes yet';
        el.emptyDescription.textContent = 'Click the heart icon (♡) on any quote to save it to your personal collection.';
        if (el.emptySuggestions) el.emptySuggestions.classList.add('hidden');
      } else {
        el.emptyTitle.textContent = 'No quotes found';
        el.emptyDescription.textContent = 'Try adjusting your search terms or clearing your filters.';
        if (el.emptySuggestions) el.emptySuggestions.classList.remove('hidden');
      }
      return;
    }

    el.emptyState.classList.add('hidden');
    el.quotesGrid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    quotes.forEach((q) => {
      const card = document.createElement('article');
      card.className = 'quote-card';

      const catClass = getCategoryClass(q.category);
      const isFav = state.favorites.has(Number(q.id));

      const highlightedQuote = highlightMatch(q.quote, state.searchQuery);
      const highlightedAuthor = highlightMatch(q.author, state.searchQuery);

      card.innerHTML = `
        <blockquote class="card-body">
          "${highlightedQuote}"
        </blockquote>
        <div class="card-footer">
          <div class="card-author-info">
            <span class="card-author" title="Filter by ${escapeHtml(q.author)}">${highlightedAuthor}</span>
            <span class="category-pill ${catClass}" title="Filter by ${escapeHtml(q.category)}">${escapeHtml(q.category)}</span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-card-fav ${isFav ? 'active' : ''}" data-id="${q.id}" title="${isFav ? 'Remove from favorites' : 'Save to favorites'}">
              ${isFav ? '♥' : '♡'}
            </button>
            <button type="button" class="btn-card-copy" title="Copy quote">
              📋 Copy
            </button>
          </div>
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
        state.showOnlyFavorites = false;
        setCategoryFilter(q.category);
      });

      // Favorite button
      const favBtn = card.querySelector('.btn-card-fav');
      favBtn.addEventListener('click', () => {
        toggleFavorite(q.id);
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

  function toggleFavoritesFilter() {
    state.showOnlyFavorites = !state.showOnlyFavorites;
    updateFavoritesUI();
    renderCategoryChips(state.categories);
    fetchCatalogQuotes();
  }

  function resetAllFilters() {
    state.searchQuery = '';
    state.activeCategory = '';
    state.activeAuthor = '';
    state.showOnlyFavorites = false;

    el.searchInput.value = '';
    el.filterCategory.value = '';
    el.filterAuthor.value = '';
    el.btnClearSearch.classList.remove('visible');

    updateFavoritesUI();
    renderCategoryChips(state.categories);
    fetchCatalogQuotes();
  }

  // --- Keyboard Shortcuts ---
  function handleKeyDown(e) {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Press Escape to clear search or hide toast
    if (e.key === 'Escape') {
      if (el.searchInput.value) {
        el.searchInput.value = '';
        state.searchQuery = '';
        el.btnClearSearch.classList.remove('visible');
        fetchCatalogQuotes();
      }
      if (el.toast) el.toast.classList.add('hidden');
      if (isInput) document.activeElement.blur();
      return;
    }

    // Ignore other shortcuts when user is actively typing in a form field
    if (isInput) return;

    // Press '/' to search
    if (e.key === '/') {
      e.preventDefault();
      el.searchInput.focus();
      return;
    }

    // Press Space or 'R' / 'r' to roll a new quote
    if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      fetchRandomQuote(el.randomCatSelect.value);
    }
  }

  // --- Event Listeners ---
  function initEventListeners() {
    // Roll Quote Button
    el.btnRoll.addEventListener('click', () => {
      const selectedCat = el.randomCatSelect.value;
      fetchRandomQuote(selectedCat);
    });

    // Hero Favorite Button
    if (el.btnFavoriteFeatured) {
      el.btnFavoriteFeatured.addEventListener('click', () => {
        if (state.currentRandomQuote) {
          toggleFavorite(state.currentRandomQuote.id);
          updateHeroFavoriteButton();
        }
      });
    }

    // Favorites Header Toggle Badge
    if (el.btnFavoritesToggle) {
      el.btnFavoritesToggle.addEventListener('click', toggleFavoritesFilter);
    }

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
        state.showOnlyFavorites = false;
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
      state.showOnlyFavorites = false;
      setCategoryFilter(e.target.value);
    });

    // Filter Author Select Change
    el.filterAuthor.addEventListener('change', (e) => {
      setAuthorFilter(e.target.value);
    });

    // Reset Filters Buttons
    el.btnResetFilters.addEventListener('click', resetAllFilters);
    el.btnEmptyReset.addEventListener('click', resetAllFilters);

    // Empty State Suggestions Chips
    const suggestionChips = document.querySelectorAll('.sug-chip');
    suggestionChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const keyword = chip.dataset.keyword;
        if (keyword) {
          el.searchInput.value = keyword;
          state.searchQuery = keyword;
          el.btnClearSearch.classList.add('visible');
          fetchCatalogQuotes();
        }
      });
    });

    // Floating Back to Top Button
    if (el.btnBackToTop) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 350) {
          el.btnBackToTop.classList.remove('hidden');
        } else {
          el.btnBackToTop.classList.add('hidden');
        }
      });

      el.btnBackToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyDown);

    // Theme Toggle Switch
    if (el.themeToggle) {
      el.themeToggle.addEventListener('click', toggleTheme);
    }
  }

  // --- Initialization ---
  async function init() {
    applyTheme(getPreferredTheme());
    loadFavorites();
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
