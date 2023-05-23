FROM node:18-alpine

WORKDIR /app

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
ENV ENTRYKIT_VERSION 0.4.0

RUN apk upgrade --no-cache && \
    apk add --update --no-cache vim git make go curl libxml2 libxml2-dev libxslt-dev && \
    yarn global add @vue/cli && \
    wget https://github.com/progrium/entrykit/releases/download/v${ENTRYKIT_VERSION}/entrykit_${ENTRYKIT_VERSION}_Linux_x86_64.tgz && \
    tar -xvzf entrykit_${ENTRYKIT_VERSION}_Linux_x86_64.tgz && \
    rm entrykit_${ENTRYKIT_VERSION}_Linux_x86_64.tgz && \
    mv entrykit /bin/entrykit && \
    chmod +x /bin/entrykit && \
    entrykit --symlink

COPY public public
COPY src src
COPY index.html .
COPY package*.json .
COPY router.ts .
COPY tsconfig*.json .
COPY vite.config.ts .
COPY yarn.lock .

# RUN apk add --update --no-cache build-essential pkg-config default-libmysqlclient-dev default-mysql-client

ENTRYPOINT [ \
  "prehook", "yarn install", "--", \
  "prehook", "yarn build", "--" \
]
