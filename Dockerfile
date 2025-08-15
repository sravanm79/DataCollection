# Use official Node.js LTS base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy dependency files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files into the container
COPY . .

# Create certs directory and set permissions
RUN mkdir -p /app/certs
RUN chmod 755 /app/certs

# Copy the wait-for-it script and make it executable
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Expose both HTTP and HTTPS ports
EXPOSE 3000 443


# Default command (not used since overridden by docker-compose)
CMD ["node", "new_app.js"]

