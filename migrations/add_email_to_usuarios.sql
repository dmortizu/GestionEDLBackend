-- Agregar campo email a la tabla usuarios
-- Ejecuta este script si tu tabla usuarios no tiene un campo de email

-- Opción 1: Agregar campo 'email' (recomendado)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;

-- Opción 2: Si prefieres usar 'correo' en lugar de 'email'
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo VARCHAR(255) NULL;

-- Actualizar usuarios existentes con emails de ejemplo (opcional)
-- UPDATE usuarios SET email = CONCAT(username, '@medicinalegal.gov.co') WHERE email IS NULL;

