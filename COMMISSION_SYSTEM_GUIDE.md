# 💰 Sistema de Comisiones - Guía Completa

## 📊 CÓMO FUNCIONA EL DINERO

### Flujo de un pago de $100:

```
Cliente paga: $100.00
  ↓
Stripe cobra: $3.20 (2.9% + $0.30)
Dinero disponible: $96.80
  ↓
Tu plataforma toma: $1.00 (1% del total, configurable)
  ↓
Restaurante recibe: $95.80
```

**Importante:**
- Tu comisión se calcula sobre el **total** ($100), no sobre lo que queda después de Stripe
- Stripe cobra aparte (de su cuenta de Stripe Connect)
- El restaurante ve en su dashboard: "Ganaste $100" pero recibe $95.80

---

## 🎛️ SUPER ADMIN DASHBOARD

### Acceso:
**URL:** `https://app.novaracorporation.com:8443/super-admin`

**¿Quién puede entrar?**
Solo el email: `stephllerma@icloud.com`

### ¿Qué puedes hacer?

#### 1. **Ver todos los restaurantes**
```
- Nombre y contacto
- Cuántas órdenes han tenido
- Cuánto han facturado
- Cuánto HAS GANADO TÚ de cada uno
```

#### 2. **Cambiar comisión por restaurante**
```
Ejemplo:
- Restaurante A (nuevo): 2% comisión
- Restaurante B (premium): 0.5% comisión
- Restaurante C (amigo): 0% comisión
```

**Cómo:**
1. Click "Edit" en el restaurante
2. Cambia el número de comisión (ej: 2.5 = 2.5%)
3. Click "Save"
4. A partir de la próxima orden, se aplica la nueva comisión

#### 3. **Asignar tiers de pricing**
```
- Basic: Plan estándar
- Premium: Más features
- Enterprise: Todo incluido
```

(Por ahora solo es una etiqueta, pero podrías usarlo para dar features diferentes)

#### 4. **Notas internas**
```
Ejemplo:
"Contactó el 15 de enero, quiere factura mensual"
"Cliente VIP, cobrar 0.5%"
"Pendiente: configurar delivery"
```

Solo TÚ ves estas notas, el restaurante NO.

---

## 📈 ANALYTICS DEL RESTAURANTE

### Lo que ve el RESTAURANTE en su dashboard:

```
Total Revenue Today: $500
  ↓
Esto es ANTES de comisiones
```

### Lo que ve el SUPER ADMIN:

```
Restaurant A:
  Total Revenue: $10,000
  Platform Earnings (tu ganancia): $100 (1%)
  Restaurant keeps: $9,900 - Stripe fees
```

---

## 🔧 CONFIGURACIÓN EN BASE DE DATOS

### Opción 1: **DBeaver (recomendado)**

```sql
-- Ver comisiones actuales
SELECT name, "platformFeePercent", "pricingTier"
FROM "Restaurant";

-- Cambiar comisión de un restaurante específico
UPDATE "Restaurant"
SET "platformFeePercent" = 2.5
WHERE email = 'restaurant@example.com';

-- Dar tier premium a un restaurante
UPDATE "Restaurant"
SET "pricingTier" = 'premium'
WHERE id = 'cmg0zpqei0000p60wfbhdgzdo';
```

### Opción 2: **Super Admin Dashboard (más fácil)**

Solo entra a `/super-admin` y edita desde ahí.

---

## 💡 ESTRATEGIAS DE PRICING

### 1. **Freemium**
```
Primeros 3 meses: 0% comisión
Después: 1.5% comisión
```

### 2. **Por volumen**
```
< 100 órdenes/mes: 2% comisión
100-500 órdenes/mes: 1.5% comisión
> 500 órdenes/mes: 1% comisión
```

### 3. **Por features**
```
Basic (solo QR menu): 0.5%
Premium (analytics): 1%
Enterprise (app + cocina): 1.5%
```

### 4. **Suscripción + comisión**
```
$50/mes fijo + 0.5% por transacción
$100/mes fijo + 0% comisión
```

---

## 📊 REPORTES QUE NECESITAS

