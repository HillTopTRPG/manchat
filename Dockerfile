FROM ruby:3.0

ENV APP /app

COPY ../.. $APP/
WORKDIR $APP

ENV BUNDLER_VERSION 2.3.18

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
    vim

RUN apt-get install -y golang-go && \
    git clone https://github.com/progrium/entrykit.git && \
    cd entrykit && \
    make build && \
    mv build/Linux/entrykit /bin/entrykit && \
    chmod +x /bin/entrykit && \
    entrykit --symlink && \
    cd ../

RUN gem install nokogiri \
    -- --use-system-libraries \
    --with-xml2-config=/usr/bin/xml2-config \
    --with-xslt-config=/usr/bin/xslt-config

RUN gem install bundler -v ${BUNDLER_VERSION}

RUN mkdir -p tmp/sockets && \
    mkdir -p /tmp/public && \
    cp -rf $APP/public/* /tmp/public

ENTRYPOINT [ \
  "prehook", "ruby -v", "--", \
  "prehook", "bundle install -j3", "--" \
]
