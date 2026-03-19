# Limitacion Tecnica de iOS

## 1. Estado actual

Con corte al `17 de marzo de 2026`, el proyecto ya tiene montada la plataforma iOS a nivel de repositorio, pero no cuenta con entorno tecnico disponible para compilarla, firmarla ni validarla. La limitacion no depende de la logica de negocio de la aplicacion, sino de la ausencia de herramientas y hardware requeridos por Apple para este proceso.

## 2. Hechos verificados

- el repositorio actual ya tiene carpeta `ios/`
- el proyecto ya tiene `@capacitor/ios` instalado en `package.json`
- el entorno de trabajo del equipo no dispone de un equipo Mac con Xcode
- el comando `npx cap doctor ios` confirma el error `Xcode is not installed`
- sin Mac y sin Xcode no es posible abrir en Xcode, compilar, firmar ni exportar una aplicacion iOS valida
- la publicacion en App Store tambien depende de una cuenta activa en Apple Developer

## 3. Impacto en el entregable

Esta restriccion implica lo siguiente:

- si es posible dejar el paquete iOS montado como proyecto nativo base dentro del repositorio
- no se puede generar archivo `.ipa` desde el entorno actual
- no se puede abrir el proyecto en Xcode para pruebas sobre simulador iOS o dispositivo iPhone
- no se puede completar el flujo de firma y distribucion por App Store Connect

La limitacion no bloquea la parte Android del entregable, pero si deja el componente iOS en estado `montado sin compilacion nativa` y debe explicarse de forma explicita en el informe.

## 4. Procedimiento previsto si el equipo obtiene un Mac

Si el equipo consigue acceso a un equipo Mac con Xcode, el procedimiento previsto es:

```powershell
npx cap sync ios
```

Despues de esos pasos, el flujo esperado seria:

1. abrir `ios/App/App.xcworkspace` en Xcode
2. configurar `Bundle Identifier`, equipo de firma y certificados
3. revisar permisos, esquemas URL y deep links requeridos por la autenticacion
4. seleccionar simulador o dispositivo fisico
5. compilar la app y validar funcionamiento basico
6. generar archivo para distribucion usando Xcode Organizer
7. subir el build a App Store Connect si existe membresia activa

## 5. Redaccion sugerida para el informe

Se deja a continuacion un texto base que el equipo puede adaptar al documento final:

> A fecha de 17 de marzo de 2026, el proyecto ya deja montada la plataforma iOS mediante Capacitor dentro del repositorio. Sin embargo, el equipo no dispone de un entorno Mac con Xcode, requisito tecnico indispensable para abrir el proyecto nativo, compilarlo, firmarlo y validarlo sobre simuladores o dispositivos Apple. Por esta razon, el entregable incluye el paquete Android probado y el paquete iOS preparado a nivel de estructura, pero sin generacion de archivo `.ipa` ni pruebas nativas en iPhone. La publicacion en App Store queda condicionada a la disponibilidad futura de hardware compatible y a una cuenta activa en Apple Developer.

## 6. Recomendacion academica

En la sustentacion se recomienda aclarar que:

- la aplicacion si fue preparada como proyecto hibrido con Capacitor para Android e iOS
- el paquete iOS si quedo montado en el repositorio
- la ausencia de pruebas iOS no responde a falta de implementacion funcional del frontend
- la restriccion corresponde al entorno de compilacion y distribucion exigido por Apple
- la metodologia del proyecto deja documentado el procedimiento pendiente para completar esa fase
