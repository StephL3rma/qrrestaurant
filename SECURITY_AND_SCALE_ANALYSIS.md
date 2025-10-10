# Análisis de Seguridad y Escalabilidad - QR Restaurant Platform

**Fecha:** Enero 2025
**Objetivo:** Escalar de 1 restaurante a 1000+ restaurantes con seguridad enterprise

---

## 🚨 VULNERABILIDADES CRÍTICAS ACTUALES

### 1. **SECRETOS EXPUESTOS EN CÓDIGO**
**Severidad: CRÍTICA 🔴**

```yaml
# docker-compose.ssl.yml - LÍNEA 12, 14-16
DATABASE_URL=postgresql://qr_admin:%231999Stri@31.220.31.19:5432/qrrestaurant
NEXTAUTH_SECRET=development-secret-32-chars-long
STRIPE_SECRET_KEY=sk_test_51Rw6JgCKa9K8LC0J...
```

**Problema:**
- Contraseñas de base de datos hardcodeadas
- Claves de Stripe visibles en repositorio
- Si alguien accede a tu GitHub, puede:
  - Acceder a tu base de datos completa
  - Robar información de pagos
  - Modificar órdenes y precios

**Solución Inmediata:**
1. Usar archivos `.env` que NO estén en Git
2. Rotar todas las credenciales expuestas
3. Implementar secrets manager (AWS Secrets Manager, HashiCorp Vault)

---

### 2. **LOGS CON INFORMACIÓN SENSIBLE**
**Severidad: ALTA 🟠**

```typescript
// src/lib/auth.ts - LÍNEAS 60-63
console.log("🔑 Password comparison:", {
  inputPassword: credentials.password,  // ❌ PASSWORD EN LOGS
  isValid: isPasswordValid
})
```

**Problema:**
- Passwords aparecen en logs de Docker
- Cualquiera con acceso al servidor puede ver contraseñas
- Logs se pueden enviar a servicios de monitoreo (exponen passwords)

**Solución:**
- NUNCA loguear passwords
- Solo loguear eventos sin datos sensibles

---

### 3. **SIN RATE LIMITING**
**Severidad: CRÍTICA 🔴**

**Problema:**
- Cualquiera puede hacer 1000+ requests por segundo
- Permite ataques de fuerza bruta al login
- Permite DDoS fácilmente
- Sin rate limiting, un atacante puede:
  - Probar millones de passwords en minutos
  - Saturar tu servidor gratis
  - Crear miles de restaurantes fake

**Solución:**
- Implementar rate limiting por IP
- Limitar intentos de login (5 intentos máximo)
- Usar CAPTCHA después de 3 intentos fallidos

---

### 4. **DEVICE ID NO FUNCIONA CORRECTAMENTE**
**Severidad: MEDIA 🟡**

```typescript
// El deviceId se genera pero no se persiste correctamente
deviceId      String?     // For tracking orders by device
```

**Problema:**
- No hay modelo de Customer/User
- deviceId se genera cada sesión (no persiste)
- No se puede rastrear historial de clientes
- Imposible implementar reviews o loyalty programs

**Solución:**
- Crear modelo Customer con deviceId único
- Implementar fingerprinting del navegador
- Agregar login opcional para clientes

---

### 5. **SIN SEPARACIÓN DE ROLES**
**Severidad: ALTA 🟠**

**Problema:**
- Solo existe el rol "Restaurant Owner"
- No hay roles para:
  - Chef/Cocina (ver órdenes, cambiar status)
  - Mesero (tomar órdenes, servir)
  - Manager (analytics, no puede editar menú)
  - Super Admin (gestionar múltiples restaurantes)

**Solución Inmediata:**
- Crear modelo `User` separado de `Restaurant`
- Agregar campo `role: OWNER | CHEF | WAITER | MANAGER`
- Implementar permisos por rol

---

### 6. **BASE DE DATOS EXPUESTA A INTERNET**
**Severidad: CRÍTICA 🔴**

```yaml
DATABASE_URL=postgresql://qr_admin:%231999Stri@31.220.31.19:5432/qrrestaurant
# ⚠️ IP pública: 31.220.31.19
```

**Problema:**
- Base de datos PostgreSQL escuchando en IP pública
- Cualquiera puede intentar conectarse
- Alta probabilidad de ataques automatizados

**Solución:**
- Mover DB a red privada
- Solo permitir conexiones desde el servidor de aplicación
- Usar VPN o túnel SSH si necesitas acceso externo
- Configurar firewall (solo puerto 5432 desde IPs específicas)

---

### 7. **SIN AUTENTICACIÓN EN ENDPOINTS PÚBLICOS**
**Severidad: MEDIA 🟡**

