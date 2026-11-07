import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const project = fileURLToPath(new URL('../', import.meta.url));
const siteUrl = 'https://adrian120401.github.io/Hobbignity/';
const template = await readFile(path.join(project, 'src/index.html'), 'utf8');
const english = JSON.parse(await readFile(path.join(project, 'locales/en.json'), 'utf8'));
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const decodeHtml = value => value.replace(/&(?:amp|quot|lt|gt|copy|times);/g, entity => ({
  '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&copy;': '©', '&times;': '×'
})[entity]);
const neutral = /^(?:HOBBIGNITY|Hobbignity|E-Commerce for a decent life|Gaming|Gaming & eSports|Xbox Adaptive Controller Base Pro|AbleGamers|Makers Making Change|Geni|CC BY-SA 4\.0|SKU: .+|#HBN-\d+|0\.3 N|Español|English|contacto@hobbignity\.org)$/;

function translate(html) {
  const missing = new Set();
  const lookup = (raw, required = false) => {
    const text = decodeHtml(raw).trim().replace(/\s+/g, ' ');
    if (Object.hasOwn(english, text)) {
      return raw.replace(/\S[\s\S]*\S|\S/, escapeHtml(english[text]));
    }
    if (required && /[\p{L}]/u.test(text) && !neutral.test(text) && !text.includes('{{')) missing.add(text);
    return raw;
  };
  // Translate text and human-readable attributes, preserving markup, IDs and script bodies.
  const translated = html.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>|[^<]+/g, token => {
    if (token.startsWith('<!--') || token.startsWith('<script')) return token;
    if (token.startsWith('<')) {
      return token.replace(/(\b(?:alt|aria-label|placeholder|content)=")([^"]*)(")/g,
        (_, before, value, after) => before + lookup(value, !before.startsWith('content')) + after);
    }
    return lookup(token, true);
  });
  if (missing.size) throw new Error(`Missing English translations:\n${[...missing].join('\n')}`);
  return translated;
}

for (const route of ['', 'es', 'en']) {
  const language = route === 'en' ? 'en' : 'es';
  const prefix = route ? '../' : '';
  const values = {
    language,
    siteUrl,
    pageUrl: `${siteUrl}${language}/`,
    locale: language === 'es' ? 'es_UY' : 'en_US',
    alternateLocale: language === 'es' ? 'en_US' : 'es_UY',
    redirectScript: route ? '' : '<script src="language-redirect.js"></script>',
    esHref: `${prefix}es/`,
    enHref: `${prefix}en/`,
    esCurrent: language === 'es' ? 'aria-current="page"' : '',
    enCurrent: language === 'en' ? 'aria-current="page"' : ''
  };
  let html = language === 'en' ? translate(template) : template;
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Unknown template variable: ${key}`);
    return values[key];
  });
  html = html.replace(/(\b(?:src|href)=")(assets\/|styles\.css|app\.js)/g, `$1${prefix}$2`);
  await mkdir(path.join(project, route), { recursive: true });
  await writeFile(path.join(project, route, 'index.html'), html);
}
console.log('Generated index.html, es/index.html and en/index.html.');
