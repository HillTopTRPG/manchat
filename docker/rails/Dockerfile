FROM --platform=linux/x86_64 ruby:3.0

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

ADD ./wait-for-it.sh /app/wait-for-it.sh
RUN chmod -R 777 /app

ENTRYPOINT [ \
  "prehook", "ruby -v", "--", \
  "prehook", "bundle install -j4", "--", \
  "prehook", "bundle exec rails db:create", "--", \
  "prehook", "bundle exec rails db:migrate", "--", \
  "prehook", "cron", "--", \
  "prehook", "bundle exec rake app:update:bin", "--", \
  "prehook", "bundle exec whenever --update-crontab", "--", \
  "prehook", "bundle exec rake 'database:initialize'", "--" \
]
