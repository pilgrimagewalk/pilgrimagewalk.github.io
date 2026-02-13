/*
 * Site interactions
 */
(function () {
  var SUPPORTED_LANGUAGES = [
    'en', 'de', 'es', 'fr', 'hr', 'hu', 'it', 'lt', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'uk'
  ];

  function toSupportedBaseLanguage(tag) {
    var normalizedTag = (tag || '').toLowerCase();
    if (!normalizedTag) return null;

    var baseTag = normalizedTag.split('-')[0];
    if (SUPPORTED_LANGUAGES.indexOf(baseTag) !== -1) {
      return baseTag;
    }

    return null;
  }

  function getLanguageOverride() {
    var urlParams = new URLSearchParams(window.location.search);
    var queryLang = toSupportedBaseLanguage(urlParams.get('lang'));
    if (queryLang) return queryLang;

    var htmlAttrLang = toSupportedBaseLanguage(document.documentElement.getAttribute('data-test-lang'));
    if (htmlAttrLang) return htmlAttrLang;

    return null;
  }

  function getPreferredLanguage() {
    var overriddenLanguage = getLanguageOverride();
    if (overriddenLanguage) {
      return overriddenLanguage;
    }

    var candidates = [];

    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      candidates = candidates.concat(navigator.languages);
    }

    if (navigator.language) {
      candidates.push(navigator.language);
    }

    for (var i = 0; i < candidates.length; i += 1) {
      var supportedLanguage = toSupportedBaseLanguage(candidates[i]);
      if (supportedLanguage) {
        return supportedLanguage;
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

  document.addEventListener('DOMContentLoaded', function () {
    setupMapButton();
    setCurrentYear();
    loadTranslations();
  });
})();