### 1. **Reporte mensual por restaurante**
```
Restaurant: Tacos El Taco
Period: January 2025

Total orders: 450
Total revenue: $15,000
Your commission (1%): $150
Stripe fees (estimated): $450
Restaurant received: ~$14,400
```

### 2. **Reporte consolidado (todos los restaurantes)**
```
Platform Summary - January 2025

Total restaurants: 15
Active restaurants: 12
Total platform revenue: $150,000
Your total earnings: $1,500
Average commission: 1.2%
```

### 3. **Proyección de ingresos**
```
Current MRR: $1,500/month
If 10 more restaurants @ $150/each: $3,000/month
If 100 restaurants @ $150/each: $15,000/month
```

---

## ⚖️ CONSIDERACIONES LEGALES

### 1. **Contratos**
Necesitas un contrato que especifique:
- Porcentaje de comisión
- Cuándo se cobra (por transacción, mensual, etc.)
- Cómo se puede cambiar
- Período de aviso para cambios

### 2. **Facturación**
```
Opción A: Cobrar automático mensual
Opción B: Restar de cada transacción (actual)
```

Recomendación: **Opción B** (actual) es más fácil de implementar y transparente.

### 3. **Reportes fiscales**
Al final del año, cada restaurante necesita saber:
- Cuánto facturaron
- Cuánto pagaron en comisiones
- Para declarar impuestos

---

## 🚀 PRÓXIMOS PASOS

### Implementar ahora:
1. ✅ Comisión personalizada por restaurante
2. ✅ Super Admin dashboard
3. ⬜ Aplicar cambios en base de datos

### Implementar pronto (1-2 semanas):
4. ⬜ Email mensual con reporte de comisiones
5. ⬜ Gráfica de earnings en analytics del restaurante
6. ⬜ Exportar reportes a CSV/PDF

### Implementar después (1-2 meses):
7. ⬜ Facturación automática
8. ⬜ Dashboard de proyecciones
9. ⬜ Comparativa entre restaurantes

---

## 🎯 CAMBIOS NECESARIOS EN BD

**En DBeaver o psql:**

```sql
-- 1. Agregar campos nuevos a Restaurant
ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "platformFeePercent" DOUBLE PRECISION DEFAULT 1.0;

ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "pricingTier" TEXT DEFAULT 'basic';

ALTER TABLE "Restaurant"
ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

-- 2. Verificar que se agregaron
SELECT * FROM "Restaurant" LIMIT 1;
```

---

## 📞 PREGUNTAS FRECUENTES

### P: ¿Puedo cobrar 0% a un restaurante?
**R:** Sí, pon `platformFeePercent = 0` en el super-admin dashboard.

### P: ¿El restaurante ve cuánto le cobro?
**R:** NO por ahora. Su analytics muestra el total bruto. Pero eventualmente sí deberían ver el desglose.

### P: ¿Cómo sé si Stripe ya cobró su fee?
**R:** Stripe cobra automáticamente antes de transferir al restaurante. Tú no te preocupas de eso.

### P: ¿Puedo cobrar más del 10%?
**R:** Técnicamente sí, pero no es recomendable. 1-3% es el estándar de la industria.

### P: ¿Qué pasa con efectivo?
**R:** Si el cliente paga en efectivo, NO hay comisión de Stripe, pero SÍ hay tu comisión. Eso hay que cobrarlo manualmente o implementar facturación mensual.

---

## 💰 CALCULADORA RÁPIDA

```javascript
// Ejemplo de orden de $100

// Stripe fees
const stripeFee = (100 * 0.029) + 0.30 // $3.20

// Tu comisión (1%)
const platformFee = 100 * 0.01 // $1.00

// Lo que recibe el restaurante
const restaurantReceives = 100 - stripeFee - platformFee // $95.80
```

**Variación por comisión:**
```
0.5% comisión → Restaurante recibe $96.30
1.0% comisión → Restaurante recibe $95.80
1.5% comisión → Restaurante recibe $95.30
2.0% comisión → Restaurante recibe $94.80
```

---

¿Alguna pregunta? Aquí estoy para ayudarte a configurar todo.
