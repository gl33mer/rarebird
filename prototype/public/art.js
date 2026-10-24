// RAREBIRD art loader — manifest-driven, fail-soft (RUN: flash/art-qa-v1).
// If anything here fails, call sites keep the emoji/gradients fallback.
// Gated by ?art=1 or localStorage rarebird-art=1 (see index.html wiring).
const V = new URL(import.meta.url).searchParams.get('v') || '0';

let MANIFEST = null;
let themeId = 'dusk-birds'; // internal manifest key

function themeKey(id) { return id === 'cosmos' ? 'cosmic-voyage' : 'dusk-birds'; }

export const ART = {
  enabled: false,

  async init(enabled) {
    this.enabled = !!enabled;
    if (!this.enabled) return false;
    try {
      const res = await fetch(`/assets/manifest.json?v=${V}`);
      if (!res.ok) throw new Error('manifest ' + res.status);
      MANIFEST = await res.json();
      if (!MANIFEST?.themes) throw new Error('manifest shape');
      return true;
    } catch (e) {
      console.warn('[art] fail-soft:', e.message);
      MANIFEST = null; this.enabled = false;
      return false;
    }
  },

  setTheme(id) { themeId = themeKey(id); },
  currentTheme() { return themeId; },

  // cache-busted URL for a manifest-relative path, or null
  url(rel) {
    if (!MANIFEST || !rel) return null;
    return `/assets/${rel}?v=${V}`;
  },

  // tier sprite for the ACTIVE theme ('RARE BIRD' with space = canonical key)
  tier(name) {
    const t = MANIFEST?.themes?.[themeId]?.tiers?.[name];
    return this.url(t?.sprite);
  },
  tierExtra(name) {
    const t = MANIFEST?.themes?.[themeId]?.tiers?.[name];
    return this.url(t?.extraSprite);
  },
  flavor(name) {
    return MANIFEST?.themes?.[themeId]?.tiers?.[name]?.flavor ?? null;
  },

  ambient(key) {
    const a = MANIFEST?.themes?.[themeId]?.ambient ?? {};
    const v = a[key];
    return Array.isArray(v) ? v.map(x => this.url(x)) : this.url(v);
  },
  countdownArt() { return this.url(MANIFEST?.themes?.[themeId]?.ambient?.countdown); },
  podiumArt(i) { return this.url(MANIFEST?.themes?.[themeId]?.podium?.[i]); },
  burstArt() { return this.url(MANIFEST?.themes?.[themeId]?.burst); },
  logo() { return this.url(MANIFEST?.themes?.[themeId]?.logo); },

  icon(name) {
    const map = { chat: 'chat', muteOn: 'muteOn', muteOff: 'muteOff', wager: 'wager', share: 'share', report: 'report', crown: 'crown' };
    return this.url(MANIFEST?.shared?.icons?.[map[name] ?? name]);
  },
  chip() { return this.url(MANIFEST?.shared?.tierChip); },
  emptyPerch() { return this.url(MANIFEST?.shared?.emptyPerch); },
  loadingBird() { return this.url(MANIFEST?.shared?.loadingBird); },
  ogCover() { return this.url(MANIFEST?.shared?.ogCover); },
};
