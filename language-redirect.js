// Only loaded at the site root; explicit /es/ and /en/ URLs never redirect.
(() => {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  const language = preferred
    .map(value => String(value).toLowerCase().split(/[-_]/)[0])
    .find(value => value === 'es' || value === 'en') ?? 'es';
  const destination = new URL(`./${language}/`, window.location.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
})();
