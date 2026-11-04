FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html

EXPOSE 80