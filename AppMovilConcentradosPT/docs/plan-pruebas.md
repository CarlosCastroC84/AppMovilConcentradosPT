# Plan de Pruebas

## 1. Objetivo

Este documento organiza la ejecucion de pruebas funcionales y tecnicas del proyecto `Concentrados PT` para soportar la entrega academica. Su objetivo es dejar evidencia verificable de autenticacion, consumo de API, carrito de compras, almacenamiento local, gestion administrativa y empaquetado Android.

Fecha base de esta version: `16 de marzo de 2026`.

## 2. Alcance

Se cubren los siguientes bloques:

- autenticacion con Amazon Cognito
- proteccion de rutas administrativas
- consulta de productos desde API Gateway
- carrito de compras con persistencia local
- checkout y creacion de pedidos
- gestion de productos
- gestion de pedidos
- build web y empaquetado Android
- montaje del paquete iOS y limitacion tecnica de compilacion por falta de Mac/Xcode

## 3. Ambientes de prueba

| Ambiente | Uso esperado | Responsable | Estado |
| --- | --- | --- | --- |
| Navegador en Windows | Validacion funcional rapida | Equipo | Parcial |
| Emulador Android | Validacion hibrida base | Equipo | Pendiente |
| Dispositivo Android fisico | Evidencia para entrega | Equipo | Hecho |
| iOS con Xcode | Proyecto iOS montado, pero compilacion no disponible en este entorno | No aplica | Bloqueado |

## 4. Precondiciones generales

- El proyecto debe compilar con `npm run build`.
- La sincronizacion Android debe pasar con `npx cap sync android`.
- El backend AWS debe estar disponible en los endpoints configurados.
- Debe existir al menos un usuario valido en Cognito para pruebas de acceso administrativo.
- Para las pruebas administrativas, la API debe permitir `GET`, `POST`, `PUT` y `DELETE` sobre productos y pedidos.

## 5. Registro de resultados

Cada prueba debe registrar:

- fecha de ejecucion
- integrante responsable
- ambiente usado
- resultado esperado
- resultado obtenido
- evidencia asociada
- observaciones o incidencias

## 6. Casos de prueba

