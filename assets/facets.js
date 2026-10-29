/**
 * CodyUI Fashion — AJAX Collection Facets & Live Grid Column Switcher (facets.js)
 */
class CodyFacetsManager {
  constructor() {
    this.gridStorageKey = 'cody_collection_grid_cols';
    this.init();
  }

  async fetchAndRenderSection(searchParams) {
    const container = document.getElementById('CodyCollectionProductGridContainer');
    if (!container) return;

    const sectionId = container.dataset.sectionId;
    container.style.opacity = '0.5';
    container.style.pointerEvents = 'none';

    const url = `${window.location.pathname}?section_id=${sectionId}&${searchParams}`;
    const browserUrl = `${window.location.pathname}${searchParams ? `?${searchParams}` : ''}`;

    try {
      const res = await fetch(url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newGrid = doc.getElementById('CodyCollectionProductGridContainer');
      if (newGrid) {
        container.innerHTML = newGrid.innerHTML;
      }

      const newDrawerBody = doc.getElementById('CodyFacetDrawerBody');
      const currentDrawerBody = document.getElementById('CodyFacetDrawerBody');
      if (newDrawerBody && currentDrawerBody) {
        currentDrawerBody.innerHTML = newDrawerBody.innerHTML;
      }

      window.history.pushState({ searchParams }, '', browserUrl);
      this.applySavedGridColumns();
      if (window.CodyStore) window.CodyStore.syncUI();
    } catch (e) {
      window.location.href = browserUrl;
    } finally {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
    }
  }

  serializeForm(form) {
    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, val] of formData.entries()) {
      if (val !== '') {
        params.append(key, val);
      }
    }
    return params.toString();
  }

  applySavedGridColumns(cols = null) {
    const grid = document.getElementById('CodyProductGridList');
    if (!grid) return;
    const targetCols = cols || sessionStorage.getItem(this.gridStorageKey);
    if (!targetCols) return;

    grid.classList.remove('cody-grid--2', 'cody-grid--3', 'cody-grid--4', 'cody-grid--5');
    grid.classList.add(`cody-grid--${targetCols}`);

    document.querySelectorAll('[data-grid-cols]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.gridCols === String(targetCols));
    });
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.applySavedGridColumns();
    });

    document.addEventListener(
      'change',
      window.debounce((event) => {
        const facetForm = event.target.closest('[data-facets-form]');
        if (facetForm) {
          const searchParams = this.serializeForm(facetForm);
          this.fetchAndRenderSection(searchParams);
        }
      }, 250)
    );

    document.addEventListener('click', (event) => {
      const removeLink = event.target.closest('[data-facet-remove]');
      if (removeLink) {
        event.preventDefault();
        const url = new URL(removeLink.href, window.location.origin);
        this.fetchAndRenderSection(url.searchParams.toString());
        return;
      }

      const gridBtn = event.target.closest('[data-grid-cols]');
      if (gridBtn) {
        event.preventDefault();
        const cols = gridBtn.dataset.gridCols;
        sessionStorage.setItem(this.gridStorageKey, cols);
        this.applySavedGridColumns(cols);
      }
    });
  }
}

window.CodyFacets = new CodyFacetsManager();
