# Estado del Entregable

Fecha de corte: `16 de marzo de 2026`

## 1. Cumplimiento tecnico actual

El proyecto `Concentrados PT` ya cumple los bloques tecnicos principales solicitados por la actividad:

- autenticacion con Amazon Cognito
- consumo de servicios API con AWS
- carrito de compras
- almacenamiento local persistente
- compilacion Android con Capacitor
- generacion de `APK release` y `AAB release`

## 2. Evidencia tecnica ya verificada

### Funcionalidad validada

- inicio de sesion exitoso en Android fisico
- cierre de sesion funcional en Android fisico
- acceso al panel administrativo
- creacion de pedidos desde checkout
- confirmacion posterior al envio del pedido
- guardado del pedido en AWS

### Artefactos Android generados

- APK debug:
  - `android/app/build/outputs/apk/debug/app-debug.apk`
- APK release:
  - `android/app/build/outputs/apk/release/app-release.apk`
- AAB release:
  - `android/app/build/outputs/bundle/release/app-release.aab`

## 3. Estado frente al pedido del profesor

| Requisito | Estado | Observacion |
| --- | --- | --- |
| Codigo fuente de la aplicacion hibrida | Cumplido | Proyecto Angular + Ionic + Capacitor operativo |
| Autenticacion | Cumplido | Integrado con Amazon Cognito |
| Servicios API | Cumplido | Productos, pedidos, perfil administrativo y usuarios |
| Carrito de compras | Cumplido | Flujo de compra funcional |
| Almacenamiento local | Cumplido | Persistencia de carrito y borrador de checkout |
| Compilacion Android | Cumplido | APK y AAB generados |
| Publicacion Play Store | Listo para carga | Falta subir manualmente el `.aab` en Play Console |
| Documento de pruebas | En preparacion | Ya existen plantillas y plan de pruebas en `docs/` |
| Documento final ABP | En preparacion | Existe plantilla base para completar en tercera persona |

## 4. Archivos clave para la entrega

- Guia Android:
  - [android-release.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/android-release.md)
- Plan de pruebas:
  - [plan-pruebas.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/plan-pruebas.md)
- Matriz de evidencia:
  - [matriz-evidencia.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/matriz-evidencia.md)
- Plantilla de informe:
  - [informe-final-template.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/informe-final-template.md)

## 5. Pendientes manuales para cerrar la entrega

Estos puntos no son de codigo; son de evidencia y presentacion:

1. Tomar capturas reales de:
   - login exitoso
   - login fallido
   - carrito con productos
   - checkout exitoso
   - pedido guardado
   - `npm run build`
   - `npx cap sync android`
   - `app-release.apk`
   - `app-release.aab`
2. Completar portada y datos del equipo en la plantilla del informe final.
3. Pasar el documento final a normas APA y exportarlo a PDF.
4. Subir el codigo fuente a GitHub y anexar el enlace en el informe.
5. Subir el archivo `app-release.aab` a Play Console si se desea dejar evidencia de carga en tienda.

## 6. Recomendacion de cierre

El siguiente paso mas rentable es completar el informe final con base en la plantilla existente y adjuntar las capturas ya obtenidas durante las pruebas en Android.
