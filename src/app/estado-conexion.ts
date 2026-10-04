import { Component, inject } from '@angular/core';

import { ConexionService } from './conexion.service';
import { SincronizacionService } from './sincronizacion.service';

@Component({
  selector: 'app-estado-conexion',
  template: `
    <div class="estado">
      @if (!conexion.enLinea()) {
        <span class="chip alerta">Sin conexión: solo lectura</span>
      } @else if (conexion.datosDesdeCache()) {
        <span class="chip alerta">Mostrando datos guardados</span>
      }
      @if (sync.disponible()) {
        <span class="chip">
          {{ sync.pestanasAbiertas() }}
          {{ sync.pestanasAbiertas() === 1 ? 'pestaña sincronizada' : 'pestañas sincronizadas' }}
        </span>
      }
      @if (conexion.serviceWorkerActivo()) {
        <span class="chip ok">Modo offline listo</span>
      }
    </div>
  `,
  styles: `
    .estado {
      position: fixed;
      right: 16px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      z-index: 50;
      pointer-events: none;
    }
    .chip {
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      background: rgba(30, 41, 59, 0.92);
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    .chip.ok {
      border-color: rgba(52, 211, 153, 0.6);
      color: #6ee7b7;
    }
    .chip.alerta {
      border-color: rgba(251, 191, 36, 0.7);
      color: #fcd34d;
    }
  `,
})
export class EstadoConexion {
  protected readonly conexion = inject(ConexionService);
  protected readonly sync = inject(SincronizacionService);
}
