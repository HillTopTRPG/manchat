# プロジェクトの概要

これはTRPGのオンラインセッションに役立つ小規模なツール群を提供するWebツールです。  
いくつもの素晴らしいTRPGオンラインセッションツールが安定稼働しているので、ほとんどのTRPGシステムはオンラインで十分に遊べる環境と思います。  
しかし、ごく一部の特殊なルールを持つTRPGシステム（とそれで遊ぶユーザー）や、多くのデータのマスタリングに苦労するゲームマスターにとっては、この恵まれた環境でも十分とは言い切れないはずです。

本ツールはそんなニッチなシチュエーションに特化した利便性の提供を目指します。

## 主要機能

#### 画面分割機能

## システム構成

* docker(docker-compose)

   1. [nginx](https://www.nginx.co.jp/) 1.23-alpine (port=81)
   2. Ruby on Rails 7 (Ruby:3.0.6)
   3. mysql 8.0.25
   4. Vue 3 + Vuetify 3 (build only)
      * Build Tool: [Vite](https://ja.vitejs.dev/guide/)

## 設置方法

* [環境構築（ローカルで動かす例）](/document/markdown/Initialize.md)
* [開発中コマンドメモ](/document/markdown/DevelopperCommands.md)
