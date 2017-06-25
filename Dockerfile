FROM node:7-alpine
WORKDIR /
COPY package.json /
RUN npm install
COPY . /
EXPOSE 4000
CMD [ "npm", "start" ]

