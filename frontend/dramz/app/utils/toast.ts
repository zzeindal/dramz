export function showToast(message: string) {
  if (typeof window === 'undefined') return
  
  const w = window as any
  const webApp = w?.Telegram?.WebApp
  
  if (webApp?.showToast) {
    webApp.showToast(message)
  } else if (webApp?.showAlert) {
    webApp.showAlert(message)
  } else {
    alert(message)
  }
}

