const themeKey = import.meta.env.VITE_APP_THEME
/**
 * 主题
 * @returns
 */
export const getTheme = (): string => {
  return localStorage.getItem(themeKey) || ''
}

export function setTheme(theme: string) {
  const isMac = navigator.userAgent.includes('Macintosh')
  localStorage.setItem(themeKey, theme)
  if (isMac) window.api.setMacTheme(theme)
}

export function removeTheme() {
  localStorage.removeItem(themeKey)
}
