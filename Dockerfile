FROM node:alpine
RUN apk update
RUN apk upgrade
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
# If you are building your code for production
RUN npm ci --omit=dev

COPY plugin* C.xml F.json ./
COPY recognizr.html server.js ./
ENV PORT=${PORT:-8080}
ENV SCC=${SCC}
ENV SCS=${SCS}
EXPOSE $PORT
CMD [ "node", "server.js" ]
