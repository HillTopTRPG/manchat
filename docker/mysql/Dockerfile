FROM --platform=linux/x86_64 mysql:8.0.25

RUN { \
  echo '[mysqld]'; \
  echo 'character-set-server=utf8mb4'; \
  echo 'collation-server=utf8mb4_general_ci'; \
  echo '[client]'; \
  echo 'default-character-set=utf8mb4'; \
} > /etc/mysql/conf.d/charset.cnf \
