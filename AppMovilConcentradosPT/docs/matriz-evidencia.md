# Matriz de Evidencia

## 1. Objetivo

Esta matriz lista las evidencias minimas que el equipo debe reunir para soportar la entrega del proyecto. La idea es relacionar cada requisito del profesor con una captura, video corto, artefacto o documento verificable.

## 2. Convencion de nombres

Se recomienda guardar las evidencias con este formato:

`EVID-XX-modulo-ambiente-fecha.ext`

Ejemplos:

- `EVID-01-login-exitoso-android-2026-03-14.png`
- `EVID-02-carrito-persistente-emulador-2026-03-14.png`
- `EVID-03-build-aab-consola-2026-03-14.png`

## 3. Ubicacion sugerida

Las evidencias pueden guardarse en:

- `docs/evidencias/navegador/`
- `docs/evidencias/android-emulador/`
- `docs/evidencias/android-dispositivo/`
- `docs/evidencias/release/`
- `docs/evidencias/ios/`

## 4. Matriz

| ID | Requisito | Evidencia requerida | Ambiente | Archivo sugerido | Responsable | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| EVID-01 | Autenticacion | Login exitoso con Cognito | Navegador o Android | `EVID-01-login-exitoso-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-02 | Autenticacion | Login fallido con mensaje de error | Navegador o Android | `EVID-02-login-fallido-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-03 | Seguridad | Redireccion del guard al intentar entrar sin sesion | Navegador o Android | `EVID-03-auth-guard-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-04 | Servicios API | Catalogo cargado desde backend | Navegador o Android | `EVID-04-catalogo-api-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-05 | Carrito | Carrito con productos agregados | Navegador o Android | `EVID-05-carrito-items-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-06 | Almacenamiento local | Carrito persistente despues de reiniciar | Android | `EVID-06-carrito-persistente-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-07 | Almacenamiento local | Borrador de checkout persistente | Android | `EVID-07-checkout-borrador-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-08 | Checkout | Pedido enviado exitosamente | Navegador o Android | `EVID-08-checkout-exitoso-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-09 | Checkout | Estado limpio despues del pedido | Android | `EVID-09-checkout-limpio-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-10 | CRUD productos | Alta de producto | Navegador o Android | `EVID-10-producto-crear-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-11 | CRUD productos | Edicion de producto | Navegador o Android | `EVID-11-producto-editar-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-12 | CRUD productos | Cambio de estado del producto | Navegador o Android | `EVID-12-producto-estado-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-13 | CRUD productos | Eliminacion de producto | Navegador o Android | `EVID-13-producto-eliminar-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-14 | Gestion de pedidos | Listado de pedidos cargado | Navegador o Android | `EVID-14-pedidos-listado-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-15 | Gestion de pedidos | Cambio de estado del pedido | Navegador o Android | `EVID-15-pedidos-estado-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-16 | Gestion de pedidos | Eliminacion de pedido | Navegador o Android | `EVID-16-pedidos-eliminar-android-2026-03-14.png` | Equipo | Pendiente |
| EVID-17 | Build Android | Salida exitosa de `npm run build` | Consola | `EVID-17-build-web-2026-03-14.png` | Equipo | Hecho |
| EVID-18 | Build Android | Salida exitosa de `npx cap sync android` | Consola | `EVID-18-cap-sync-android-2026-03-14.png` | Equipo | Hecho |
| EVID-19 | Build Android | Archivo `app-debug.apk` generado | Explorador | `EVID-19-apk-debug-2026-03-14.png` | Equipo | Hecho |
| EVID-20 | Publicacion Android | Archivo `app-release.aab` generado | Explorador | `EVID-20-aab-release-2026-03-14.png` | Equipo | Hecho |
| EVID-21 | iOS | Limitacion tecnica documentada | Documento | `EVID-21-ios-limitacion-2026-03-14.pdf` o referencia textual | Equipo | Hecho |

## 5. Recomendaciones

- No mezclar evidencias de otra app con este proyecto.
- Verificar que el nombre visible de la aplicacion en capturas corresponda a `Concentrados PT`.
- Guardar por separado las evidencias de navegador, emulador y dispositivo fisico.
- Si una evidencia es video, usar el mismo identificador del item y cambiar solo la extension.
