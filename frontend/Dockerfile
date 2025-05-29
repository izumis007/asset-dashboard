FROM node:20-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy all app files
COPY . .

# Build the app
RUN npm run build

# Change ownership of .next directory entirely (not just cache/)
RUN chown -R node:node .next

# Use non-root user
USER node

EXPOSE 3000

CMD ["npm", "start"]