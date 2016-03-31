FROM ubuntu

RUN apt-get update && apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN apt-get update && apt-get install -y nodejs

RUN mkdir /app
COPY . /app

RUN cd /app; npm install

CMD nodejs /app/index.js
