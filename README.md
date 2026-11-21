# Lobeto Tambos

Web pública y gestión local de stock con React, Node.js, Express y PostgreSQL.

## Preparación local

Se requiere Node.js 22.13 o superior y PostgreSQL. Crear una base vacía, por ejemplo `lobeto_stock`, y configurar `.env.local` siguiendo [.env.example](.env.example). Este archivo contiene secretos y está ignorado por Git. Definir un usuario y una contraseña exclusivos para el administrador; no usar la contraseña de PostgreSQL. La contraseña debe tener al menos 12 caracteres y `SESSION_SECRET` al menos 32. Se puede generar un secreto con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Instalar las dependencias con `npm install` y crear las tablas con `npm run migrate`. En dos terminales, ejecutar `npm run server` y `npm run dev`. Abrir la dirección indicada por Vite. El acceso a gestión se abre tocando cinco veces el logo de la cabecera en cinco segundos; también está disponible directamente en `/gestion`. El acceso oculto no es una medida de seguridad: la protección depende del inicio de sesión.

## Uso

- En **Catálogo**, crear proveedores y asignar, si corresponde, un código LT directamente a cada artículo. Varios artículos y marcas pueden compartirlo; no es obligatorio. Los detalles de producto permiten indicar marca y rubro, pero no son necesarios para cargar stock.
- Importar listas `.xlsx` o PDF de texto en **Importar listas**. Elegir columnas y revisar todas las filas seleccionadas, especialmente encabezados, códigos repetidos y nombres extraídos de PDF. Usar la búsqueda, los botones de código o **Mostrar repetidos** para localizar y corregir o desmarcar los duplicados antes de confirmar. Los PDF escaneados no tienen extracción OCR.
- La importación agrega o actualiza códigos y nombres del proveedor. No guarda precios, no modifica stock ni elimina códigos ausentes: estos se muestran para revisión y siguen activos. Los códigos LT y las vinculaciones existentes se conservan.
- Los remitos de entrada corresponden a un proveedor; los de salida permiten líneas de distintos proveedores. En cada línea se puede buscar por nombre, código de proveedor o código LT antes de elegir el artículo. El stock se controla por artículo y proveedor, incluso cuando varios comparten código LT. No se permiten salidas que lo dejen negativo. Los remitos son comprobantes internos imprimibles, no fiscales.
- En **Consultar stock**, buscar un artículo y elegir **Sumar stock de estantería** para registrar unidades ya existentes. Se pueden cargar en varias veces, antes o después de los remitos: cada carga se suma al saldo y queda en su propio historial, sin crear un remito. Cargar solo unidades que aún no se registraron para evitar contarlas dos veces.

Al actualizar una instalación anterior, detener el servidor antes de ejecutar `npm run migrate` y reiniciarlo después. La migración conserva saldos y remitos cuando cada producto y proveedor identifica un único artículo; si existen vínculos ambiguos, se detiene sin cambiar los datos para que puedan revisarse.

Ejecutar `npm test` con conexión a la base configurada para probar los movimientos en un esquema temporal aislado. `npm run test:api` verifica el manejo de errores de conexión; `npm run build` y `npm run lint` verifican el frontend.

## Neon y Render

El backend admite `DATABASE_URL` de PostgreSQL, incluida una URL de Neon con la configuración SSL que indique el proveedor. Sin `DATABASE_URL`, utiliza las variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` y `PGPASSWORD`. Ejecutar las migraciones explícitamente contra la base deseada.

El backend puede iniciarse en Render con `node server/index.js`, `NODE_ENV=production` y las variables `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD` y `SESSION_SECRET` configuradas como secretos. En producción escucha en `0.0.0.0` y en el puerto asignado por Render, confía en un proxy inverso y usa cookies seguras. Las migraciones deben ejecutarse explícitamente antes de iniciar el servicio. No usar `npm test` contra producción: crea y elimina un esquema temporal.

El frontend usa rutas `/api` del mismo origen. En [vercel.json](./vercel.json), reemplazar `https://reemplazar.invalid` por la URL HTTPS pública de Render, conservando `/api/:path*`. El dominio `.invalid` es un marcador y no funciona hasta reemplazarlo. El limitador de inicio de sesión usa memoria local del proceso y no coordina múltiples instancias. **El despliegue, el proxy, las cookies y los límites de acceso aún no se validaron en producción.**
