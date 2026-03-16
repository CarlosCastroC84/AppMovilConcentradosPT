# Android Release

## 1. Estado actual del proyecto

El proyecto ya cuenta con firma Android configurada y los artefactos de salida fueron generados correctamente el `16 de marzo de 2026`.

Version actual:

- `versionName`: `1.0.0`
- `versionCode`: `2`
- `applicationId`: `com.ucompensar.concentradospt`

## 2. Keystore utilizada

Ubicacion actual:

- `android/app/concentradospt-release.keystore`
- `android/keystore.properties`

Si en otro equipo se requiere regenerar la keystore, ejecutar en una terminal con `keytool` disponible:

```powershell
keytool -genkeypair -v -keystore android/app/concentradospt-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias concentradospt
```

## 3. Configuracion de `android/keystore.properties`

Contenido esperado:

```properties
storeFile=app/concentradospt-release.keystore
storePassword=TU_STORE_PASSWORD
keyAlias=concentradospt
keyPassword=TU_KEY_PASSWORD
```

`android/keystore.properties` no debe subirse al repositorio.

## 4. Generar artefactos de release

Desde la raiz del proyecto:

```powershell
npm run build
npx cap sync android
```

Luego, dentro de `android/`:

```powershell
.\gradlew.bat bundleRelease
.\gradlew.bat assembleRelease
```

## 5. Rutas de salida validadas

- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release.apk`

## 6. Evidencia para la entrega

- Captura del comando `bundleRelease` exitoso
- Captura del archivo `.aab` generado con fecha y tamano
- Captura del archivo `app-release.apk`
- Captura de `android/app/build.gradle` mostrando `versionName "1.0.0"` y `versionCode 2`
