# Plantilla de Informe Final

> Nota de uso:
> Esta plantilla se redacto en estilo formal y en tercera persona. El equipo debe reemplazar los campos entre corchetes, insertar las capturas reales y ajustar las fechas y resultados de acuerdo con la ejecucion del proyecto.

---

## Portada

**Titulo del trabajo**

Desarrollo, pruebas y preparacion para publicacion de la aplicacion movil hibrida `Concentrados PT`

**Asignatura**

[Nombre de la asignatura]

**Actividad**

Elaboracion y presentacion del producto: tienda online

**Integrantes**

- [Nombre completo del integrante 1]
- [Nombre completo del integrante 2]
- [Nombre completo del integrante 3]

**Docente**

[Nombre del docente]

**Institucion**

[Nombre de la institucion]

**Ciudad y fecha**

[Ciudad], [dia] de [mes] de [anio]

---

## Introduccion

El presente documento describe el proceso de desarrollo, integracion, validacion y preparacion para distribucion de la aplicacion movil hibrida `Concentrados PT`, orientada al funcionamiento de una tienda online. El proyecto se construyo con Ionic, Angular y Capacitor, y se integro con servicios de AWS para autenticacion y consumo de informacion mediante API.

La finalidad del informe consiste en documentar las etapas ejecutadas, las pruebas realizadas en los diferentes ambientes disponibles, los resultados obtenidos y el grado de cumplimiento frente a los objetivos planteados en la actividad academica. De igual manera, el documento expone las restricciones tecnicas identificadas durante la fase final del proyecto, especialmente en relacion con la compilacion para iOS.

Desde una perspectiva metodologica, el trabajo se desarrollo de forma incremental, con enfasis en autenticacion, servicios API, carrito de compras, almacenamiento local, administracion de productos y pedidos, y preparacion del paquete Android para distribucion. La validacion del funcionamiento se apoyo en pruebas funcionales y tecnicas ejecutadas en navegador, entorno Android y consola de construccion.

## Objetivo general

Desarrollar y validar una aplicacion movil hibrida de tienda online que permita evidenciar autenticacion, consumo de servicios API, carrito de compras, almacenamiento local y preparacion para distribucion en Android, documentando de manera formal el proceso tecnico y los resultados obtenidos.

## Objetivos especificos

- Implementar autenticacion de usuarios mediante Amazon Cognito.
- Integrar servicios API para la consulta y gestion de productos y pedidos.
- Incorporar un carrito de compras con persistencia local.
- Validar el flujo funcional de compra y administracion desde diferentes ambientes de prueba.
- Generar artefactos Android para su instalacion y posible distribucion.
- Documentar la limitacion tecnica de iOS y el procedimiento previsto para su futura ejecucion.

## Descripcion del proyecto

`Concentrados PT` corresponde a una aplicacion movil hibrida orientada a la gestion de una tienda online para comercializacion de concentrados y productos relacionados. La aplicacion permite consultar catalogo, agregar productos al carrito, diligenciar datos de entrega, enviar pedidos y administrar informacion desde un panel protegido por autenticacion.

El proyecto incorpora un flujo de autenticacion con AWS Cognito, consumo de endpoints expuestos por API Gateway y logica de persistencia local para el carrito y el borrador del checkout. Adicionalmente, el proyecto cuenta con empaquetado Android mediante Capacitor y Gradle.

## Tecnologias utilizadas

Las principales tecnologias empleadas en el proyecto son las siguientes:

- Ionic Framework para la construccion de la aplicacion hibrida
- Angular como framework principal del frontend
- Capacitor para integracion con Android
- Amazon Cognito para autenticacion
- API Gateway y AWS Lambda para exposicion de servicios
- DynamoDB como base de datos administrada
- Node.js en la capa backend asociada a Lambda
- Android Studio y Gradle para la generacion de artefactos Android

## Arquitectura general de la solucion

La arquitectura implementada sigue un enfoque desacoplado entre frontend movil y servicios cloud. El frontend desarrollado con Ionic y Angular consume endpoints HTTPS publicados en AWS API Gateway. La autenticacion se realiza contra Amazon Cognito, mientras que la informacion de productos y pedidos se gestiona a traves de funciones Lambda y almacenamiento en DynamoDB. Para la experiencia del usuario, la aplicacion incorpora almacenamiento local persistente en el dispositivo mediante Capacitor Preferences.

### Flujo general

1. El usuario inicia sesion mediante Cognito.
2. La aplicacion obtiene el token y lo usa en llamadas autenticadas.
3. El catalogo y la gestion administrativa consumen endpoints API.
4. El carrito almacena productos en memoria y tambien en almacenamiento local.
5. El checkout genera un pedido y limpia la informacion persistida al finalizar.

