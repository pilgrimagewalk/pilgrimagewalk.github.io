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
  var I18N_DICT = {};

  function getPreferredLanguage() {
    var testLanguage = (document.documentElement.getAttribute('data-test-lang') || '').toLowerCase();
    if (testLanguage) {
      var testBaseTag = testLanguage.split('-')[0];
      if (SUPPORTED_LANGUAGES.indexOf(testBaseTag) !== -1) {
        return testBaseTag;
      }
    }

    var candidates = [];

    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      candidates = candidates.concat(navigator.languages);
    }

    if (navigator.language) {
      candidates.push(navigator.language);
    }

    var htmlLanguage = (document.documentElement.lang || '').toLowerCase();
    if (htmlLanguage) {
      candidates.push(htmlLanguage);
    }

    for (var i = 0; i < candidates.length; i += 1) {
      var rawTag = (candidates[i] || '').toLowerCase();
      if (!rawTag) continue;

      var baseTag = rawTag.split('-')[0];
      if (SUPPORTED_LANGUAGES.indexOf(baseTag) !== -1) {
        return baseTag;
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
        if (!response.ok) {
          throw new Error('Translation load failed for language: ' + language);
        }
        return response.json().then(function (dictionary) {
          return { language: language, dictionary: dictionary };
        });
      })
      .catch(function () {
        if (language === 'en') {
          return null;
        }

        return fetch('assets/i18n/en.json')
          .then(function (response) {
            if (!response.ok) {
              throw new Error('English translation fallback failed');
            }
            return response.json().then(function (dictionary) {
              return { language: 'en', dictionary: dictionary };
            });
          })
          .catch(function () {
            return null;
          });
      })
      .then(function (result) {
        if (result && result.dictionary) {
          I18N_DICT = result.dictionary;
          window.I18N_DICT = result.dictionary;
          window.I18N_LANG = result.language;
          applyTranslations(result.dictionary);
          document.documentElement.lang = result.language;
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
      });
  }

  function setupMapButton() {
    var btn = document.getElementById('loadMapBtn');
    var frame = document.getElementById('mapFrame');
    var frameWrap = document.getElementById('mapFrameWrap');
    var loadingIndicator = document.getElementById('mapLoadingIndicator');

    if (!btn || !frame || !frameWrap) return;

    frame.addEventListener('load', function () {
      if (loadingIndicator) {
        loadingIndicator.classList.add('d-none');
      }
    });

    btn.addEventListener('click', function () {
      var previewWrap = btn.closest('.ratio');
      if (previewWrap) previewWrap.classList.add('d-none');

      btn.disabled = true;
      frame.src = frame.getAttribute('data-src');
      frameWrap.classList.remove('d-none');

      if (loadingIndicator) {
        loadingIndicator.classList.remove('d-none');
      }
    });
  }

  function setCurrentYear() {
    var year = document.getElementById('currentYear');
    if (year) {
      year.textContent = new Date().getFullYear();
    }
  }

  function getTranslation(key, fallback) {
    if (I18N_DICT && Object.prototype.hasOwnProperty.call(I18N_DICT, key) && I18N_DICT[key]) {
      return I18N_DICT[key];
    }
    return fallback || '';
  }

  function updateActiveShrine(shrineId) {
    var elements = document.querySelectorAll('#shrines .map-marker[data-shrine]');

    elements.forEach(function (element) {
      var isActive = element.getAttribute('data-shrine') === shrineId;
      element.classList.toggle('is-active', isActive);
    });
  }

  var activeShrinePanelAnchor = null;
  var SHRINE_PANEL_HIDE_RADIUS = 86;

  function hideShrinePanel() {
    var panel = document.getElementById('shrinePanel');
    if (panel) {
      panel.classList.add('d-none');
      panel.style.top = '';
      panel.style.left = '';
    }
    activeShrinePanelAnchor = null;
    updateActiveShrine('');
  }

  function positionShrinePanel(anchorElement) {
    var panel = document.getElementById('shrinePanel');
    var mapWrap = document.querySelector('#shrines .shrines-map-wrap');

    if (!panel || !mapWrap || !anchorElement) return;

    var markerRect = anchorElement.getBoundingClientRect();
    var wrapRect = mapWrap.getBoundingClientRect();

    var markerCenterX = markerRect.left - wrapRect.left + (markerRect.width / 2);
    var markerCenterY = markerRect.top - wrapRect.top + (markerRect.height / 2);

    var horizontalOffset = 16;
    var verticalOffset = 14;

    var panelWidth = panel.offsetWidth;
    var panelHeight = panel.offsetHeight;

    var desiredLeft = markerCenterX + horizontalOffset;
    var desiredTop = markerCenterY - panelHeight - verticalOffset;

    var minLeft = 8;
    var minTop = 8;
    var maxLeft = Math.max(minLeft, wrapRect.width - panelWidth - 8);
    var maxTop = Math.max(minTop, wrapRect.height - panelHeight - 8);

    var clampedLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
    var clampedTop = Math.min(Math.max(desiredTop, minTop), maxTop);

    panel.style.left = clampedLeft + 'px';
    panel.style.top = clampedTop + 'px';
  }

  var activeVisitPromptAnchor = null;

  function hideShrineVisitPrompt() {
    var prompt = document.getElementById('shrineVisitPrompt');
    if (prompt) {
      prompt.classList.add('d-none');
      prompt.style.top = '';
      prompt.style.left = '';
      prompt.setAttribute('data-url', '');
    }
    activeVisitPromptAnchor = null;
  }

  function positionShrineVisitPrompt(anchorElement) {
    var prompt = document.getElementById('shrineVisitPrompt');
    var mapWrap = document.querySelector('#shrines .shrines-map-wrap');

    if (!prompt || !mapWrap || !anchorElement) return;

    var markerRect = anchorElement.getBoundingClientRect();
    var wrapRect = mapWrap.getBoundingClientRect();

    var markerCenterX = markerRect.left - wrapRect.left + (markerRect.width / 2);
    var markerCenterY = markerRect.top - wrapRect.top + (markerRect.height / 2);

    var horizontalOffset = 14;
    var verticalOffset = 12;

    var promptWidth = prompt.offsetWidth;
    var promptHeight = prompt.offsetHeight;

    var desiredLeft = markerCenterX + horizontalOffset;
    var desiredTop = markerCenterY + verticalOffset;

    var minLeft = 8;
    var minTop = 8;
    var maxLeft = Math.max(minLeft, wrapRect.width - promptWidth - 8);
    var maxTop = Math.max(minTop, wrapRect.height - promptHeight - 8);

    prompt.style.left = Math.min(Math.max(desiredLeft, minLeft), maxLeft) + 'px';
    prompt.style.top = Math.min(Math.max(desiredTop, minTop), maxTop) + 'px';
  }

  function ensureShrineVisitPrompt() {
    var existingPrompt = document.getElementById('shrineVisitPrompt');
    if (existingPrompt) {
      return existingPrompt;
    }

    var mapWrap = document.querySelector('#shrines .shrines-map-wrap');
    if (!mapWrap) return null;

    var prompt = document.createElement('div');
    prompt.id = 'shrineVisitPrompt';
    prompt.className = 'shrine-visit-prompt d-none';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-label', 'Visit shrine website');
    prompt.innerHTML = [
      '<p class="shrine-visit-prompt-text">Visit Shrine Website?</p>',
      '<div class="shrine-visit-prompt-actions">',
      '<button type="button" class="btn btn-primary btn-sm" data-shrine-visit="yes">Yes</button>',
      '<button type="button" class="btn btn-outline-secondary btn-sm" data-shrine-visit="no">No</button>',
      '</div>'
    ].join('');

    prompt.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      var action = event.target.closest('[data-shrine-visit]');
      if (!action) return;

      if (action.getAttribute('data-shrine-visit') === 'yes') {
        var url = prompt.getAttribute('data-url');
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }

      hideShrineVisitPrompt();
    });

    mapWrap.appendChild(prompt);
    return prompt;
  }

  function renderPlaceholderPanel() {
    var panelTitle = document.getElementById('shrinePanelTitle');
    var panelFlag = document.getElementById('shrinePanelFlag');
    var panelImg = document.getElementById('shrinePanelImg');
    var panelInfo1 = document.getElementById('shrinePanelInfo1');
    var panelInfo2 = document.getElementById('shrinePanelInfo2');

    if (!panelTitle || !panelInfo1 || !panelInfo2 || !panelImg || !panelFlag) return;

    panelTitle.textContent = 'Shrine Info';
    panelFlag.classList.add('d-none');
    panelFlag.src = '';
    panelFlag.alt = '';

    panelImg.classList.add('d-none');
    panelImg.src = '';
    panelImg.alt = '';

    panelInfo1.textContent = getTranslation('shrine_panel_placeholder', 'Click a shrine on the map to view information.');
    panelInfo2.classList.add('d-none');
    panelInfo2.textContent = '';

    hideShrinePanel();
  }

  function renderShrinePanel(shrineId, anchorElement) {
    if (!SHRINE_META || !Object.prototype.hasOwnProperty.call(SHRINE_META, shrineId)) {
      return;
    }

    var meta = SHRINE_META[shrineId] || {};

    var panelTitle = document.getElementById('shrinePanelTitle');
    var panelFlag = document.getElementById('shrinePanelFlag');
    var panelImg = document.getElementById('shrinePanelImg');
    var panelInfo1 = document.getElementById('shrinePanelInfo1');
    var panelInfo2 = document.getElementById('shrinePanelInfo2');

    if (!panelTitle || !panelInfo1 || !panelInfo2 || !panelImg || !panelFlag) return;

    var name = getTranslation('shrine_' + shrineId + '_name', meta.fallbackName || '');
    var info1 = getTranslation('shrine_' + shrineId + '_info1', '');
    var info2 = getTranslation('shrine_' + shrineId + '_info2', '');

    panelTitle.textContent = name;
    panelInfo1.textContent = info1;

    if (info2) {
      panelInfo2.textContent = info2;
      panelInfo2.classList.remove('d-none');
    } else {
      panelInfo2.textContent = '';
      panelInfo2.classList.add('d-none');
    }

    if (meta.flag) {
      panelFlag.src = meta.flag;
      panelFlag.alt = meta.country ? meta.country + ' flag' : '';
      panelFlag.classList.remove('d-none');
    } else {
      panelFlag.classList.add('d-none');
      panelFlag.src = '';
      panelFlag.alt = '';
    }

    if (meta.image) {
      panelImg.src = meta.image;
      panelImg.alt = name || meta.fallbackName || '';
      panelImg.classList.remove('d-none');
    } else {
      panelImg.src = '';
      panelImg.alt = '';
      panelImg.classList.add('d-none');
    }

    updateActiveShrine(shrineId);
    activeShrinePanelAnchor = anchorElement;

    var panel = document.getElementById('shrinePanel');
    if (panel) {
      panel.classList.remove('d-none');
      positionShrinePanel(anchorElement);
    }
  }

  function initShrineInteractions() {
    var shrineElements = document.querySelectorAll('#shrines .map-marker[data-shrine]');
    var mapWrap = document.querySelector('#shrines .shrines-map-wrap');

    function showShrinePanelForElement(element) {
      if (!SHRINE_META) {
        return;
      }

      var shrineId = element.getAttribute('data-shrine');
      if (!shrineId || !Object.prototype.hasOwnProperty.call(SHRINE_META, shrineId)) {
        return;
      }

      renderShrinePanel(shrineId, element);
    }

    function showVisitPromptForElement(element) {
      if (!SHRINE_META) {
        return;
      }

      var shrineId = element.getAttribute('data-shrine');
      if (!shrineId || !Object.prototype.hasOwnProperty.call(SHRINE_META, shrineId)) {
        return;
      }

      var meta = SHRINE_META[shrineId] || {};
      var shrineUrl = meta.url || element.href;
      var prompt = ensureShrineVisitPrompt();

      if (!prompt || !shrineUrl) return;

      activeVisitPromptAnchor = element;
      prompt.setAttribute('data-url', shrineUrl);
      prompt.classList.remove('d-none');
      positionShrineVisitPrompt(element);
    }

    shrineElements.forEach(function (element) {
      element.addEventListener('mouseenter', function () {
        showShrinePanelForElement(element);
      });

      element.addEventListener('focus', function () {
        showShrinePanelForElement(element);
      });

      element.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        hideShrinePanel();
        showVisitPromptForElement(element);
      });
    });

    if (mapWrap) {
      mapWrap.addEventListener('mousemove', function (event) {
        var panel = document.getElementById('shrinePanel');
        if (!activeShrinePanelAnchor || !panel || panel.classList.contains('d-none')) {
          return;
        }

        if (event.target.closest('.map-marker')) {
          return;
        }

        var markerRect = activeShrinePanelAnchor.getBoundingClientRect();
        var markerCenterX = markerRect.left + (markerRect.width / 2);
        var markerCenterY = markerRect.top + (markerRect.height / 2);
        var distanceX = event.clientX - markerCenterX;
        var distanceY = event.clientY - markerCenterY;
        var distance = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));

        if (distance > SHRINE_PANEL_HIDE_RADIUS) {
          hideShrinePanel();
        }
      });

      mapWrap.addEventListener('mouseleave', function () {
        hideShrinePanel();
      });

      mapWrap.addEventListener('click', function (event) {
        if (event.target.closest('.map-marker') || event.target.closest('#shrinePanel') || event.target.closest('#shrineVisitPrompt')) {
          return;
        }
        hideShrineVisitPrompt();
        hideShrinePanel();
      });
    }

    window.addEventListener('resize', function () {
      var activeShrine = document.querySelector('#shrines .map-marker.is-active');
      var panel = document.getElementById('shrinePanel');
      if (activeShrine && panel && !panel.classList.contains('d-none')) {
        positionShrinePanel(activeShrine);
      }

      var prompt = document.getElementById('shrineVisitPrompt');
      if (activeVisitPromptAnchor && prompt && !prompt.classList.contains('d-none')) {
        positionShrineVisitPrompt(activeVisitPromptAnchor);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMapButton();
    setCurrentYear();

    loadTranslations()
      .then(function () {
        return loadShrineMeta();
      })
      .then(function () {
        initShrineInteractions();
        renderPlaceholderPanel();
      })
      .catch(function () {
        renderPlaceholderPanel();
      });
  });
})();