```typescript
// Endpoints sin auth que podrían abusarse:
// - POST /api/orders (crear órdenes falsas)
// - GET /api/public/menu/:id (scraping de menús)
```

**Problema:**
- Cualquiera puede crear órdenes sin pagar
- Competencia puede robar tu menú completo
- Bots pueden saturar con órdenes falsas

**Solución:**
- Implementar tokens temporales por mesa (QR codes firmados)
- Rate limiting agresivo en endpoints públicos
- CAPTCHA en creación de órdenes

---

## 📊 PROBLEMAS DE ESCALABILIDAD

### 1. **ARQUITECTURA ACTUAL**

```
[Cliente] → [Nginx:8443] → [Next.js Container] → [PostgreSQL Público]
                              ↓
                         [Stripe API]
```

**Límites actuales:**
- **1 servidor**: Si se cae, TODO se cae
- **1 contenedor Next.js**: Máximo ~100-200 requests/segundo
- **1 base de datos**: Cuello de botella en ~1000 órdenes/segundo
- **Sin caché**: Cada request golpea la DB

**Capacidad estimada:**
- **Máximo:** 50-100 restaurantes activos simultáneos
- **Peak orders:** ~500 órdenes/hora antes de degradación

---

### 2. **ARQUITECTURA PARA 1000 RESTAURANTES**

```
                    [CloudFlare CDN]
                           ↓
                    [Load Balancer]
                     /     |      \
              [App1] [App2] [App3] ... [App-N]
                \      |      /
                 [Redis Cache]
                       ↓
           [PostgreSQL Primary (Write)]
              /       |        \
         [Replica1] [Replica2] [Replica3]
              \       |        /
               [Read Queries]
```

**Componentes necesarios:**

#### A. **Load Balancer (Nginx/HAProxy)**
- Distribuir tráfico entre múltiples servidores
- Health checks automáticos
- SSL termination

#### B. **Múltiples Instancias de App**
- Docker Swarm o Kubernetes
- Auto-scaling basado en CPU/memoria
- 3-5 instancias mínimo para alta disponibilidad

#### C. **Redis Cache Layer**
- Cachear menús (rara vez cambian)
- Cachear analytics (actualizar cada 5min)
- Sessions store
- Rate limiting storage

#### D. **PostgreSQL con Read Replicas**
- Master: Solo escrituras (órdenes, pagos)
- 2-3 Replicas: Solo lecturas (menús, analytics)
- Sharding por restaurantId después de 5000 restaurantes

#### E. **Object Storage (S3/CloudFlare R2)**
- Imágenes de menú
- QR codes
- Logos de restaurantes
- No almacenar en servidor

#### F. **Queue System (RabbitMQ/Redis)**
- Procesar órdenes asíncronamente
- Enviar notificaciones
- Generar reportes

---

### 3. **PERFORMANCE OPTIMIZATIONS**

#### **Caching Strategy**

```typescript
// Cachear menús por 5 minutos
const menu = await redis.get(`menu:${restaurantId}`)
if (!menu) {
  menu = await prisma.menuItem.findMany(...)
  await redis.setex(`menu:${restaurantId}`, 300, JSON.stringify(menu))
}
```

**Qué cachear:**
- Menús completos: 5-10 minutos
- Analytics diarias: 5 minutos
- Restaurant info: 30 minutos
- QR codes: 24 horas

**No cachear:**
- Órdenes en tiempo real
- Payment status
- Stock/availability real-time

#### **Database Indexing**

```sql
-- Índices críticos faltantes:
CREATE INDEX idx_orders_restaurant_created ON "Order"(restaurantId, createdAt DESC);
CREATE INDEX idx_orders_status ON "Order"(status);
CREATE INDEX idx_orders_device ON "Order"(deviceId);
CREATE INDEX idx_menu_restaurant ON "MenuItem"(restaurantId, available);
```

#### **Connection Pooling**

```typescript
// Prisma actual: Sin pool configurado
// Necesitas:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Configurar pool
  connectionLimit = 20
  poolTimeout = 30
}
```

---

## 🏗️ NUEVAS FUNCIONALIDADES REQUERIDAS

### 1. **SISTEMA DE ROLES Y PERMISOS**

```typescript
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  role         Role     @default(STAFF)
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  permissions  Json?    // Permisos granulares
  createdAt    DateTime @default(now())
}

enum Role {
  SUPER_ADMIN  // Gestiona múltiples restaurantes
  OWNER        // Dueño del restaurante
  MANAGER      // Gestiona operaciones
  CHEF         // Solo cocina
  WAITER       // Solo órdenes
  CASHIER      // Solo pagos
}
```

**Permisos por rol:**

