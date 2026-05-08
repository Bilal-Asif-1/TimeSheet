# Use Node image
FROM node:22

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of code
COPY . .

# Build TS → JS
RUN npm run build

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "dist/server.js"]
