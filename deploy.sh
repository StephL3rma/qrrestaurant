#!/bin/bash

# 🚀 Script de Deploy Automático para QR Restaurant
# Para usar en tu servidor Hostinger

set -e

echo "🚀 Iniciando deploy de QR Restaurant..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_NAME="qr-restaurant"
REPO_URL="https://github.com/TU_USUARIO/qr-restaurant.git"  # Cambiar por tu repo
DOMAIN="tu-dominio.com"  # Cambiar por tu dominio

# Funciones auxiliares
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

# Verificar si Docker está instalado
check_docker() {
    print_step "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Instalando..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
        print_success "Docker instalado. Reinicia la sesión para aplicar cambios."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Instalando..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    print_success "Docker y Docker Compose están disponibles"
}

# Crear directorio del proyecto
setup_project() {
    print_step "Configurando directorio del proyecto..."

    # Crear directorio si no existe
    sudo mkdir -p /var/www/$PROJECT_NAME
    sudo chown $USER:$USER /var/www/$PROJECT_NAME
    cd /var/www/$PROJECT_NAME

    print_success "Directorio configurado: /var/www/$PROJECT_NAME"
}

# Clonar o actualizar repositorio
update_code() {
    print_step "Actualizando código..."

    if [ -d ".git" ]; then
        print_step "Actualizando repositorio existente..."
        git pull origin main
    else
        print_step "Clonando repositorio..."
        git clone $REPO_URL .
    fi

    print_success "Código actualizado"
}

# Configurar variables de entorno
setup_env() {
    print_step "Configurando variables de entorno..."

    if [ ! -f ".env" ]; then
        print_warning "Archivo .env no encontrado. Creando desde template..."
        cp .env.production .env

        # Generar contraseñas seguras
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        NEXTAUTH_SECRET=$(openssl rand -base64 32)

        # Reemplazar placeholders
        sed -i "s/TU_PASSWORD_SEGURO/$DB_PASSWORD/g" .env
        sed -i "s/TU_SECRET_MUY_SEGURO_DE_32_CARACTERES/$NEXTAUTH_SECRET/g" .env
        sed -i "s/tu-dominio.com/$DOMAIN/g" .env

        print_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus claves de Stripe antes de continuar"
        print_warning "Archivo ubicado en: /var/www/$PROJECT_NAME/.env"

        read -p "¿Has configurado las claves de Stripe en .env? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Por favor configura las claves de Stripe y ejecuta el script nuevamente"
            exit 1
        fi
    fi

    print_success "Variables de entorno configuradas"
}

# Configurar SSL con Let's Encrypt
setup_ssl() {
    print_step "Configurando SSL..."

    if [ ! -d "ssl" ]; then
        mkdir ssl

        # Instalar certbot si no existe
        if ! command -v certbot &> /dev/null; then
            sudo apt update
            sudo apt install -y certbot
        fi

        # Generar certificado temporal para desarrollo
        print_step "Generando certificado temporal..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=MX/ST=State/L=City/O=Organization/CN=$DOMAIN"

        print_warning "Certificado temporal creado. Para producción, configura Let's Encrypt manualmente"
        print_warning "Comando: sudo certbot certonly --standalone -d $DOMAIN"
    fi

    print_success "SSL configurado"
}

# Construir y ejecutar contenedores
deploy_containers() {
    print_step "Construyendo y desplegando contenedores..."

    # Detener contenedores existentes
    docker-compose down

    # Construir y ejecutar
    docker-compose up -d --build

    # Esperar a que la base de datos esté lista
    print_step "Esperando a que la base de datos esté lista..."
    sleep 10

    # Ejecutar migraciones
    print_step "Ejecutando migraciones de base de datos..."
    docker-compose exec app npx prisma db push

    print_success "Contenedores desplegados exitosamente"
}

# Verificar deployment
verify_deployment() {
    print_step "Verificando deployment..."

    # Verificar que los contenedores estén corriendo
    if [ $(docker-compose ps -q | wc -l) -eq 3 ]; then
        print_success "Todos los contenedores están corriendo"
    else
        print_error "Algunos contenedores no están corriendo"
        docker-compose ps
        exit 1
    fi

    # Verificar conectividad
    sleep 5
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Aplicación responde correctamente"
    else
        print_warning "La aplicación podría estar iniciando aún"
    fi
}

# Configurar firewall
setup_firewall() {
    print_step "Configurando firewall..."

    if command -v ufw &> /dev/null; then
        sudo ufw allow 22    # SSH
        sudo ufw allow 80    # HTTP
        sudo ufw allow 443   # HTTPS
        sudo ufw --force enable
        print_success "Firewall configurado"
    else
        print_warning "UFW no está instalado. Configura el firewall manualmente"
    fi
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "🍽️  QR Restaurant Deploy Script"
    echo "================================"
    echo -e "${NC}"

    check_docker
    setup_project
    update_code
    setup_env
    setup_ssl
    deploy_containers
    verify_deployment
    setup_firewall

    echo -e "${GREEN}"
    echo "🎉 ¡Deploy completado exitosamente!"
    echo "=================================="
    echo "🌐 Tu aplicación está disponible en:"
    echo "   HTTP:  http://$DOMAIN"
    echo "   HTTPS: https://$DOMAIN"
    echo ""
    echo "📋 Próximos pasos:"
    echo "   1. Configura tu dominio para apuntar a esta IP"
    echo "   2. Configura Let's Encrypt para SSL real:"
    echo "      sudo certbot certonly --standalone -d $DOMAIN"
    echo "   3. Reinicia nginx: docker-compose restart nginx"
    echo ""
    echo "📊 Monitoreo:"
    echo "   - Logs: docker-compose logs -f"
    echo "   - Estado: docker-compose ps"
    echo "   - Reiniciar: docker-compose restart"
    echo -e "${NC}"
}

# Ejecutar script principal
main "$@"