FROM --platform=linux/x86_64 ruby:3.0.6

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
    vim \
    cron

RUN apt-get install -y golang-go && \
    git clone https://github.com/progrium/entrykit.git && \
    cd entrykit && \
    make build && \
    mv build/Linux/entrykit /bin/entrykit && \
    chmod +x /bin/entrykit && \
    entrykit --symlink

RUN gem install nokogiri \
    -- --use-system-libraries \
    --with-xml2-config=/usr/bin/xml2-config \
    --with-xslt-config=/usr/bin/xslt-config

RUN gem install bundler -v ${BUNDLER_VERSION}

WORKDIR /app

COPY app app
COPY bin bin
COPY config config
COPY db db
COPY lib lib
COPY log log
COPY public public
COPY test test
COPY tmp tmp
COPY .rubocop*.yml .
COPY .ruby-version .
COPY config.ru .
COPY Gemfile* .
COPY LICENSE .
COPY Rakefile .
COPY wait-for-it.sh .

RUN chown -R root:root .
USER root

ENTRYPOINT [ \
  "prehook", "bundle install -j4", "--", \
  "prehook", "cron", "--", \
  "prehook", "bundle exec whenever --update-crontab", "--", \
  "prehook", "ruby -e 'puts %(Startup complete!!)'", "--" \
]
