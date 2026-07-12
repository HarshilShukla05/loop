# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_BASE_PATH defaults to "" (unset) so the existing Cloudflare Pages
# build at the domain root is unaffected; Inframan's build sets it to
# /loop-landing to match this service's routed path prefix.
ARG NEXT_BASE_PATH=/loop-landing
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/out /usr/share/nginx/html/loop-landing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
