# Estágio 1: Build do React/Vite
FROM node:20-slim AS build

# Recebe a URL da API durante o build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:stable-alpine
# Copia o build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Configuração básica do Nginx para Single Page Application
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
