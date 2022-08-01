FROM debian:11 AS builder

# build
RUN apt-get update -y && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    curl \
    wget \
    ca-certificates \
    build-essential \
    libpam0g-dev

ENV NODE_VERSION 18.5
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -\
 && apt-get install -y nodejs \
 && npm cache clean -f \
 && npm install -g n \
 && n ${NODE_VERSION} \
 && hash -r \
 && npm install -g pkg
WORKDIR /build
COPY . /build
RUN npm i && npm run-script build


FROM debian:11
ENV CODE_VERSION  4.5.1

RUN apt-get update -y && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    sudo         \
    libpam0g-dev \
    bash \
    ca-certificates \
    wget
RUN cd /tmp \
 && wget https://github.com/coder/code-server/releases/download/v${CODE_VERSION}/code-server_${CODE_VERSION}_amd64.deb \
 && dpkg -i code-server_${CODE_VERSION}_amd64.deb
RUN apt-get remove -y --no-install-recommends \
    ca-certificates \
    wget
RUN echo 'root:123456' | chpasswd
WORKDIR /root/
COPY --from=builder /build/dist/code-server-plus ./code-server-plus
EXPOSE 8000 8080
CMD ["./code-server-plus"]