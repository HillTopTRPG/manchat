### 開発中コマンドメモ

<details open>
<summary>Docker起動コマンド</summary>

1. ```shell
   docker compose run rails bundle exec rake application:initialize # 初期セットアップ
   ```
2. ```shell
   docker compose up -d # 起動
   ```
3. ```shell
   docker compose ps # コンテナ―状況確認
   ```
4. ```shell
   docker compose logs rails -f # railsのログを確認
   ```

</details>

<details open>
<summary>Docker初期化コマンド</summary>

1. ```shell
   docker compose down # コンテナー停止＆削除
   ```
2. ```shell
   docker rmi $(docker images -q) # イメージ全削除
   ```
3. ```shell
   docker system prune -f --volumes # コンテナなど全削除
   ```
4. ```shell
   docker system df # Dockerが使っているストレージ容量確認
   ```

</details>

<details open>
<summary>Rails操作コマンド</summary>

* ```shell
  docker compose exec rails bash # railsコンテナに入る
  ```
* ```shell
  docker compose run rails ~~~~ # 未起動のコンテナに直接コマンド叩く
  ```

</details>

<details open>
<summary>Railsデバッグ方法</summary>

1. railsソースに`binding.pry`を書く
2. ```shell
   docker compose restart rails # Rails再起動
   ````
3. ```shell
   docker attach trpg-session-tools_rails # 標準入出力をコンソールに接続
   ```

</details>
