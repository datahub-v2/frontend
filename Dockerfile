FROM node:7-alpine
RUN apk add --update git
RUN git clone --recursive https://github.com/datopian/datahub-frontend.git frontend-app
RUN cd frontend-app && npm install
EXPOSE 4000
CMD cd /frontend-app && npm start