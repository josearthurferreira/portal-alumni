FROM node:20-slim
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["npm", "start"]
