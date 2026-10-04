import { Injectable, signal } from '@angular/core';

interface MensajeDelWorker {
  tipo: 'inicio' | 'pestanas' | 'cambio-horario';
  total?: number;
  accion?: string;
  hora?: number;
  ultimoCambio?: { accion: string; hora: number } | null;
}

/**
 * Conecta esta pestaña con el Shared Worker (public/shared-worker.js).
 * Todas las pestañas comparten el mismo worker, así que se enteran entre sí de los cambios.
 */
@Injectable({ providedIn: 'root' })
export class SincronizacionService {
  readonly disponible = signal(false);
  readonly pestanasAbiertas = signal(1);
  /** Sube de a uno cada vez que OTRA pestaña modifica el horario. */
  readonly cambiosRemotos = signal(0);
  readonly ultimaAccionRemota = signal<string | null>(null);

  private puerto: MessagePort | null = null;

  constructor() {
    this.conectar();
  }

  notificarCambio(accion: string): void {
    this.puerto?.postMessage({ tipo: 'cambio-horario', accion });
  }

  private conectar(): void {
    if (typeof SharedWorker === 'undefined') return; // navegador sin soporte

    try {
      const worker = new SharedWorker('/shared-worker.js', { name: 'horarios-sync' });
      this.puerto = worker.port;
      this.puerto.onmessage = (evento: MessageEvent<MensajeDelWorker>) => this.recibir(evento.data);
      this.puerto.start();
      this.disponible.set(true);

      // Al cerrar la pestaña se avisa para que el contador de pestañas sea correcto
      window.addEventListener('pagehide', () => this.puerto?.postMessage({ tipo: 'desconectar' }));
    } catch {
      this.disponible.set(false);
    }
  }

  private recibir(mensaje: MensajeDelWorker): void {
    if (mensaje.tipo === 'inicio' || mensaje.tipo === 'pestanas') {
      this.pestanasAbiertas.set(mensaje.total ?? 1);
    }
    if (mensaje.tipo === 'cambio-horario') {
      this.ultimaAccionRemota.set(mensaje.accion ?? null);
      this.cambiosRemotos.update((n) => n + 1);
    }
  }
}
