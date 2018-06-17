FROM node:8-alpine
WORKDIR /frontend-app
ADD . /frontend-app
RUN yarn
EXPOSE 4000
CMD yarn start