| Permiso | OWNER | MANAGER | CHEF | WAITER | CASHIER |
|---------|-------|---------|------|--------|---------|
| Ver menú | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar menú | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver órdenes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cambiar status | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver analytics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar pagos | ✅ | ✅ | ❌ | ❌ | ✅ |

---

### 2. **DASHBOARD DE COCINA**

```typescript
// Nueva ruta: /kitchen
// Permisos: CHEF, MANAGER, OWNER

interface KitchenView {
  // Vista optimizada para tablet en cocina
  - Órdenes pendientes (CONFIRMED, PREPARING)
  - Timer por orden (tiempo desde creación)
  - Botones grandes: "Empezar" "Listo"
  - Agrupación por categoría (Entradas, Platos, Postres)
  - Alertas sonoras para nuevas órdenes
  - Sin información de pagos ni precios
}
```

**Features críticos:**
- Auto-refresh cada 5 segundos
- Notificaciones push cuando llega nueva orden
- Vista de impresora térmica (para imprimir tickets)
- Separación por estaciones (cocina caliente, fría, bar)

---

### 3. **SISTEMA DE CLIENTES**

```typescript
model Customer {
  id              String    @id @default(cuid())
  deviceId        String    @unique  // Fingerprint del navegador
  email           String?   @unique  // Optional login
  phone           String?
  name            String?
  loyaltyPoints   Int       @default(0)
  createdAt       DateTime  @default(now())
  orders          Order[]
  reviews         Review[]
  favoriteItems   FavoriteItem[]
}

model Review {
  id           String   @id @default(cuid())
  customerId   String
  restaurantId String
  orderId      String   @unique
  rating       Int      // 1-5 stars
  comment      String?
  response     String?  // Restaurant response
  createdAt    DateTime @default(now())
  customer     Customer @relation(fields: [customerId], references: [id])
}

model FavoriteItem {
  id         String   @id @default(cuid())
  customerId String
  menuItemId String
  customer   Customer @relation(fields: [customerId], references: [id])
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  @@unique([customerId, menuItemId])
}
```

**Device Fingerprinting mejorado:**

```typescript
// Generar deviceId único y persistente
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const fp = await FingerprintJS.load()
const result = await fp.get()
const deviceId = result.visitorId // Persistente 99.5% del tiempo
```

---

### 4. **APP MÓVIL (FUTURO)**

**Tecnologías recomendadas:**
- **React Native** + Expo (código compartido con web)
- **Flutter** (mejor performance nativa)

**Features de la app:**
- Login opcional para clientes
- Historial de órdenes
- Reordenar pedidos anteriores
- Programa de lealtad / puntos
- Reviews y ratings
- Notificaciones push (orden lista)
- Pago guardado

**Backend changes necesarios:**
- API REST/GraphQL limpia (separar de Next.js pages)
- JWT authentication para app
- Push notifications service (Firebase Cloud Messaging)

---

## 🔐 MEJORAS DE SEGURIDAD PRIORITARIAS

### **Fase 1: Urgente (Esta semana)**

1. **Mover secretos a .env**
```bash
# Crear .env (no commitear)
DATABASE_URL="..."
NEXTAUTH_SECRET="..."
STRIPE_SECRET_KEY="..."

# Agregar a .gitignore
.env
.env.local
.env.production
```

2. **Eliminar logs de passwords**
```typescript
// ELIMINAR estas líneas de auth.ts
console.log("🔑 Password comparison:", {
  inputPassword: credentials.password,  // ❌ ELIMINAR
  isValid: isPasswordValid
})
```

3. **Configurar firewall de base de datos**
```bash
# En servidor de DB
sudo ufw enable
sudo ufw allow from [IP_APP_SERVER] to any port 5432
sudo ufw deny 5432  # Bloquear todo lo demás
```

4. **Rotar credenciales**
- Cambiar password de PostgreSQL
- Regenerar NEXTAUTH_SECRET
- Rotar claves de Stripe (contact support si ya está comprometido)

---

### **Fase 2: Corto plazo (2-4 semanas)**

1. **Implementar Rate Limiting**
```typescript
// npm install express-rate-limit
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login, intenta en 15 minutos'
})

// Aplicar a /api/auth/*
```

2. **Agregar CSRF Protection**
```typescript
// Next.js tiene CSRF built-in, pero asegúrate de:
// - Usar SameSite cookies
// - Validar origin headers
// - Tokens CSRF en forms
```

3. **Implementar roles y permisos**
```typescript
// Crear middleware de permisos
export function requireRole(roles: Role[]) {
  return async (req, res, next) => {
    const session = await getServerSession(authOptions)
    if (!session || !roles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
```

