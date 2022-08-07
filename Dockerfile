FROM ruby:3.0

ENV APP /app
RUN mkdir -p $APP
COPY . $APP/

WORKDIR $APP

# ここのRUNを追加
RUN mkdir -p tmp/sockets && \
    mkdir -p /tmp/public && \
    cp -rf $APP/public/* /tmp/public

RUN bundle install