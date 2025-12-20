# Configuración de Envío de Emails

Este documento explica cómo configurar el envío de emails para el sistema de recuperación de contraseña.

## Opciones de Configuración

### Opción 1: SMTP Genérico

Configura las siguientes variables en tu archivo `.env`:

```env
SMTP_HOST=smtp.tu-servidor.com
SMTP_PORT=587
SMTP_SECURE=false  # true para puerto 465, false para otros
SMTP_USER=tu_usuario_smtp
SMTP_PASS=tu_contraseña_smtp
EMAIL_FROM=noreply@tudominio.com
```

### Opción 2: Gmail

Para usar Gmail, necesitas crear una "Contraseña de aplicación":

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en 2 pasos
3. Ve a "Contraseñas de aplicaciones"
4. Genera una nueva contraseña para "Correo"
5. Usa esa contraseña en la configuración

```env
GMAIL_USER=tu_email@gmail.com
GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion
```

### Opción 3: Otros Servicios

El sistema también funciona con otros proveedores SMTP como:
- Outlook/Office 365
- SendGrid
- Mailgun
- Amazon SES
- Cualquier servidor SMTP estándar

## Campo Email en la Base de Datos

**IMPORTANTE**: La tabla `usuarios` debe tener un campo para almacenar el email. Puedes usar:

- `email` (recomendado)
- `correo`
- Cualquier otro nombre que configures en el código

### Agregar campo email a la tabla usuarios:

```sql
ALTER TABLE usuarios ADD COLUMN email VARCHAR(255) NULL;
-- O si prefieres otro nombre:
ALTER TABLE usuarios ADD COLUMN correo VARCHAR(255) NULL;
```

## Variables de Entorno Requeridas

```env
# URL del frontend (para enlaces en emails)
FRONTEND_URL=http://localhost:5173  # En desarrollo
# FRONTEND_URL=https://tudominio.com  # En producción
```

## Verificación

El sistema verificará automáticamente si el email está configurado. Si no lo está:

- En **desarrollo**: Mostrará el enlace en la consola del servidor
- En **producción**: Registrará un error (asegúrate de configurar el email)

## Pruebas

Para probar el envío de emails:

1. Configura las variables de entorno
2. Asegúrate de que el usuario tenga un email en la base de datos
3. Solicita un restablecimiento de contraseña
4. Revisa la bandeja de entrada del email configurado

## Solución de Problemas

### El email no se envía

1. Verifica que las credenciales SMTP sean correctas
2. Revisa los logs del servidor para ver errores específicos
3. Asegúrate de que el puerto SMTP no esté bloqueado por firewall
4. Para Gmail, verifica que uses una "Contraseña de aplicación", no tu contraseña normal

### El usuario no tiene email

- Agrega el campo email a la tabla usuarios
- Actualiza los usuarios existentes con sus emails
- El sistema mostrará el enlace en consola si no hay email configurado

