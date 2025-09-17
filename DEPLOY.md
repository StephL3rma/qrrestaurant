# 🚀 Guía de Deploy para Hostinger VPS

## 📋 Pre-requisitos

### 1. **Servidor Hostinger preparado:**
- Ubuntu 20.04+ o similar
- Acceso SSH como usuario con sudo
- Al menos 1GB RAM, 10GB disco

### 2. **Dominio configurado:**
- Dominio apuntando a la IP de tu servidor
- Registros A configurados

### 3. **Cuentas necesarias:**
- GitHub account (para código)
- Stripe account (claves de producción)

## 🎯 Deploy en 3 pasos

### **Paso 1: Subir código a GitHub**

```bash
# En tu PC (donde está el proyecto)
git init
git add .
git commit -m "Initial commit - QR Restaurant"
git remote add origin https://github.com/TU_USUARIO/qr-restaurant.git
git push -u origin main
```

### **Paso 2: Conectar a tu servidor Hostinger**

```bash
# Desde tu PC
ssh tu_usuario@tu_ip_servidor

# Una vez conectado al servidor
sudo apt update && sudo apt upgrade -y
```

### **Paso 3: Ejecutar script de deploy**

```bash
# En el servidor
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/qr-restaurant/main/deploy.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuración manual necesaria

### **1. Editar variables de entorno**
```bash
# En el servidor, después de ejecutar el script
cd /var/www/qr-restaurant
nano .env

# Actualizar estas líneas con tus valores reales:
NEXTAUTH_URL="https://tu-dominio.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_tu_clave_publica"
STRIPE_SECRET_KEY="sk_live_tu_clave_secreta"
```

### **2. Configurar SSL real (Let's Encrypt)**
```bash
# En el servidor
sudo certbot certonly --standalone -d tu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem /var/www/qr-restaurant/ssl/cert.pem
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem /var/www/qr-restaurant/ssl/key.pem

# Reiniciar nginx
cd /var/www/qr-restaurant
docker-compose restart nginx
```

## 🔄 Actualizar la aplicación

```bash
# Para hacer updates posteriores
cd /var/www/qr-restaurant
git pull origin main
docker-compose up -d --build
```

## 📊 Comandos útiles

```bash
# Ver logs
docker-compose logs -f

# Ver estado de contenedores
docker-compose ps

# Reiniciar todo
docker-compose restart

# Parar todo
docker-compose down

# Ver uso de recursos
docker stats

# Backup de base de datos
docker-compose exec postgres pg_dump -U qruser qrrestaurant > backup.sql

# Restaurar backup
docker-compose exec -i postgres psql -U qruser qrrestaurant < backup.sql
```

## 🔧 Solución de problemas

### **Si la aplicación no responde:**
```bash
docker-compose logs app
```

### **Si hay problemas de base de datos:**
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U qruser qrrestaurant
```

### **Si nginx no arranca:**
```bash
docker-compose logs nginx
# Verificar configuración SSL
```

## 🛡️ Seguridad

### **Configurar auto-renovación SSL:**
```bash
# Agregar a crontab
sudo crontab -e

# Agregar esta línea:
0 12 * * * /usr/bin/certbot renew --quiet && cd /var/www/qr-restaurant && docker-compose restart nginx
```

### **Backup automático:**
```bash
# Agregar a crontab
0 2 * * * cd /var/www/qr-restaurant && docker-compose exec postgres pg_dump -U qruser qrrestaurant > /backup/qr-$(date +%Y%m%d).sql
```

## 🎉 ¡Listo!

Tu aplicación QR Restaurant estará disponible en:
- **HTTP**: http://tu-dominio.com
- **HTTPS**: https://tu-dominio.com

### **Panel de administración:**
- URL: https://tu-dominio.com/dashboard
- Email: admin@restaurant.com
- Password: admin123 (¡CÁMBIALO INMEDIATAMENTE!)

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica que todos los contenedores estén corriendo: `docker-compose ps`
3. Asegúrate de que el dominio apunte a tu IP
4. Verifica que los puertos 80 y 443 estén abiertos