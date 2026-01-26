# Stage 1: Build Storybook
FROM node:alpine AS build-stage

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build the Storybook application
RUN npm run build:storybook

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production-stage

# Copy built Angular app to Nginx HTML directory
COPY --from=build-stage /usr/src/app/dist/storybook /usr/share/nginx/html

# Copy custom Nginx config
COPY ./projects/storybook/nginx.conf /etc/nginx/conf.d/default.conf
