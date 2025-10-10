# Propuesta: Seguridad por Dispositivo (como Facebook)

## 🎯 Objetivo
Evitar que una sesión funcione en múltiples dispositivos/ubicaciones simultáneamente.

## 📱 ¿Cómo funciona?

### **Login:**
```
Usuario: Se loguea desde iPhone en México
Sistema:
  ✓ Guarda IP: 189.123.45.67
  ✓ Guarda User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0...)
  ✓ Crea sessionId único
  ✓ Asocia session con este dispositivo
```

### **Acceso posterior:**
```
Usuario: Intenta acceder al dashboard
Sistema:
  ✓ Verifica IP → ¿Es similar a la del login?
  ✓ Verifica User-Agent → ¿Es el mismo dispositivo?
  ✓ Verifica sessionId → ¿Está activo?

Si algo no coincide:
  ❌ Desloguea automáticamente
  ❌ Pide login de nuevo
  📧 Envía alerta: "Acceso desde nuevo dispositivo"
```

## 🔧 Implementación

### 1. Agregar tabla de sesiones:

```typescript
model Session {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique
  ipAddress    String
  userAgent    String
  device       String?  // "iPhone 13", "Chrome on Windows"
  location     String?  // "Mexico City, MX"
  lastActive   DateTime @default(now())
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user         Restaurant @relation(fields: [userId], references: [id])
}
```

### 2. Middleware de validación:

```typescript
export default withAuth(
  async function middleware(req) {
    const session = await getToken({ req })

    // Obtener info del request
    const currentIp = req.ip || req.headers.get('x-forwarded-for')
    const currentUA = req.headers.get('user-agent')

    // Buscar sesión en DB
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: session.jti }
    })

    if (!dbSession) {
      // No hay sesión en DB → Desloguear
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Verificar IP (permitir cambios en misma red)
    const ipMatch = isSimilarIP(currentIp, dbSession.ipAddress)
    const uaMatch = currentUA === dbSession.userAgent

    if (!ipMatch || !uaMatch) {
      // Dispositivo/ubicación diferente
      await prisma.session.delete({
        where: { id: dbSession.id }
      })

      // Opcional: Enviar email de alerta
      await sendSecurityAlert(dbSession.userId, {
        reason: 'Access from different device/location',
        ip: currentIp,
        device: currentUA
      })

      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Actualizar última actividad
    await prisma.session.update({
      where: { id: dbSession.id },
      data: { lastActive: new Date() }
    })

    return NextResponse.next()
  }
)
```

## ⚖️ PROS y CONTRAS

### ✅ Pros:
- Seguridad máxima
- Previene compartir sesiones
- Alertas de acceso sospechoso
- Control total de dispositivos activos

### ❌ Contras:
- Más complejo de implementar
- Query adicional en cada request (más lento)
- Molesto si cambias de WiFi frecuentemente
- Requiere gestión de "dispositivos confiables"

## 🎚️ NIVELES DE SEGURIDAD

### Nivel 1: BÁSICO (actual + mis fixes)
```
✓ Sesión expira en 8 horas
✓ Middleware bloquea sin sesión
✗ Una sesión funciona en cualquier dispositivo
```
**Bueno para:** Desarrollo, equipos pequeños

---

### Nivel 2: MODERADO (recomendado para producción)
```
✓ Todo lo anterior
✓ Límite de dispositivos activos (máximo 3)
✓ Lista de "dispositivos confiables"
✓ Alerta por email en login desde nuevo dispositivo
✗ Permite múltiples dispositivos simultáneos
```
**Bueno para:** 1-100 restaurantes

---

### Nivel 3: ESTRICTO (tipo Facebook/banco)
```
✓ Todo lo anterior
✓ Solo 1 dispositivo activo a la vez
✓ Desloguea automáticamente si detecta otro dispositivo
✓ Verificación 2FA en nuevos dispositivos
✓ Bloqueo por IP sospechosa
```
**Bueno para:** 1000+ restaurantes, datos financieros críticos

## 💰 Costo de implementación

### Nivel 1 (actual):
- Tiempo: Ya está ✅
- Complejidad: Baja
- Performance: Sin impacto

### Nivel 2:
- Tiempo: 2-3 días
- Complejidad: Media
- Performance: +5-10ms por request

### Nivel 3:
- Tiempo: 1-2 semanas
- Complejidad: Alta
- Performance: +20-30ms por request
- Requiere: Email service, 2FA service

## 🎯 Recomendación

Para tu etapa actual (desarrollo/primeros restaurantes):

**Nivel 1** es SUFICIENTE por ahora.

Implementa **Nivel 2** cuando:
- Tengas 10+ restaurantes
- Empieces a cobrar
- Necesites cumplir regulaciones

Implementa **Nivel 3** cuando:
- Tengas 100+ restaurantes
- Manejes datos financieros sensibles
- Necesites certificación de seguridad (PCI-DSS)

## 🚀 ¿Quieres implementar Nivel 2?

Puedo hacerlo ahora si quieres, pero te recomiendo:

1. **PRIMERO:** Arregla el bug actual (sesiones de 30 días)
2. **PRUEBA:** Verifica que el middleware funciona
3. **LUEGO:** Si necesitas más seguridad, implementamos Nivel 2

¿Qué prefieres?
