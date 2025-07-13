# Use official Node.js LTS base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy dependency files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files into the container
COPY . .

# Copy the wait-for-it script and make it executable
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Expose the port your app runs on
EXPOSE 3000

# Run your app (entry point)
CMD ["node", "new_app.js"]
