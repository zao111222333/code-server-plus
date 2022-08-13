FROM golang:1.19rc2-bullseye
# go
RUN ln -s /usr/local/go/bin/* /usr/bin/ \
 && echo "export PATH=\"\$PATH:\$GOPATH/bin\"" >> /etc/profile
# build
RUN apt-get update -y && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    curl \
    wget \
    ca-certificates \
    build-essential \
    git \
    ssh
ENV CODE_VERSION  4.5.1
RUN cd /tmp \
 && wget -q https://github.com/coder/code-server/releases/download/v${CODE_VERSION}/code-server_${CODE_VERSION}_amd64.deb \
 && dpkg -i code-server_${CODE_VERSION}_amd64.deb
RUN code-server --install-extension matklad.rust-analyzer \
 && code-server --install-extension tamasfe.even-better-toml
COPY ci/dev/docker/setting.json    /root/.local/share/code-server/User/settings.json 
RUN code-server --install-extension golang.go
# ENV GOBIN $GOPATH/bin
# RUN echo "export GOBIN=\$GOPATH/bin" >> /etc/environment \
RUN go env -w GO111MODULE=on && go env -w GOPROXY=https://goproxy.cn,direct \
 && go install -v github.com/cweill/gotests/gotests@latest \
 && go install -v github.com/fatih/gomodifytags@latest \
 && go install -v github.com/josharian/impl@latest \
 && go install -v github.com/haya14busa/goplay/cmd/goplay@latest \
 && go install -v github.com/go-delve/delve/cmd/dlv@latest \
 && go install -v honnef.co/go/tools/cmd/staticcheck@latest \
 && go install -v golang.org/x/tools/gopls@latest \
 && go install -v golang.org/x/tools/cmd/goimports@latest \
 && go install -v github.com/ramya-rao-a/go-outline@latest

# zsh
RUN apt-get install -y --no-install-recommends \
    zsh \
    zsh-antigen
ENV ZSH_DIR /usr/share/zsh-antigen
COPY ci/dev/docker/zsh/* ${ZSH_DIR}/
RUN echo "export ZSH_DIR=${ZSH_DIR}" >> /etc/environment\
 && chsh -s /bin/zsh \
 && touch /etc/profile.d/null.sh \
 && cp ${ZSH_DIR}/.zshrc   ${HOME}/.zshrc    \
 && cp ${ZSH_DIR}/p10k.zsh ${HOME}/.p10k.zsh \
 && /bin/zsh ${HOME}/.zshrc

RUN apt-get update -y && apt-get upgrade -y \
 && apt-get install -y --no-install-recommends \
    sudo         \
    libpam0g-dev \
    bash
COPY Makefile /build/Makefile
RUN make install
WORKDIR /build
COPY ci/dev/docker/.ssh /root/.ssh
COPY . /build
# RUN npm run-script build
EXPOSE 8000 8080
# ENV PASSWORD 123456
CMD /build/ci/dev/docker/entry.sh
