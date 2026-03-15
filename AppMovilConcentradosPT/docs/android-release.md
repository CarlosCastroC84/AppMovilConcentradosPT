# Android Release

## 1. Crear la keystore local

Ejecutar en una terminal con `keytool` disponible:

```powershell
keytool -genkeypair -v -keystore concentradospt-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias concentradospt
```

Mover el archivo generado a la carpeta `android/`.

## 2. Crear `android/keystore.properties`

Tomar como base `android/keystore.properties.example` y completar las credenciales reales:

```properties
storeFile=concentradospt-upload-key.jks
storePassword=TU_STORE_PASSWORD
keyAlias=concentradospt
keyPassword=TU_KEY_PASSWORD
```

`android/keystore.properties` no debe subirse al repositorio.

## 3. Generar artefactos de release

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

## 4. Rutas esperadas de salida

- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release.apk` si la keystore esta configurada
- `android/app/build/outputs/apk/release/app-release-unsigned.apk` si aun no existe `android/keystore.properties`

## 5. Evidencia para la entrega

- Captura del comando `bundleRelease` exitoso
- Captura del archivo `.aab` generado con fecha y tamano
- Captura del APK release si tambien se genera
