FROM nginx:1.23-alpine

# 実行引数の定義。docker-compose.ymlのargsの項目で指定される。(rails.conf or vue.conf)
ARG TARGET_CONF

# インクルード用のディレクトリ内を削除
RUN rm -f /etc/nginx/conf.d/*

# Nginxの設定ファイルをコンテナにコピー
ADD ${TARGET_CONF} /etc/nginx/conf.d/app.conf

WORKDIR /app

# ビルド完了後にNginxを起動
CMD /usr/sbin/nginx -g 'daemon off;' -c /etc/nginx/nginx.conf