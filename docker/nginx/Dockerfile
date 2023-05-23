FROM --platform=linux/x86_64 nginx:1.20

RUN rm -f /etc/nginx/conf.d/*

ADD app.conf.template /etc/nginx/templates/myapp.conf.template
