export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

/*
 * Runs in <head> before first paint (see app/layout.tsx). Adds `.dark` to
 * <html> when the stored preference is "dark", or when there is no stored
 * preference and the OS prefers dark. It also follows live OS changes for as
 * long as no preference is pinned, and exposes `window.__setTheme` so the
 * toggle in NavHeader shares the same logic.
 */
export const themeInitScript = `(function(){
var k=${JSON.stringify(THEME_STORAGE_KEY)},d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)");
function get(){try{var t=localStorage.getItem(k);return t==="light"||t==="dark"?t:"system"}catch(e){return "system"}}
function apply(p){d.classList.toggle("dark",p==="dark"||(p==="system"&&m.matches))}
window.__setTheme=function(p){try{if(p==="system")localStorage.removeItem(k);else localStorage.setItem(k,p)}catch(e){}apply(p)};
apply(get());
m.addEventListener("change",function(){apply(get())});
})()`;

export function readThemePreference(): ThemePreference {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function setThemePreference(p: ThemePreference) {
  const w = window as Window & { __setTheme?: (p: ThemePreference) => void };
  w.__setTheme?.(p);
}