## Desarrollo funcional implementado

### Autenticacion

La aplicacion implementa inicio y cierre de sesion mediante Amazon Cognito. Tambien incorpora verificacion del estado autenticado para proteger rutas administrativas. En caso de que un usuario intente ingresar a una ruta privada sin sesion, el sistema redirige hacia la pantalla de autenticacion.

### Servicios API

El proyecto consume servicios para:

- consulta de productos
- creacion, actualizacion y eliminacion de productos
- consulta de pedidos
- creacion, actualizacion y eliminacion de pedidos

La integracion se realiza por medio de servicios Angular que encapsulan el acceso a la API y normalizan las respuestas provenientes del backend.

### Carrito de compras y almacenamiento local

El carrito permite agregar productos, modificar cantidades, calcular subtotal y vaciar el contenido. Como parte del cierre del proyecto, se implemento persistencia local para que los productos agregados no se pierdan al cerrar y reabrir la aplicacion. Del mismo modo, el formulario de checkout conserva un borrador local con el nombre, celular, ubicacion y observaciones del usuario.

### Gestion administrativa

El proyecto cuenta con modulos de gestion para productos y pedidos. En estos modulos se pueden ejecutar operaciones CRUD sobre productos y acciones de actualizacion y eliminacion sobre pedidos, de acuerdo con la disponibilidad del backend configurado.

## Estrategia de pruebas

La validacion del sistema se realizo con una estrategia de pruebas funcionales y tecnicas. Las pruebas funcionales se enfocaron en el flujo del usuario y en la comprobacion del comportamiento esperado en los modulos principales. Las pruebas tecnicas se orientaron a la compilacion del proyecto, sincronizacion con Android y generacion de artefactos de salida.

