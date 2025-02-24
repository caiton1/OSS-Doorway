# Use an official Node.js image
FROM ubuntu:latest

# Set the working directory inside the container
WORKDIR /app/OSS-doorway

RUN apt-get update && apt-get install -y \
  python3 python3-pip python3-venv \ 
  curl \
  && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/
# Copy package.json to install dependencies
COPY package.json ./

# Install dependencies
RUN npm install

# Now copy the entire app source code
COPY . .  

#virutal env for python 
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

#Install pip dependencies
RUN pip3 install --upgrade pip && pip3 install -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose the port if needed
EXPOSE 3000

# Ensure dependencies are installed before starting the application
CMD ["sh", "-c", "npm install && npm run start"]
