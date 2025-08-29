FROM node:14.17.3-buster

# Create app directory
WORKDIR /usr/src/app
RUN chmod 777 /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./



# Set required environment variables
#ENV NODE_ENV production

RUN sed -i 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g' /etc/apt/sources.list && \
    sed -i 's|http://security.debian.org/debian-security|http://archive.debian.org/debian-security|g' /etc/apt/sources.list && \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until && \
    apt-get update && \
    apt-get install -y curl zip python3 make g++ && \
    npm install && \
    npm install pm2 -g && \
    rm -rf /var/lib/apt/lists/*

# RUN apt-get install -y curl zip python3 make g++ && \
# RUN npm install pm2 -g && \
# RUN rm -rf /var/lib/apt/lists/*

# Bundle app source
COPY . .

#EXPOSE 5000
CMD [ "npm", "run", "prod" ]