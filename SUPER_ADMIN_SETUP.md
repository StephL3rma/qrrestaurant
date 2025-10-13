# 👑 Super Admin Setup Guide

## 🎯 SISTEMA COMPLETAMENTE SEPARADO

Ahora tienes **DOS sistemas independientes**:

### 1. **Sistema de Restaurantes**
- Login: `/auth/signin`
- Email: `stephanielerma7@gmail.com` (o cualquier restaurante)
- Dashboard: `/dashboard`
- Gestiona: Su propio restaurante

### 2. **Sistema de Super Admin**
- Login: `/super-admin/login`
- Email: **Cuenta separada** (creas tú)
- Dashboard: `/super-admin`
- Gestiona: TODOS los restaurantes de la plataforma

---

## 🚀 SETUP PASO A PASO

### **PASO 1: Actualizar Base de Datos**

**En DBeaver o psql:**

```sql
-- Crear tabla SuperAdmin
CREATE TABLE IF NOT EXISTS "SuperAdmin" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agregar campos de comisión a Restaurant (si no existen)
ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "platformFeePercent" DOUBLE PRECISION DEFAULT 1.0;

ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "pricingTier" TEXT DEFAULT 'basic';

ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
```

---

### **PASO 2: Crear Tu Cuenta de Super Admin**

**Opción A: Usando la API (recomendado)**

Abre Postman, Thunder Client, o usa curl:

```bash
curl -X POST https://app.novaracorporation.com:8443/api/super-admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@novaracorporation.com",
    "password": "TuPasswordSuperSeguro123!",
    "name": "Stephanie Lerma"
  }'
```

**O en navegador:**
1. Abre las DevTools (F12)
2. Ve a Console
3. Pega esto:

```javascript
fetch('https://app.novaracorporation.com:8443/api/super-admin/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@novaracorporation.com',
    password: 'TuPasswordSeguro123!',
    name: 'Stephanie Lerma'
  })
})
.then(r => r.json())
.then(data => console.log(data))
```

**Opción B: Directamente en la base de datos**

```sql
-- Generar password hash primero (usa bcrypt con 10 rounds)
-- Por ejemplo, para password "Admin123!" el hash sería:
-- $2a$10$...

INSERT INTO "SuperAdmin" (id, email, password, name, "createdAt", "updatedAt")
VALUES (
  'cuid_generado_aqui', -- Genera un CUID único
  'admin@novaracorporation.com',
  '$2a$10$abc123...', -- Hash de tu password
  'Stephanie Lerma',
  NOW(),
  NOW()
);
```

---

### **PASO 3: Login como Super Admin**

1. Ve a: `https://app.novaracorporation.com:8443/super-admin/login`
2. Ingresa:
   - **Email:** `admin@novaracorporation.com` (o el que creaste)
   - **Password:** Tu password
3. Click "Sign In"
4. Serás redirigido a `/super-admin` con la lista de restaurantes

---

### **PASO 4: IMPORTANTE - Deshabilitar Registro**

**Después de crear tu cuenta, deshabilita el endpoint de registro:**

**En el servidor:**
```bash
# Comentar o eliminar el archivo de registro
rm src/app/api/super-admin/auth/register/route.ts

# O renombrarlo
mv src/app/api/super-admin/auth/register/route.ts src/app/api/super-admin/auth/register/route.ts.disabled
```

Esto previene que alguien más cree cuentas de super admin.

---

## 🔐 SEGURIDAD

### **Dos Tokens Separados**

```
Restaurant Login:
  ↓
NextAuth session cookie
  ↓
Válido para /dashboard, /dashboard/*

Super Admin Login:
  ↓
JWT token en localStorage
  ↓
Válido para /super-admin, /api/super-admin/*
```

### **No hay conflicto**
- Puedes estar logueado como restaurante Y super admin simultáneamente
- Son sistemas completamente independientes
- Usan diferentes métodos de autenticación

---

## 📱 CÓMO USARLO

### **Como Restaurant Owner:**

1. Login: `/auth/signin`
2. Email: `stephanielerma7@gmail.com`
3. Ve tu dashboard: `/dashboard`
4. Ves SOLO tu restaurante

### **Como Super Admin:**

1. Login: `/super-admin/login`
2. Email: `admin@novaracorporation.com` (tu cuenta de admin)
3. Ve super admin panel: `/super-admin`
4. Ves TODOS los restaurantes
5. Puedes:
   - Cambiar comisiones
   - Ver ganancias de cada restaurante
   - Agregar notas internas
   - Asignar pricing tiers

---