El plan detallado de ejecucion se encuentra en [plan-pruebas.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/plan-pruebas.md#L1), mientras que la relacion de capturas y artefactos se organizo en [matriz-evidencia.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/matriz-evidencia.md#L1).

## Pruebas ejecutadas

### Pruebas en navegador

En el entorno de navegador se verificaron los flujos base de autenticacion, consulta de productos, gestion del carrito, validacion del formulario de checkout y operaciones administrativas. Este ambiente permitio detectar errores de integracion y ajustar la interfaz antes de compilar la aplicacion movil.

**Resultado registrado**

[Describir los resultados obtenidos en navegador]

**Evidencias asociadas**

- [Insertar captura EVID-01]
- [Insertar captura EVID-04]
- [Insertar captura EVID-05]

### Pruebas en emulador Android

En el emulador Android se validaron la integracion hibrida, el comportamiento del almacenamiento local y la navegacion general de la aplicacion. Este ambiente permitio comprobar que el carrito persistiera entre sesiones y que el borrador del checkout se restaurara correctamente.

**Resultado registrado**

[Describir los resultados obtenidos en emulador Android]

**Evidencias asociadas**

- [Insertar captura EVID-06]
- [Insertar captura EVID-07]
- [Insertar captura EVID-08]

### Pruebas en dispositivo Android fisico

En dispositivo fisico se realizo la validacion final del paquete `app-debug.apk`, con el fin de confirmar que la aplicacion pudiera instalarse y ejecutarse en un entorno real de uso. Esta etapa constituye la evidencia mas cercana al escenario de distribucion solicitado por la actividad.

**Resultado registrado**

[Describir los resultados obtenidos en dispositivo Android]

**Evidencias asociadas**

- [Insertar captura de instalacion]
- [Insertar captura del inicio de la aplicacion]
- [Insertar captura de flujo funcional ejecutado]

## Resultados de compilacion y preparacion para lanzamiento

El proyecto fue compilado satisfactoriamente en el entorno Android. Como evidencia de esta etapa se obtuvo un paquete APK debug instalable y un archivo AAB para distribucion. Este resultado demuestra que la aplicacion se encuentra preparada para una fase de despliegue Android, condicionada a la firma final y al uso de la consola correspondiente si se desea publicacion formal.

### Artefactos generados

- `app-debug.apk`
- `app-release.aab`
- `app-release-unsigned.apk` mientras no se configure una keystore real

### Comandos ejecutados

```powershell
npm run build
npx cap sync android
.\gradlew.bat :app:assembleDebug
.\gradlew.bat :app:bundleRelease
```

La guia tecnica para la fase de release Android se encuentra en [android-release.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/android-release.md#L1).

## Depuracion de errores y optimizacion realizada

Durante la etapa final del proyecto se ejecutaron ajustes orientados a mejorar la estabilidad del sistema. Entre ellos se incluyeron correcciones de compilacion TypeScript, integracion de almacenamiento local persistente, validaciones adicionales en formularios, proteccion de rutas administrativas y normalizacion del build Android.

Adicionalmente, se identifico que el archivo `app-release-unsigned.apk` no era instalable en dispositivo fisico debido a la ausencia de firma. Por esta razon, se documento la configuracion necesaria para usar una keystore local y producir un artefacto release firmado.

## Consideraciones de seguridad

Desde la perspectiva de seguridad, el proyecto incorpora autenticacion con Cognito y uso de tokens para el acceso a la API. Adicionalmente, el repositorio excluye archivos sensibles asociados a firma Android, como `keystore.properties` y archivos `.jks`, con el fin de evitar la exposicion de credenciales o llaves privadas.

Se recomienda mantener como practica permanente:

- no versionar keystores privadas
- no exponer contrasenas en el repositorio
- restringir el acceso a usuarios administrativos
- validar en backend los permisos reales de operacion

## Actualizaciones y mantenimiento

Como linea de mantenimiento, el proyecto requiere:

- seguimiento al comportamiento del backend AWS
- actualizacion de dependencias de Ionic, Angular y Capacitor
- validacion periodica de builds Android
- generacion de firma release definitiva
- ejecucion pendiente del flujo iOS cuando exista entorno compatible

## Evaluacion de objetivos alcanzados

En terminos generales, el proyecto alcanzo los objetivos funcionales principales de la actividad. Se implementaron autenticacion, servicios API, carrito de compras, almacenamiento local y compilacion Android. Asimismo, se documento el proceso de validacion y se dejaron evidencias asociadas a las fases tecnicas del cierre del producto.

No obstante, el componente iOS quedo condicionado por la falta de un entorno Mac con Xcode, requisito indispensable para generar y validar la aplicacion en esa plataforma. Esta restriccion no invalida el trabajo desarrollado, pero si limita el alcance final de publicacion multiplataforma en el estado actual del proyecto.

## Limitacion tecnica de iOS

En el entorno disponible para el equipo no fue posible ejecutar la fase iOS debido a la ausencia de un equipo Mac con Xcode. La descripcion detallada de esta restriccion y el procedimiento previsto para una futura ejecucion se presenta en [ios-limitacion-tecnica.md](/d:/INGENIERIA_DE_SOFTWARE/AppMovilConcentradosPT/AppMovilConcentradosPT/docs/ios-limitacion-tecnica.md#L1).

## Conclusiones

El proyecto `Concentrados PT` permitio consolidar una aplicacion movil hibrida funcional orientada al contexto de una tienda online. La solucion integra autenticacion, servicios API, carrito de compras, persistencia local y herramientas de administracion, con una base tecnica suficiente para ser defendida en el marco de la actividad academica.

Las pruebas realizadas demostraron que la aplicacion puede ejecutarse correctamente en entorno web y Android, y que el flujo principal de uso mantiene coherencia funcional. De manera especial, la incorporacion de almacenamiento local fortalecio el cumplimiento de la rubrica al evidenciar persistencia real del carrito y del checkout.

En la fase de distribucion, el proyecto quedo preparado para Android mediante la generacion de APK debug y AAB release. En contraste, la fase iOS no pudo completarse por una restriccion externa asociada al entorno de compilacion exigido por Apple. Aun asi, dicha limitacion fue documentada de forma formal y tecnica, dejando trazado el procedimiento necesario para completar el proceso en una etapa posterior.

## Referencias

Android Studio Developers. (s.f.). *Android Studio*. https://developer.android.com/studio

Apple Store Connect. (s.f.). *Apple Store Connect*. https://appstoreconnect.apple.com/login

Capacitor. (s.f.). *Capacitor: Cross-platform native runtime for web apps*. https://capacitorjs.com/docs

Google Play Console. (s.f.). *Google Play Console*. https://play.google.com/console

Griffith, C. (2017). *Mobile app development with Ionic: Cross-platform apps with Ionic, Angular & Cordova*. O'Reilly.

Ionic Framework. (s.f.). *Introduction to Ionic*. https://ionicframework.com/docs

Khanna, R. (2016). *Getting started with Ionic*. Packt.

Mac App Store. (s.f.). *Xcode*. https://apps.apple.com/co/app/xcode/id497799835?mt=12

Recio Garcia, J. A. (2018). *HTML5, CSS3 y JQuery. Curso practico*. Ediciones de la U.

## Anexos

- Anexo A. Capturas y evidencias definidas en la matriz de evidencia
- Anexo B. Resultados de build y empaquetado Android
- Anexo C. Documento de limitacion tecnica de iOS
