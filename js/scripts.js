/*
 * Site interactions
 */
(function () {
  var SUPPORTED_LANGUAGES = [
    'en', 'de', 'es', 'fr', 'hr', 'hu', 'it', 'lt', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'uk'
  ];

  function getPreferredLanguage() {
    var testLanguage = (document.documentElement.getAttribute('data-test-lang') || '').toLowerCase();
    if (testLanguage) {
      var testBaseTag = testLanguage.split('-')[0];
      if (SUPPORTED_LANGUAGES.indexOf(testBaseTag) !== -1) {
        return testBaseTag;
      }
    }

    var candidates = [];

    var htmlLanguage = (document.documentElement.lang || '').toLowerCase();
    if (htmlLanguage) {
      candidates.push(htmlLanguage);
    }

    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      candidates = candidates.concat(navigator.languages);
    }

    if (navigator.language) {
      candidates.push(navigator.language);
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
      element.textContent = dictionary[key];
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
          applyTranslations(result.dictionary);
          document.documentElement.lang = result.language;
        }
      });
  }

  function setupMapButton() {
    var btn = document.getElementById('loadMapBtn');
    var frame = document.getElementById('mapFrame');
    var frameWrap = document.getElementById('mapFrameWrap');

    if (!btn || !frame || !frameWrap) return;

    btn.addEventListener('click', function () {
      var previewWrap = btn.closest('.ratio');
      if (previewWrap) previewWrap.classList.add('d-none');

      frame.src = frame.getAttribute('data-src');
      frameWrap.classList.remove('d-none');
      frame.focus();
    });
  }

  function setCurrentYear() {
    var year = document.getElementById('currentYear');
    if (year) {
      year.textContent = new Date().getFullYear();
    }
  }

  function setupKoFiWidget() {
    if (typeof window.kofiwidget2 === 'undefined') return;

    var labelElement = document.querySelector('[data-i18n="buy_me_a_coffee"]');
    var label = labelElement ? labelElement.textContent.trim() : 'Buy me a coffee';

    window.kofiwidget2.init(label || 'Buy me a coffee', '#72a4f2', 'V7V01RJ83L');
    window.kofiwidget2.draw();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMapButton();
    setCurrentYear();
    loadTranslations().then(function () {
      setupKoFiWidget();
    });
  });
})();