## 🎛️ FUNCIONALIDADES DEL SUPER ADMIN

### **Dashboard Principal**

```
📊 Summary Cards:
- Total Restaurants: 15
- Platform Earnings: $1,500 (tu ganancia total)
- Total Revenue: $150,000 (de todos los restaurants)
- Avg Commission: 1.2%

📋 Tabla de Restaurantes:
Por cada restaurante ves:
- Nombre y contacto
- Estadísticas (órdenes, items, mesas)
- Comisión actual (%)
- Revenue total
- TU ganancia de ese restaurante
- Botón "Edit" para cambiar comisión
```

### **Editar Restaurante**

1. Click "Edit" en cualquier restaurante
2. Cambia:
   - **Commission %:** 0%, 0.5%, 1%, 2%, etc.
   - **Tier:** basic, premium, enterprise
   - **Internal Notes:** Notas privadas (solo tú las ves)
3. Click "Save"
4. A partir de la siguiente orden, se aplica la nueva comisión

---

## 🔧 TROUBLESHOOTING

### **"Unauthorized" al entrar a /super-admin**

```
Solución:
1. Verifica que creaste la cuenta de super admin
2. Verifica que el token esté en localStorage
3. Abre DevTools → Application → Local Storage
4. Busca "superAdminToken"
5. Si no existe, vuelve a hacer login
```

### **No veo ningún restaurante**

```
Solución:
1. Verifica que existan restaurantes en la DB
2. Abre DevTools → Network
3. Ve el request a /api/super-admin/restaurants
4. Si devuelve 401/403 → Problema de autenticación
5. Si devuelve [] → No hay restaurantes creados
```

### **Cambié la comisión pero sigue igual**

```
Problema: Los pagos YA creados usan la comisión anterior
Solución: Los cambios se aplican a NUEVAS órdenes
Para verificar: Crea una orden nueva y verifica el PaymentLog
```

---

## 📊 VERIFICAR QUE FUNCIONA

### **Test 1: Login**
```
✓ Ir a /super-admin/login
✓ Ingresar credenciales
✓ Ser redirigido a /super-admin
✓ Ver lista de restaurantes
```

### **Test 2: Ver Earnings**
```
✓ Ver columna "Your Earnings" en la tabla
✓ Debe mostrar tu ganancia por restaurante
✓ Summary card debe mostrar total de ganancias
```

### **Test 3: Cambiar Comisión**
```
✓ Click "Edit" en un restaurante
✓ Cambiar comisión de 1% a 2%
✓ Click "Save"
✓ Crear una orden en ese restaurante
✓ Verificar en PaymentLog que platformFeePercent = 2.0
```

---

## 🚀 DEPLOY

### **En Windows (local):**
```bash
git add .
git commit -m "Add separate Super Admin system with JWT authentication"
git push origin main
```

### **En el Servidor:**
```bash
# 1. Actualizar código
git pull origin main --no-rebase

# 2. Aplicar cambios de DB (ejecuta los SQL de arriba)

# 3. Regenerar Prisma
docker exec -it qr-restaurant-ssl-app npx prisma generate

# 4. Reiniciar
docker-compose -f docker-compose.ssl.yml restart app
```

---

## 🔒 PRÓXIMOS PASOS DE SEGURIDAD

1. **2FA para Super Admin** (Google Authenticator)
2. **Logs de acciones** (quién cambió qué y cuándo)
3. **Multiple Super Admins** (agregar más cuentas)
4. **Permisos granulares** (super admin vs admin vs viewer)

---

## 📞 PREGUNTAS FRECUENTES

### **P: ¿Puedo tener múltiples super admins?**
**R:** Sí, solo crea más cuentas usando `/api/super-admin/auth/register` antes de deshabilitarlo.

### **P: ¿El restaurante ve que le cobro comisión?**
**R:** Por ahora NO. Su dashboard muestra el total bruto. Eventualmente puedes mostrarles el desglose.

### **P: ¿Puedo cambiar comisiones retroactivamente?**
**R:** NO. Los pagos ya procesados quedan con la comisión que tenían. Solo afecta nuevas órdenes.

### **P: ¿Qué pasa si olvido mi password de super admin?**
**R:** Necesitas resetear en la base de datos manualmente o crear un endpoint de "forgot password".

### **P: ¿Dónde está mi password de super admin?**
**R:** Está hasheado en la tabla `SuperAdmin`. NO se puede recuperar, solo resetear.

---

**¿Listo para implementarlo?** 🚀

Email de Super Admin sugerido: `admin@novaracorporation.com`
Password: [Elige uno seguro, guárdalo en un password manager]
