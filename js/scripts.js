/*
 * Site interactions
 */
(function () {
  var SUPPORTED_LANGUAGES = [
    'en', 'cs', 'da', 'de', 'el', 'es', 'fr',
    'hr', 'hu', 'it', 'lt', 'mt',
    'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv',
    'uk', 'bg', 'sr',
    'et', 'fi', 'lv', 'no', 'tr'
  ];

  var SHRINE_META = null;
  var SHRINE_IDS = [];
  var SHRINE_INDEX_BY_ID = {};
  var SHRINE_MARKERS = {};
  var I18N_DICT = {};
  var ACTIVE_SHRINE_ID = null;
  var PANEL_ELEMENTS = null;

  function getPreferredLanguage() {
    var testLanguage = (document.documentElement.getAttribute('data-test-lang') || '').toLowerCase();
    if (testLanguage) {
      var testBaseTag = testLanguage.split('-')[0];
      if (SUPPORTED_LANGUAGES.indexOf(testBaseTag) !== -1) {
        return testBaseTag;
      }
    }

    var candidates = [].concat(navigator.languages || [], [navigator.language, document.documentElement.lang]);

    for (var i = 0; i < candidates.length; i++) {
      var tag = (candidates[i] || '').toLowerCase().split('-')[0];
      if (SUPPORTED_LANGUAGES.indexOf(tag) !== -1) {
        return tag;
      }
    }

    return 'en';
  }

  function applyTranslations(dictionary) {
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function (element) {
      var key = element.getAttribute('data-i18n');
      if (!key || !Object.prototype.hasOwnProperty.call(dictionary, key)) return;

      var value = dictionary[key];
      if (element.getAttribute('data-i18n-lines') === 'words') {
        element.innerHTML = value.trim().split(/\s+/).join('<br>');
        return;
      }
      element.textContent = value;
    });
  }

  function loadTranslations() {
    var language = getPreferredLanguage();

    return fetch('assets/i18n/' + language + '.json')
      .then(function (response) {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .catch(function () {
        if (language === 'en') return null;
        return fetch('assets/i18n/en.json').then(function (res) {
          return res.ok ? res.json() : null;
        });
      })
      .then(function (dict) {
        if (dict) {
          I18N_DICT = dict;
          window.I18N_DICT = dict;
          window.I18N_LANG = language;
          applyTranslations(dict);
          document.documentElement.lang = language;
        }
      });
  }

  function loadShrineMeta() {
    return fetch('assets/shrines/index.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Shrine metadata load failed');
        }
        return response.json();
      })
      .then(function (data) {
        SHRINE_META = data;
        SHRINE_IDS = Object.keys(data).sort();
        SHRINE_INDEX_BY_ID = {};
        SHRINE_IDS.forEach(function (shrineId, index) {
          SHRINE_INDEX_BY_ID[shrineId] = index;
        });
      });
  }

  function setupAutoMapLoad() {
    var placeholder = document.getElementById('mapPlaceholder');
    var frame = document.getElementById('mapFrame');
    var frameWrap = document.getElementById('mapFrameWrap');
    var loadingIndicator = document.getElementById('mapLoadingIndicator');

    if (!placeholder || !frame || !frameWrap) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Start loading the map
          frame.src = frame.getAttribute('data-src');
          placeholder.classList.add('d-none');
          frameWrap.classList.remove('d-none');
          if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
          }
          // Once we've started loading, we can stop observing
          observer.unobserve(placeholder);
        }
      });
    }, { rootMargin: '200px' }); // Start loading 200px before it comes into view

    frame.addEventListener('load', function () {
      if (loadingIndicator) {
        loadingIndicator.classList.add('d-none');
      }
    });

    observer.observe(placeholder);
  }

  function getTranslation(key, fallback) {
    if (I18N_DICT && Object.prototype.hasOwnProperty.call(I18N_DICT, key) && I18N_DICT[key]) {
      return I18N_DICT[key];
    }
    return fallback || '';
  }

  function getSortedShrineIds() {
    return SHRINE_IDS;
  }

  function getNextShrineId(currentShrineId) {
    var shrineIds = getSortedShrineIds();
    if (!shrineIds.length) return null;

    var currentIndex = Object.prototype.hasOwnProperty.call(SHRINE_INDEX_BY_ID, currentShrineId)
      ? SHRINE_INDEX_BY_ID[currentShrineId]
      : -1;
    if (currentIndex === -1) {
      return shrineIds[0];
    }

    return shrineIds[(currentIndex + 1) % shrineIds.length];
  }


  function renderShrineSiteLinks() {
    var list = document.getElementById('shrineSiteList');
    if (!list || !SHRINE_META) {
      return;
    }

    list.innerHTML = '';

    var fragment = document.createDocumentFragment();

    SHRINE_IDS.forEach(function (shrineId) {
      var meta = SHRINE_META[shrineId] || {};
      if (!meta.url) {
        return;
      }

      var link = document.createElement('a');
      link.className = 'shrine-site-link';
      link.href = '#'; // Use # as we handle the click in initShrineInteractions
      link.setAttribute('data-shrine-link', shrineId);

      var chipLabel = meta.fallbackName || shrineId;
      var accessibleName = getTranslation('shrine_' + shrineId + '_name', meta.fallbackName || chipLabel);
      link.setAttribute('aria-label', accessibleName + ' info');

      if (meta.flag) {
        var flag = document.createElement('img');
        flag.className = 'shrine-site-flag';
        flag.src = meta.flag;
        flag.alt = '';
        link.appendChild(flag);
      }

      var label = document.createElement('span');
      label.className = 'shrine-site-label';
      label.textContent = chipLabel;
      link.appendChild(label);

      fragment.appendChild(link);
    });

    list.appendChild(fragment);
  }

  function getPanelElements() {
    if (PANEL_ELEMENTS) {
      return PANEL_ELEMENTS;
    }

    PANEL_ELEMENTS = {
      title: document.getElementById('shrinePanelTitle'),
      flag: document.getElementById('shrinePanelFlag'),
      img: document.getElementById('shrinePanelImg'),
      info1: document.getElementById('shrinePanelInfo1'),
      info2: document.getElementById('shrinePanelInfo2'),
      btn: document.getElementById('shrinePanelBtn'),
      next: document.getElementById('shrinePanelNext')
    };

    return PANEL_ELEMENTS;
  }

  function updateMarkerHighlight(shrineId) {
    var shrineIds = getSortedShrineIds();

    if (!shrineIds.length) return;

    shrineIds.forEach(function (id) {
      var element = SHRINE_MARKERS[id];
      if (!element) return;

      var isActive = element.getAttribute('data-shrine') === shrineId;
      element.classList.toggle('is-active', isActive);
    });
  }

  function updateActiveShrine(shrineId) {
    updateMarkerHighlight(shrineId);
  }

  function renderPlaceholderPanel() {
    var panel = getPanelElements();

    if (!panel.title || !panel.info1 || !panel.info2 || !panel.img || !panel.flag || !panel.btn) return;

    panel.title.textContent = getTranslation('shrine_panel_placeholder_title', 'Shrine Info');
    panel.flag.classList.add('d-none');
    panel.flag.src = '';
    panel.flag.alt = '';

    panel.img.classList.add('d-none');
    panel.img.src = '';
    panel.img.alt = '';

    panel.info1.textContent = getTranslation('shrine_panel_placeholder', 'Click a shrine to view information.');
    panel.info2.classList.add('d-none');
    panel.info2.textContent = '';

    panel.btn.classList.add('d-none');
  }

  function renderShrinePanel(shrineId, anchorElement) {
    if (!SHRINE_META || !Object.prototype.hasOwnProperty.call(SHRINE_META, shrineId)) {
      return;
    }

    var meta = SHRINE_META[shrineId] || {};
    ACTIVE_SHRINE_ID = shrineId;

    var panel = getPanelElements();

    if (!panel.title || !panel.info1 || !panel.info2 || !panel.img || !panel.flag || !panel.btn || !panel.next) return;

    var name = getTranslation('shrine_' + shrineId + '_name', meta.fallbackName || '');
    var info1 = getTranslation('shrine_' + shrineId + '_info1', '');
    var info2 = getTranslation('shrine_' + shrineId + '_info2', '');

    panel.title.textContent = name;
    panel.info1.textContent = info1;

    if (info2) {
      panel.info2.textContent = info2;
      panel.info2.classList.remove('d-none');
    } else {
      panel.info2.textContent = '';
      panel.info2.classList.add('d-none');
    }

    if (meta.flag) {
      panel.flag.src = meta.flag;
      panel.flag.alt = meta.country ? meta.country + ' flag' : '';
      panel.flag.classList.remove('d-none');
    } else {
      panel.flag.classList.add('d-none');
      panel.flag.src = '';
      panel.flag.alt = '';
    }

    if (meta.photo) {
      panel.img.src = meta.photo;
      panel.img.alt = name || meta.fallbackName || '';
      panel.img.classList.remove('d-none');
    } else {
      panel.img.src = '';
      panel.img.alt = '';
      panel.img.classList.add('d-none');
    }

    if (meta.url) {
      panel.btn.href = meta.url;
      panel.btn.setAttribute('aria-label', getTranslation('shrine_panel_visit_site', 'Visit website') + ': ' + name);
      panel.btn.setAttribute('title', getTranslation('shrine_panel_visit_site', 'Visit website') + ': ' + name);
      panel.btn.classList.remove('d-none');
    } else {
      panel.btn.classList.add('d-none');
    }

    var nextShrineId = getNextShrineId(shrineId);
    if (nextShrineId) {
      panel.next.disabled = false;
      panel.next.setAttribute('data-next-shrine', nextShrineId);
      panel.next.setAttribute('aria-label', 'Next shrine: ' + (getTranslation('shrine_' + nextShrineId + '_name', SHRINE_META[nextShrineId].fallbackName || nextShrineId)));
    } else {
      panel.next.disabled = true;
      panel.next.removeAttribute('data-next-shrine');
      panel.next.setAttribute('aria-label', 'Next shrine');
    }

    updateActiveShrine(shrineId);
  }

  function initShrineInteractions() {
    var shrineElements = Array.prototype.slice.call(document.querySelectorAll('#shrines .map-marker[data-shrine]'));

    function showShrinePanelForElement(element) {
      if (!SHRINE_META) return;
      var shrineId = element.getAttribute('data-shrine');
      if (!shrineId || !Object.prototype.hasOwnProperty.call(SHRINE_META, shrineId)) return;
      renderShrinePanel(shrineId, element);
    }

    shrineElements.forEach(function (element) {
      var shrineId = element.getAttribute('data-shrine');
      if (shrineId) {
        SHRINE_MARKERS[shrineId] = element;
      }

      element.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showShrinePanelForElement(element);
      });
    });

    // Handle clicks on chips (shrineSiteList is rendered dynamically)
    var siteList = document.getElementById('shrineSiteList');
    if (siteList) {
      siteList.addEventListener('click', function (event) {
        var link = event.target.closest('[data-shrine-link]');
        if (link) {
          event.preventDefault();
          event.stopPropagation();
          var shrineId = link.getAttribute('data-shrine-link');
          renderShrinePanel(shrineId, link);
        }
      });
    }

    var panelNext = document.getElementById('shrinePanelNext');
    if (panelNext) {
      panelNext.addEventListener('click', function () {
        var nextShrineId = panelNext.getAttribute('data-next-shrine') || getNextShrineId(ACTIVE_SHRINE_ID);
        if (!nextShrineId) return;
        renderShrinePanel(nextShrineId);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupAutoMapLoad();

    Promise.all([loadTranslations(), loadShrineMeta()])
      .then(function () {
        renderShrineSiteLinks();
        initShrineInteractions();
        renderShrinePanel('04');
      })
      .catch(function () {
        renderPlaceholderPanel();
      });
  });
})();
