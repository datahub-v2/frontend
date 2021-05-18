FROM node:10.24.0-alpine3.11

WORKDIR /frontend-app
ADD . /frontend-app
RUN yarn
RUN yarn global add pm2
EXPOSE 4000
CMD [ "pm2-runtime", "yarn", "--interpreter", "sh", "--name", "frontend", "--", "start" ]
