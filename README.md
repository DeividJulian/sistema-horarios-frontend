# Sistema de Optimización Automática de Horarios y Aulas — Frontend

Aplicación Angular para generar, revisar y ajustar horarios universitarios sin cruces. Consume la API del backend (FastAPI), que resuelve la asignación como un problema de satisfacción de restricciones (CSP).

Proyecto final de Programación Orientada a la Web — Universidad Cooperativa de Colombia.

- **Backend:** https://github.com/DeividJulian/sistema-horarios-backend
- **Aplicación desplegada:** `<URL del frontend en producción>`

## Qué permite hacer

| Página | Ruta | Funciones |
|---|---|---|
| Horario | `/horario` | Calendario semanal, generación automática, arrastrar y soltar bloques, filtros por profesor/grupo/aula, detalle de cada bloque, mover por teclado, eliminar bloques, conflictos resaltados en rojo |
| Gestión | `/gestion/...` | CRUD de profesores (con su disponibilidad), aulas, grupos y materias, con las mismas validaciones que el backend |
| Análisis | `/analisis` | Totales, cumplimiento de horas, ocupación de aulas, bloques por día, carga de profesores, lista de conflictos y carga de datos de demostración |

## Tecnologías

- Angular 22 con componentes standalone, **signals** y detección de cambios sin Zone.js
- Angular CDK (arrastrar y soltar) y Router con carga diferida de páginas
- Formularios reactivos
- TypeScript en modo estricto
- Vitest para pruebas unitarias

## Estructura

```
src/app/
├── core/
│   ├── api/            # Un servicio HTTP por recurso (teacher, classroom, schedule, analysis, ...)
│   ├── models/         # Interfaces de los datos de la API
│   ├── state/          # CatalogStore: estado compartido con signals
│   ├── services/       # Notificaciones, confirmación, conexión, sincronización entre pestañas
│   ├── interceptors/   # Conecta las peticiones HTTP con el Shared Worker y el Service Worker
│   └── http/           # Traducción de errores HTTP a mensajes claros
├── features/
│   ├── schedule/       # Página del horario (calendario, filtros, detalle, análisis del worker)
│   ├── management/     # Página de gestión (profesores, disponibilidad, aulas, grupos, materias)
│   └── analysis/       # Página de análisis
├── shared/             # Componentes reutilizables (toasts, diálogo, barra de navegación, ...)
└── workers/            # Web Worker de análisis del horario
public/
├── shared-worker.js    # Shared Worker: sincroniza las pestañas abiertas
└── sw.js               # Service Worker: modo sin conexión
```

### Convención de idioma

- **Código en inglés:** clases, funciones, variables, archivos y comentarios.
- **Español en todo lo que ve el usuario:** textos, mensajes, títulos de pestaña y URLs.
- **Campos de la API en español** (`nombre`, `aforo`, `dia_semana`), porque son el contrato con el backend.

## Instalación y ejecución

Requisitos: Node.js 20 o superior y el backend corriendo en `http://127.0.0.1:8000`.

```
npm install
npm start
```

La aplicación queda en `http://localhost:4200`. La URL del backend se configura en `src/environments/` (`environment.development.ts` para desarrollo y `environment.ts` para producción).

## Los tres tipos de worker

| Worker | Archivo | Para qué sirve |
|---|---|---|
| **Web Worker** | `src/app/workers/schedule-analysis.worker.ts` | "Analizar horario" calcula las franjas muertas y la ocupación en otro hilo, sin congelar la pantalla. |
| **Shared Worker** | `public/shared-worker.js` | Una sola instancia para todas las pestañas: si mueves un bloque en una, las demás se actualizan solas. Muestra cuántas pestañas están sincronizadas. |
| **Service Worker** | `public/sw.js` | Guarda la aplicación y las últimas respuestas de la API: sin internet se puede abrir y consultar el último horario (aviso "Sin conexión: solo lectura"). |

El Service Worker solo se registra en la versión de producción:

```
npm run build
npx serve -s dist/frontend/browser -l 8080
```

Abre `http://localhost:8080`, espera el aviso "Modo offline listo" y, en las herramientas de desarrollo (pestaña *Application* → *Service Workers*), marca *Offline* y recarga. El parámetro `-s` hace que rutas como `/gestion` funcionen al recargar.

## Accesibilidad

- Navegación completa con teclado: los bloques del calendario reciben foco y se abren con Enter; desde el detalle se pueden mover sin arrastrar.
- Diálogo de confirmación nativo (`<dialog>`): atrapa el foco y se cierra con Escape.
- Avisos con `aria-live`, enlace para saltar al contenido y etiquetas descriptivas en los bloques.
- Los conflictos y errores siempre llevan ícono y texto, nunca solo color.

## Pruebas

```
npm test -- --watch=false
```

29 pruebas unitarias que cubren las validaciones, los mensajes de error, la lógica del Web Worker, los filtros, las notificaciones, el diálogo de confirmación, el estado compartido (incluida la actualización optimista con reversión) y el interceptor.
