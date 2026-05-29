# Observatorio Competitivo Hotelero - v5 editable

## Clave admin
`admin123`

## Qué incluye
- Dashboard general solo con competencia: Hilton, Wyndham y Sheraton.
- Dashboard individual por marca: Hilton, Wyndham, Sheraton y Oro Verde.
- Interacción general:
  - Reels = views + likes + comentarios + compartidos.
  - Post/Carrusel = likes + comentarios + compartidos.
- Contenidos destacados visuales:
  - Reels: views, luego likes, comentarios, compartidos.
  - Post/Carrusel: likes, luego comentarios, compartidos.
- Calendario mensual interactivo.
- Meses dinámicos.
- Admin con contraseña cada vez.
- Admin permite agregar, buscar, editar y eliminar publicaciones agregadas desde el panel.
- Los datos del Excel inicial no se editan desde el admin para proteger la base histórica.

## Editar publicaciones
Solo se pueden editar las publicaciones cuyo origen es `Admin`.
Las publicaciones de `Excel inicial` quedan protegidas como data base.

## Firebase
Por defecto está desactivado.

Para activarlo:
1. Abre `firebase.js`.
2. Cambia `USE_FIREBASE = false` a `true`.
3. Pega tu configuración real de Firebase.
4. Crea una colección `posts`.

La función de editar ya está preparada para Firestore.


## Buscar y eliminar
En el panel admin, debajo del formulario, puedes buscar publicaciones agregadas por:
- marca
- título
- fecha
- formato
- categoría

Cada publicación agregada desde admin tiene:
- Editar
- Eliminar con confirmación

Los registros de Excel inicial siguen protegidos.
