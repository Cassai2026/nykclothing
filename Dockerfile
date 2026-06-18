# Use a super lightweight, secure version of Node.js
FROM node:18-alpine

# Create a dedicated folder inside the container for our app
WORKDIR /app

# Copy over the toolbelt files first
COPY package*.json ./

# Install only the core engines (no developer tools or test bots)
RUN npm install --omit=dev

# Copy the rest of our beautiful code into the container
COPY . .

# Generate the Prisma database client inside the container
RUN npx prisma generate

# Open up port 3000 so the internet can talk to it
EXPOSE 3000

# The command to turn the server on
CMD ["npm", "start"]
