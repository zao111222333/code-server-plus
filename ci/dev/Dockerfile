# docker build --network host -t zao111222333/code-server-plus:dev -f Dockerfile .
# docker push zao111222333/code
# docker run -it \
#   -p 18080:8080 -p 18081:8081 -p 18010:8000 \
#   zao111222333/code:dev
FROM debian:11

# build
RUN apt-get update -y && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    curl \
    wget \
    ca-certificates \
    build-essential
ENV CODE_VERSION  4.5.1
RUN cd /tmp \
 && wget -q https://github.com/coder/code-server/releases/download/v${CODE_VERSION}/code-server_${CODE_VERSION}_amd64.deb \
 && dpkg -i code-server_${CODE_VERSION}_amd64.deb
ENV NODE_VERSION 18.5
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -\
 && apt-get install -y nodejs \
 && npm cache clean -f \
 && npm install -g n \
 && n ${NODE_VERSION} \
 && hash -r \
 && npm install -g pkg
RUN apt-get update -y && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    sudo         \
    libpam0g-dev \
    bash
WORKDIR /build
COPY package.json /build/package.json
RUN npm i
COPY . /build
RUN npm run-script build
EXPOSE 8000
EXPOSE 8080
CMD npm run-script env && npm run-script run:build