| ID | Modulo | Escenario | Pasos resumidos | Resultado esperado | Ambiente | Evidencia sugerida | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | Autenticacion | Inicio de sesion exitoso | Abrir login, ingresar usuario y contrasena validos, enviar formulario | La app inicia sesion y redirige al panel administrativo o a la ruta solicitada | Navegador / Android | Captura del formulario y del panel ya cargado | Hecho |
| AUTH-02 | Autenticacion | Inicio de sesion fallido | Abrir login, ingresar credenciales invalidas y enviar formulario | La app muestra mensaje de error y no permite acceso | Navegador / Android | Captura del mensaje de error | Hecho |
| AUTH-03 | Seguridad | Auth guard en rutas privadas | Intentar abrir `/panel-admin` sin sesion activa | La app redirige a `/login-operativo` | Navegador / Android | Captura de la redireccion | Hecho |
| PROD-01 | Catalogo | Consulta de productos | Abrir catalogo con API disponible | Los productos se cargan desde backend | Navegador / Android | Captura del catalogo cargado | Pendiente |
| PROD-02 | Catalogo | Falla de API | Desactivar red o usar backend no disponible y abrir catalogo | La app informa error sin romperse | Navegador | Captura del error controlado | Pendiente |
| CART-01 | Carrito | Agregar productos al carrito | Agregar 2 o mas productos desde catalogo | El contador y subtotal cambian correctamente | Navegador / Android | Captura del carrito con items | Pendiente |
| CART-02 | Almacenamiento local | Persistencia del carrito | Agregar productos, cerrar y reabrir la app | El carrito reaparece con cantidades y subtotal | Navegador / Android | Captura antes y despues del reinicio | Pendiente |
| CART-03 | Carrito | Vaciar carrito | Agregar productos y usar accion de vaciar carrito | El carrito queda vacio y storage se limpia | Navegador / Android | Captura del estado vacio | Pendiente |
| CHK-01 | Checkout | Persistencia del borrador | Escribir nombre, celular, ubicacion y observaciones, cerrar y reabrir la app | El formulario reaparece con los datos previos | Navegador / Android | Captura antes y despues del reinicio | Pendiente |
| CHK-02 | Checkout | Validacion de campos obligatorios | Intentar enviar pedido sin nombre o celular | La app bloquea el envio y muestra advertencia | Navegador / Android | Captura del mensaje | Pendiente |
| CHK-03 | Checkout | Creacion de pedido | Completar carrito y formulario, enviar pedido | El pedido se crea en backend y se confirma al usuario | Navegador / Android | Captura del mensaje de exito | Hecho |
| CHK-04 | Checkout | Limpieza post-checkout | Tras un pedido exitoso, reabrir la app | Carrito y borrador quedan vacios | Navegador / Android | Captura del estado limpio | Pendiente |
| ADM-PROD-01 | Gestion de productos | Crear producto | Entrar al panel, abrir formulario, registrar producto nuevo y guardar | El producto aparece en el listado | Navegador / Android | Captura del formulario y del listado actualizado | Pendiente |
| ADM-PROD-02 | Gestion de productos | Editar producto | Seleccionar producto existente, modificar y guardar | Los cambios quedan reflejados en el listado | Navegador / Android | Captura antes y despues | Pendiente |
| ADM-PROD-03 | Gestion de productos | Cambiar estado | Activar o inactivar un producto | El estado se actualiza sin romper el flujo | Navegador / Android | Captura del cambio de estado | Pendiente |
| ADM-PROD-04 | Gestion de productos | Eliminar producto | Seleccionar producto, confirmar eliminacion | El producto desaparece del listado | Navegador / Android | Captura del dialogo y del listado | Pendiente |
| ADM-ORD-01 | Gestion de pedidos | Consultar pedidos | Abrir modulo de pedidos con backend disponible | Los pedidos se cargan y se pueden filtrar | Navegador / Android | Captura del listado | Pendiente |
| ADM-ORD-02 | Gestion de pedidos | Cambiar estado del pedido | Seleccionar pedido y actualizar su estado | El cambio queda reflejado en pantalla y backend | Navegador / Android | Captura antes y despues | Pendiente |
| ADM-ORD-03 | Gestion de pedidos | Eliminar pedido | Confirmar eliminacion de un pedido | El pedido desaparece del listado | Navegador / Android | Captura del dialogo y del listado | Pendiente |
| BLD-01 | Build | Compilacion web | Ejecutar `npm run build` | El build finaliza sin errores | Consola | Captura del comando exitoso | Hecho |
| BLD-02 | Build | Sync Android | Ejecutar `npx cap sync android` | La sincronizacion finaliza sin errores | Consola | Captura del comando exitoso | Hecho |
| BLD-03 | Android | APK debug | Ejecutar `:app:assembleDebug` y validar salida | Se genera `app-debug.apk` instalable | Consola / Explorador | Captura del archivo generado | Hecho |
| BLD-04 | Android | AAB release | Ejecutar `:app:bundleRelease` | Se genera `app-release.aab` | Consola / Explorador | Captura del archivo generado | Hecho |
| IOS-01 | iOS | Plataforma montada | Instalar `@capacitor/ios` y ejecutar `npx cap add ios` | El repositorio queda con carpeta `ios/` y configuracion base de Capacitor para iOS | Consola / Explorador | Captura de la carpeta `ios/` y dependencias instaladas | Hecho |
| IOS-02 | iOS | Limitacion documentada | Revisar estado del entorno y documentar restriccion | Queda documentado que la plataforma iOS existe en el repositorio, pero no puede compilarse ni probarse por falta de Mac/Xcode | Documento | Captura o referencia al documento iOS | Hecho |

## 7. Criterio de cierre

Este bloque de pruebas se considerara cerrado cuando:

- todos los casos criticos de autenticacion, carrito, checkout y administracion tengan resultado `Exitoso` o `Bloqueado con justificacion`
- cada caso ejecutado tenga una evidencia asociada
- los builds Android tengan artefactos verificables
- la limitacion de iOS quede formalmente argumentada en el informe

## 8. Observaciones para el equipo

- Las pruebas en navegador no reemplazan las pruebas en Android; ambas deben documentarse.
- La evidencia debe capturarse durante la ejecucion, no al final del proyecto.
- Si un caso falla por backend AWS, debe registrarse como dependencia externa y no como fallo directo de la app hibrida.
