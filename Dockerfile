FROM node:7-alpine
WORKDIR /frontend-app
ADD . /frontend-app
RUN npm install
EXPOSE 4000
CMD npm start