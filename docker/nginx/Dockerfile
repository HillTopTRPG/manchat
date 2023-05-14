FROM --platform=linux/x86_64 nginx:1.23-alpine

RUN rm -f /etc/nginx/conf.d/*

ADD app.conf /etc/nginx/conf.d/myapp.conf
CMD /usr/sbin/nginx -g 'daemon off;' -c /etc/nginx/nginx.conf