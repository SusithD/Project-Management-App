FROM node:20-alpine

# Check if Yarn is already installed, if not install it
RUN yarn --version || npm install -g yarn

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy project files
COPY . .

# Build the application
RUN yarn build

# Set environment variables
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]