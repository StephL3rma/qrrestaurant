#!/bin/bash

# 🚀 Script de Deploy para DESARROLLO en Hostinger
# Mantiene credenciales de prueba pero en entorno de servidor real

set -e

echo "🧪 Iniciando deploy de DESARROLLO para QR Restaurant..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuración para desarrollo
PROJECT_NAME="qr-restaurant-dev"
REPO_URL="https://github.com/TU_USUARIO/qr-restaurant.git"
DOMAIN="dev-qr.tu-dominio.com"  # Subdominio para desarrollo

# Verificar Docker
check_docker() {
    print_step "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Instalando..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
        print_warning "Docker instalado. Reinicia la sesión para aplicar cambios."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Instalando..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    print_success "Docker disponible"
}

# Configurar proyecto
setup_project() {
    print_step "Configurando directorio de desarrollo..."
    sudo mkdir -p /var/www/$PROJECT_NAME
    sudo chown $USER:$USER /var/www/$PROJECT_NAME
    cd /var/www/$PROJECT_NAME
    print_success "Directorio: /var/www/$PROJECT_NAME"
}

# Actualizar código
update_code() {
    print_step "Actualizando código..."
    if [ -d ".git" ]; then
        git pull origin main
    else
        git clone $REPO_URL .
    fi
    print_success "Código actualizado"
}

# Configurar variables de desarrollo
setup_dev_env() {
    print_step "Configurando entorno de desarrollo..."

    # Copiar configuración de desarrollo
    cp .env.development .env

    print_success "Variables de desarrollo configuradas"
    print_warning "🧪 Usando credenciales de PRUEBA (perfecto para desarrollo)"
}

# SSL temporal para desarrollo
setup_dev_ssl() {
    print_step "Configurando SSL temporal..."

    if [ ! -d "ssl" ]; then
        mkdir ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=MX/ST=Dev/L=Development/O=QR-Restaurant-Dev/CN=$DOMAIN"
    fi

    print_success "SSL temporal configurado"
}

# Deploy para desarrollo
deploy_dev() {
    print_step "Desplegando entorno de desarrollo..."

    # Usar docker-compose de desarrollo
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d --build

    print_step "Esperando a que la base de datos esté lista..."
    sleep 15

    # Ejecutar migraciones
    print_step "Configurando base de datos..."
    docker-compose -f docker-compose.dev.yml exec app npx prisma db push

    print_success "Entorno de desarrollo desplegado"
}

# Verificar
verify_dev() {
    print_step "Verificando entorno de desarrollo..."

    if [ $(docker-compose -f docker-compose.dev.yml ps -q | wc -l) -eq 3 ]; then
        print_success "Todos los contenedores están corriendo"
    else
        print_error "Algunos contenedores fallan"
        docker-compose -f docker-compose.dev.yml ps
        exit 1
    fi

    sleep 5
    if curl -f http://localhost > /dev/null 2>&1; then
        print_success "Aplicación responde en HTTP"
    fi
}

# Firewall para desarrollo
setup_dev_firewall() {
    print_step "Configurando firewall para desarrollo..."

    if command -v ufw &> /dev/null; then
        sudo ufw allow 22    # SSH
        sudo ufw allow 80    # HTTP
        sudo ufw allow 443   # HTTPS
        sudo ufw allow 3000  # Next.js directo (para debug)
        sudo ufw --force enable
        print_success "Firewall configurado para desarrollo"
    fi
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "🧪 QR Restaurant - Deploy de DESARROLLO"
    echo "======================================="
    echo "• Entorno: Servidor de producción"
    echo "• Credenciales: Stripe TEST"
    echo "• Base de datos: Temporal"
    echo "• SSL: Certificado temporal"
    echo "• Hot reload: Activado"
    echo "======================================="
    echo -e "${NC}"

    check_docker
    setup_project
    update_code
    setup_dev_env
    setup_dev_ssl
    deploy_dev
    verify_dev
    setup_dev_firewall

    echo -e "${GREEN}"
    echo "🎉 ¡Entorno de DESARROLLO listo!"
    echo "================================"
    echo "🌐 Acceso:"
    echo "   HTTP:  http://$DOMAIN"
    echo "   HTTPS: https://$DOMAIN"
    echo "   Directo: http://IP_SERVIDOR"
    echo ""
    echo "🧪 Características de desarrollo:"
    echo "   ✅ Credenciales de prueba Stripe"
    echo "   ✅ Hot reload activado"
    echo "   ✅ Logs detallados"
    echo "   ✅ Sin rate limiting"
    echo "   ✅ SSL temporal"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   Logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Reiniciar: docker-compose -f docker-compose.dev.yml restart"
    echo "   Actualizar: git pull && docker-compose -f docker-compose.dev.yml up -d --build"
    echo ""
    echo "📱 Dashboard: https://$DOMAIN/dashboard"
    echo "   Email: admin@restaurant.com"
    echo "   Pass: admin123"
    echo -e "${NC}"
}

main "$@"