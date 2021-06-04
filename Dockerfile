FROM node:10.24.0-alpine3.11

RUN apk update && apk upgrade && apk add --no-cache git
WORKDIR /frontend-app
ADD . /frontend-app
RUN git submodule init && git submodule update 
RUN yarn
RUN yarn global add pm2
EXPOSE 4000
CMD [ "pm2-runtime", "yarn", "--interpreter", "sh", "--name", "frontend", "--", "start" ]
