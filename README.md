# README

## 開発中コマンドメモ

* Docker起動
   1. `docker compose run rails bundle exec rake application:initialize` 初期セットアップ
   2. `docker compose up -d` 起動
   3. `docker compose ps` コンテナ―状況確認
   4. `docker compose logs rails -f` railsのログを確認
* Docker初期化
   1. `docker compose down` コンテナー停止＆削除
   2. `docker rmi $(docker images -q)` イメージ全削除
   3. `docker system prune --volumes` コンテナなど全削除
   4. `docker system df` Dockerが使っているストレージ容量確認
* rails操作
   * `docker compose exec rails bash` railsコンテナに入る
   * `docker compose run rails ~~~~` 未起動のコンテナに直接コマンド叩く
* railsデバッグ
   1. railsソースに`binding.pry`を書く
   2. `docker compose restart rails`
   3. `docker attach trpg-session-tools_rails`

## 構成

* docker(docker-compose)

   1. [nginx](https://www.nginx.co.jp/) 1.23-alpine port=81
   2. Ruby on Rails 7
   3. mysql 8.0.25
   4. Vue 3 + Vuetify 3 (build only)
      * Build Tool: [Vite](https://ja.vitejs.dev/guide/)

## 環境構築（ローカルで動かす例）

1. `Rancher Desktop 1.4.1`をインストールする

   * [こちら](https://github.com/rancher-sandbox/rancher-desktop/releases/tag/v1.4.1)
     の下の方にある`Assets`
     のリンク集から自分のPCに合うものをダウンロードして使う

2. `Rancher Desktop`を起動

   * 起動することで`Docker`が使える(`docker`と`docker-compose`のコマンドが叩ける)ようになる

3. `Rancher Desktop`の設定

   * General
      * Check for updates automatically: un check

   * WSL Integrations
      * 設定項目なし

   * Kubernetes Settings
      * Kubernetes version: v1.24.3
      * Port: 6443
      * Enable Kubernetes: ✔
      * Enable Traefik: ✔
      * Container Runtime: dockerd(moby)

   * Port Forwarding
      * Empty

   * Images
      * 設定項目なし

   * Troubleshooting
      * 設定項目なし

4. このリポジトリのソースを配置するフォルダを作成する

5. Windowsならコマンドプロンプト, Macならターミナルを起動する

   * 以降はOS標準のソフトを使ってコマンドを叩いていく

6. このリポジトリのソースをローカルに配置する

   1. `cd 配置フォルダのパス`
   2. `git clone このリポジトリをcloneするための指定`

      * もし`git`コマンドが使えない場合はgitをインストールして5からやり直す
      * 例）`git clone https://github.com/HillTopTRPG/trpg-session-tools.git`

7. コマンドライン上で6-ⅱの`git clone`によって作成されたフォルダに移動する

   * `cd cloneで作成されたフォルダのパス`
   * 例）`cd trpg-session-tools`

8. docker操作
   * `docker compose run rails bundle exec rake application:initialize`
      * サーバーの初回セットアップを行う
   * `docker compose up -d`
      * 起動 (`docker-compose.yml`の記載に沿って各環境が作られる)
      * このコマンドは環境構築が終わった後に起動する際にも使う
      * 初回はDocker Imageの作成 → Docker Containerの作成という流れなので5~6分ほどかかる
   * `docker compose ps`
      * Docker Containerの状態を確認する
      * 5つのContainerの `STATUS` が全て `running` になっていればOK
   * `docker compose logs -f rails`
      * railsコンテナ―のログを確認する
      * `Startup complete!!` と表示されたらOK

9. ブラウザからアクセス！

   * http://localhost:81  フロントエンドのページ（メインのコンテンツ）
   * http://localhost:81/api/v1/users  バックエンドデータを直接覗き見