FROM node:8
WORKDIR /frontend-app
ADD . /frontend-app
RUN yarn
EXPOSE 4000
CMD yarn start
