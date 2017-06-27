FROM node:7-alpine
RUN git clone --recursive https://github.com/datopian/datahub-frontend.git frontend-app
RUN cd frontend-app
RUN npm install
EXPOSE 4000
CMD [ "npm", "start" ]
