import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

import { ConexionService } from './conexion.service';
import { SincronizacionService } from './sincronizacion.service';

const RUTAS_QUE_CAMBIAN_EL_HORARIO = /\/(horarios|generar-horario|seed)/;

/**
 * - Si una petición modifica el horario (POST/PUT/DELETE), avisa a las otras pestañas por el Shared Worker.
 * - Si el Service Worker respondió con datos guardados, lo informa a la interfaz.
 */
export const workersInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sincronizacion = inject(SincronizacionService);
  const conexion = inject(ConexionService);

  const modifica = peticion.method !== 'GET' && RUTAS_QUE_CAMBIAN_EL_HORARIO.test(peticion.url);

  return siguiente(peticion).pipe(
    tap((evento) => {
      if (!(evento instanceof HttpResponse)) return;

      if (modifica && evento.ok) {
        sincronizacion.notificarCambio(`${peticion.method} ${new URL(peticion.url, window.location.origin).pathname}`);
      }
      if (peticion.method === 'GET') {
        conexion.marcarDatosDesdeCache(evento.headers.get('X-Desde-Cache') === '1');
      }
    }),
  );
};
