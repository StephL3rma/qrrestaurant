# Dockerfile para QR Restaurant
# Base stage
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Development stage
FROM base AS development

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto
EXPOSE 3000

# Variables de entorno para desarrollo
ENV NODE_ENV=development
ENV PORT=3000

# Comando de inicio para desarrollo (con hot reload)
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Instalar TODAS las dependencias para el build (incluyendo devDependencies como Tailwind)
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Construir la aplicación
RUN npm run build

# Limpiar devDependencies después del build para reducir tamaño
RUN npm prune --production

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]