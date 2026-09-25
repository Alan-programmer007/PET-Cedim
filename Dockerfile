# Imagem de produção do Sistema de Anamneses CEDIM
FROM node:22-bookworm-slim

# openssl é exigido pelo engine do Prisma
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependências primeiro, para aproveitar o cache de camadas
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate && npm run build

# NODE_ENV só depois do build: as devDependencies (tailwind, postcss) são necessárias para compilar
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