4. **Sanitizar inputs**
```typescript
// npm install validator
import validator from 'validator'

// Sanitizar TODOS los inputs de usuario
const cleanEmail = validator.normalizeEmail(email)
const cleanComment = validator.escape(comment)
```

---

### **Fase 3: Mediano plazo (1-3 meses)**

1. **Implementar Redis Cache**
2. **Setup CI/CD pipeline**
3. **Agregar monitoring (Sentry, DataDog)**
4. **Implementar backup automático de DB**
5. **Setup staging environment**
6. **Agregar tests automatizados**

---

## 💰 COSTOS ESTIMADOS DE INFRAESTRUCTURA

### **Actual (1 restaurante):**
- **VPS:** $20-50/mes
- **Database:** Incluido en VPS
- **Total:** ~$50/mes

### **100 restaurantes:**
- **Load Balancer:** $20/mes (DigitalOcean)
- **App Servers (3x):** $40/mes cada = $120/mes
- **Database (managed):** $60/mes (DigitalOcean Postgres)
- **Redis:** $15/mes
- **S3/Object Storage:** $5-10/mes
- **Monitoring:** $50/mes (Sentry + logs)
- **Total:** ~$270/mes

### **1000 restaurantes:**
- **Load Balancer:** $50/mes (más robusto)
- **App Servers (10x auto-scale):** $400/mes
- **Database cluster:** $200/mes (replicas + backup)
- **Redis cluster:** $100/mes
- **CDN (CloudFlare):** $20/mes
- **Object Storage:** $50/mes
- **Monitoring + Logs:** $200/mes
- **Total:** ~$1,020/mes

**Revenue model sugerido:**
- $50-100/mes por restaurante
- Con 1000 restaurantes = $50,000-100,000/mes
- Costo infraestructura = $1,020/mes (2% de revenue)
- Margen saludable de 98%

---

## 🗺️ ROADMAP TÉCNICO

### **Q1 2025: Fundación sólida**
- ✅ Fix vulnerabilidades críticas
- ✅ Implementar rate limiting
- ✅ Mover secrets a variables de entorno
- ✅ Setup monitoring básico
- ✅ Implementar sistema de roles

### **Q2 2025: Escalabilidad**
- ⬜ Implementar Redis cache
- ⬜ Setup load balancer
- ⬜ Database read replicas
- ⬜ CI/CD pipeline
- ⬜ Automated backups

### **Q3 2025: Features avanzados**
- ⬜ Dashboard de cocina
- ⬜ Sistema de clientes robusto
- ⬜ Program de lealtad
- ⬜ Reviews y ratings
- ⬜ Analytics avanzados

### **Q4 2025: Mobile app**
- ⬜ API REST/GraphQL
- ⬜ React Native app (iOS + Android)
- ⬜ Push notifications
- ⬜ Offline mode
- ⬜ App Store launch

---

## 🎯 PRIORIDADES INMEDIATAS (ESTA SEMANA)

1. **Mover secretos fuera del código** ✅ CRÍTICO
2. **Eliminar logs de passwords** ✅ CRÍTICO
3. **Configurar firewall de DB** ✅ CRÍTICO
4. **Implementar rate limiting en login** 🔴 ALTA
5. **Crear modelo de roles** 🟠 MEDIA

## 📚 RECURSOS NECESARIOS

### **Servicios Cloud:**
- DigitalOcean / AWS / Google Cloud
- CloudFlare (CDN + DDoS protection)
- Redis Cloud o ElastiCache
- Managed PostgreSQL

### **Herramientas:**
- Sentry (error tracking)
- LogRocket o FullStory (session replay)
- DataDog o Grafana (monitoring)
- GitHub Actions (CI/CD)

### **Equipo (para escalar):**
- 1 DevOps engineer (gestionar infra)
- 1 Backend developer (optimizaciones)
- 1 Frontend developer (mobile app)
- 1 QA tester (testing automatizado)

---

## 🔍 CONCLUSIÓN

Tu software está bien arquitectado para un MVP, pero tiene **7 vulnerabilidades críticas** que deben arreglarse ANTES de escalar.

**Estado actual:**
- ✅ Funciona bien para 1-10 restaurantes
- ⚠️ Vulnerable a ataques
- ❌ No escalable más allá de 50 restaurantes

**Después de fixes:**
- ✅ Seguro para producción
- ✅ Escalable a 1000+ restaurantes
- ✅ Base sólida para features avanzados

**Tiempo estimado:**
- Fixes de seguridad: 1 semana
- Implementar escalabilidad: 2-3 meses
- Mobile app: 3-4 meses

**¿Quieres que empiece a implementar los fixes críticos ahora?**
