// ====== Meta 标签自动替换 ======
import type { BrandConfig } from '../types.js';

export function injectMeta(brand: BrandConfig) {
  if (typeof document === 'undefined') return;

  const { name, shortName } = brand.brand;
  document.title = name;

  // Open Graph
  setMetaProperty('og:title', name);
  setMetaProperty('og:site_name', name);
  setMetaProperty('og:description', `Powered by ${name}`);

  // Twitter
  setMetaName('twitter:title', name);
  setMetaName('twitter:description', `Powered by ${name}`);

  // 通用 description
  setMetaName('description', `${shortName} — ${name}`);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.content = content;
}
