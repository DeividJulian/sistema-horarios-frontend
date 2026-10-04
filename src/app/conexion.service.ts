import { Injectable, isDevMode, signal } from '@angular/core';

/**
 * Registra el Service Worker (public/sw.js) y expone el estado de la conexión.
 * En desarrollo (ng serve) no se registra para evitar confusiones con la caché.
 */
@Injectable({ providedIn: 'root' })
export class ConexionService {
  readonly enLinea = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  /** true cuando la última respuesta del backend salió de la copia guardada por el Service Worker. */
  readonly datosDesdeCache = signal(false);
  readonly serviceWorkerActivo = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.enLinea.set(true));
    window.addEventListener('offline', () => this.enLinea.set(false));
    this.registrarServiceWorker();
  }

  marcarDatosDesdeCache(desdeCache: boolean): void {
    this.datosDesdeCache.set(desdeCache);
  }

  private registrarServiceWorker(): void {
    if (isDevMode() || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => this.serviceWorkerActivo.set(true))
      .catch(() => this.serviceWorkerActivo.set(false));
  }
}
