/**
 * CodyUI Fashion — Instant AJAX Predictive Search Component
 * Queries Shopify's Predictive Search Section Rendering API and caches results.
 */
class CodyPredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.cachedResults = {};
    this.input = this.querySelector('input[type="search"]');
    this.resultsContainer = this.querySelector('[data-predictive-search-results]');
    this.trendingContainer = this.querySelector('[data-predictive-search-trending]');
    this.resetButton = this.querySelector('[data-search-reset]');
  }

  connectedCallback() {
    if (!this.input) return;

    this.input.addEventListener(
      'input',
      window.debounce((event) => {
        this.onChange(event);
      }, 260)
    );

    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.input.value = '';
        this.input.focus();
        this.closeResults();
      });
    }

    this.querySelectorAll('[data-trending-pill]').forEach((pill) => {
      pill.addEventListener('click', (event) => {
        event.preventDefault();
        this.input.value = pill.dataset.trendingPill;
        this.input.dispatchEvent(new Event('input'));
      });
    });
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const searchTerm = this.getQuery();
    if (this.resetButton) {
      this.resetButton.hidden = searchTerm.length === 0;
    }

    if (!searchTerm.length) {
      this.closeResults();
      return;
    }

    this.getSearchResults(searchTerm);
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(/\s+/g, '-').toLowerCase();
    this.setAttribute('loading', 'true');

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    const searchUrl = `${window.routes.predictive_search_url}?q=${encodeURIComponent(
      searchTerm
    )}&resources[type]=product,collection,article,page&resources[limit]=6&section_id=predictive-search`;

    fetch(searchUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) => {
        const parsed = new DOMParser().parseFromString(text, 'text/html');
        const sectionMarkup = parsed.querySelector('#shopify-section-predictive-search');
        const html = sectionMarkup ? sectionMarkup.innerHTML : text;
        this.cachedResults[queryKey] = html;
        this.renderSearchResults(html);
      })
      .catch(() => {
        this.removeAttribute('loading');
      });
  }

  renderSearchResults(resultsMarkup) {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = resultsMarkup;
      this.resultsContainer.hidden = false;
    }
    if (this.trendingContainer) {
      this.trendingContainer.hidden = true;
    }
    this.removeAttribute('loading');
  }

  closeResults() {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '';
      this.resultsContainer.hidden = true;
    }
    if (this.trendingContainer) {
      this.trendingContainer.hidden = false;
    }
  }
}

if (!customElements.get('cody-predictive-search')) {
  customElements.define('cody-predictive-search', CodyPredictiveSearch);
}
