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

   1. ```shell
      cd 配置フォルダのパス
      ```

   2. ```shell
      git clone https://github.com/HillTopTRPG/trpg-session-tools.git
      ```
      もし`git`コマンドが使えない場合はgitをインストールして5からやり直す
      * Windows：[こちら](https://gitforwindows.org/)からダウンロード＆インストール
      * Mac：`brew install git`コマンドでインストール

7. コマンドライン上で6-ⅱの`git clone`によって作成されたフォルダに移動する

   * ```shell
     cd trpg-session-tools
     ```

8. docker操作
   1. ```shell
      docker compose build # Dockerイメージ構築
      ```
      * `docker-compose.yml`の記載に沿ってDockerイメージが構築される
      * 一番時間がかかる（5~6分ほど）
   2. ```shell
      docker compose run rails bundle exec rake application:initialize # 初回セットアップタスクを実行
      ```
   3. ```shell
      docker compose up -d # コンテナー起動
      ```
      * `docker-compose.yml`の記載に沿って各コンテナ―が作成され起動する
      * このコマンドは環境構築が終わった後に起動する際にも使う
   4. ```shell
      docker compose ps # Dockerコンテナ―の状態を確認する
      ```
      * 5つのContainerの `STATUS` が全て `running` になっていればOK
   5. ```shell
      docker compose logs -f rails # Railsコンテナ―のログを確認する
      ```
      * `Startup complete!!` と表示されたらアプリケーションサーバ―は準備万端
      * ログ表示を停止するには `Ctrl + C`(Windows) または `option + c`(Mac)
   6. ```shell
      docker compose logs -f vue # Vueコンテナ―のログを確認する
      ```
      * 下記のような出力が見えたらクライアントも準備万端
      ```
          VITE v3.0.5  ready in 2877 ms
      
          ➜  Local:   http://localhost:3120/
          ➜  Network: http://172.18.0.2:3120/
      ```

9. ブラウザからアクセス！

   * http://localhost:81  フロントエンドのページ（メインのコンテンツ）
   * http://localhost:81/api/v1/users  バックエンドデータを直接覗き見