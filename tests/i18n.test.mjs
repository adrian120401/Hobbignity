import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const project = new URL('../', import.meta.url);
const redirect = await readFile(new URL('language-redirect.js', project), 'utf8');
const pages = Object.fromEntries(await Promise.all(['', 'es/', 'en/'].map(async route =>
  [route, await readFile(new URL(`${route}index.html`, project), 'utf8')]
)));

function detect(url, languages, language) {
  const location = new URL(url);
  let destination;
  vm.runInNewContext(redirect, {
    URL,
    navigator: { languages, language },
    window: { location: { href: location.href, search: location.search, hash: location.hash,
      replace: value => { destination = value; } } }
  });
  return destination;
}

test('root detects supported languages, regional variants and Spanish fallback', () => {
  for (const [languages, expected] of [
    [['es-UY', 'en-US'], 'es'],
    [['en-GB', 'es'], 'en'],
    [['fr-FR', 'en-US'], 'en'],
    [['pt-BR', 'fr'], 'es'],
    [['EN-us'], 'en'],
    [[], 'es']
  ]) {
    assert.equal(detect('https://example.com/Hobbignity/', languages), `https://example.com/Hobbignity/${expected}/`);
  }
  assert.equal(detect('https://example.com/', undefined, 'en-US'), 'https://example.com/en/');
});

test('redirect preserves deployment subdirectory, query and section', () => {
  assert.equal(detect('https://example.com/Hobbignity/index.html?campaign=test#main-catalog', ['en']),
    'https://example.com/Hobbignity/en/?campaign=test#main-catalog');
});

test('explicit locale routes never load the automatic redirect', () => {
  assert.match(pages[''], /<script src="language-redirect\.js"><\/script>/);
  for (const route of ['es/', 'en/']) assert.doesNotMatch(pages[route], /language-redirect\.js/);
  assert.match(pages[''], /<html lang="es">/);
});

test('both languages have complete static content, accessible controls and locale SEO', () => {
  for (const language of ['es', 'en']) {
    const page = pages[`${language}/`];
    assert.match(page, new RegExp(`<html lang="${language}">`));
    assert.match(page, new RegExp(`<link rel="canonical" href="https://adrian120401.github.io/Hobbignity/${language}/"`));
    assert.match(page, new RegExp(`<option value="../${language}/" lang="${language}" selected>`));
    assert.match(page, new RegExp(`src="../assets/flags/${language}\\.svg"`));
    assert.equal((page.match(/class="product-card"/g) ?? []).length, 5);
    for (const other of ['es', 'en']) {
      assert.match(page, new RegExp(`hreflang="${other}" href="https://adrian120401.github.io/Hobbignity/${other}/"`));
    }
    assert.match(page, /hreflang="x-default" href="https:\/\/adrian120401.github.io\/Hobbignity\/es\/"/);
    const schema = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.url, `https://adrian120401.github.io/Hobbignity/${language}/`);
    assert.doesNotMatch(page, /\{\{\w+\}\}/);
  }
  const english = pages['en/'];
  assert.match(english, /Leisure without barriers, independence guaranteed\./);
  assert.match(english, /aria-label="Accessibility settings"/);
  assert.match(english, /aria-label="Decrease quantity by one"/);
  assert.match(english, /placeholder="Search products"/);
  assert.match(english, /Demo Order Successful!/);
  assert.match(english, /<meta property="og:locale" content="en_US"/);
  // Ignore comments and technical IDs when checking for Spanish content leaks.
  const content = english.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(content, /Añadir|Carrito|productos|Correo Electrónico|Tu cesta|Todos los Productos/);
});

test('assets, language links and section anchors resolve on all generated pages', async () => {
  for (const [route, page] of Object.entries(pages)) {
    const pageUrl = new URL(`${route}index.html`, project);
    const ids = new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const [, value] of page.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|data:)/.test(value)) continue;
      if (value.startsWith('#')) {
        if (value.length > 1) assert.ok(ids.has(value.slice(1)), `Missing anchor: ${value}`);
        continue;
      }
      const resource = new URL(value, pageUrl);
      await access(value.endsWith('/') ? new URL('index.html', resource) : resource);
    }
  }
});
