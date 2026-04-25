# Step 1: Build the frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Step 2: Set up the production image
FROM node:20-slim
WORKDIR /app

# Copy backend files into /app/backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production
COPY backend/ ./backend/

# Copy built frontend into /app/frontend/dist
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set working directory to backend to run the server
WORKDIR /app/backend

# Expose the port
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
