# Limitacion Tecnica de iOS

## 1. Estado actual

Con corte al `14 de marzo de 2026`, el proyecto no cuenta con entorno tecnico disponible para compilar y validar la version iOS. La limitacion no depende de la logica de negocio de la aplicacion, sino de la ausencia de herramientas y hardware requeridos por Apple para este proceso.

## 2. Hechos verificados

- el repositorio actual no tiene carpeta `ios/`
- el proyecto no tiene `@capacitor/ios` instalado en `package.json`
- el entorno de trabajo del equipo no dispone de un equipo Mac con Xcode
- sin Mac y sin Xcode no es posible abrir, compilar, firmar ni exportar una aplicacion iOS valida
- la publicacion en App Store tambien depende de una cuenta activa en Apple Developer

## 3. Impacto en el entregable

Esta restriccion implica lo siguiente:

- no se puede generar archivo `.ipa` desde el entorno actual
- no se puede abrir el proyecto en Xcode para pruebas sobre simulador iOS o dispositivo iPhone
- no se puede completar el flujo de firma y distribucion por App Store Connect

La limitacion no bloquea la parte Android del entregable, pero si deja el componente iOS en estado `parcialmente defendible` y debe explicarse de forma explicita en el informe.

## 4. Procedimiento previsto si el equipo obtiene un Mac

Si el equipo consigue acceso a un equipo Mac con Xcode, el procedimiento previsto es:

```powershell
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
```

Despues de esos pasos, el flujo esperado seria:

1. abrir `ios/App/App.xcworkspace` en Xcode
2. configurar `Bundle Identifier`, equipo de firma y certificados
3. seleccionar simulador o dispositivo fisico
4. compilar la app y validar funcionamiento basico
5. generar archivo para distribucion usando Xcode Organizer
6. subir el build a App Store Connect si existe membresia activa

## 5. Redaccion sugerida para el informe

Se deja a continuacion un texto base que el equipo puede adaptar al documento final:

> A fecha de 14 de marzo de 2026, el equipo no dispone de un entorno Mac con Xcode, requisito tecnico indispensable para generar, firmar y validar la aplicacion en iOS. Por esta razon, el proyecto se entrega con evidencia completa del flujo Android y con la ruta tecnica documentada para iOS. La ausencia de este entorno impide generar el archivo `.ipa`, abrir el proyecto en Xcode y ejecutar pruebas sobre simuladores o dispositivos Apple. En consecuencia, la publicacion en App Store queda condicionada a la disponibilidad futura de hardware compatible y a una cuenta activa en Apple Developer.

## 6. Recomendacion academica

En la sustentacion se recomienda aclarar que:

- la aplicacion si fue preparada como proyecto hibrido con Capacitor
- la ausencia de iOS no responde a falta de implementacion funcional del frontend
- la restriccion corresponde al entorno de compilacion y distribucion exigido por Apple
- la metodologia del proyecto deja documentado el procedimiento pendiente para completar esa fase
