# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# Baked in at build time: same-origin API path + base path this SPA is served
# under (Inframan routes this domain's /loop prefix to this service).
ARG VITE_API_URL=/loop-api
ARG VITE_LANDING_URL=/loop-landing
ARG VITE_BASE_PATH=/loop/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LANDING_URL=$VITE_LANDING_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html/loop
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
