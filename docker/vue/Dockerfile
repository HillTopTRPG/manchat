FROM ubuntu:latest

RUN apt-get update && \
    apt-get install -y nodejs npm curl && \
    npm install -g yarn n@latest && \
    n lts && \
    apt-get purge -y nodejs npm

RUN apt-get update -qq && \
    apt-get install -y \
    build-essential \
    pkg-config \
    libxml2 \
    libxml2-dev \
    libxslt-dev \
    default-libmysqlclient-dev \
    default-mysql-client \
    cmake \
    git \
    vim

RUN apt-get install -y golang-go && \
    git clone https://github.com/progrium/entrykit.git && \
    cd entrykit && \
    make build && \
    mv build/Linux/entrykit /bin/entrykit && \
    chmod +x /bin/entrykit && \
    entrykit --symlink

WORKDIR /app

RUN yarn global add @vue/cli

ENTRYPOINT [ \
  "prehook", "yarn install", "--", \
  "prehook", "yarn build", "--" \
]
