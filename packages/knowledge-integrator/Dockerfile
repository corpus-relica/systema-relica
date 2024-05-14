# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npm run dev

# Build the TypeScript code
# RUN npx tsc --outDir /usr/src/app/dist

# # Create a separate directory for the dist output
# RUN mkdir -p /app/dist && cp -r /usr/src/app/dist /app
