FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g @angular/cli@latest
RUN npm install

COPY . .

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]
