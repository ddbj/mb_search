# 履歴

- 2021/09/12
  - 変更:express_server/index.js, data/regist.sh
  - expressをcorsに対応
  - elasticsearchのstatusがyellowになっているのを修正

- 2021/09/09
  - 追加:express_server/index.js
  - 変更 react_app/App.js, react_app/index.css
  - expressに対応
  - project検索結果にファイル数を、file検索結果にファイルフォーマット表示を追加

- 2021/09/02
  - 変更:react_app/App.js, react_app/TreeOnPopup.js
  - instrumentやfile formatフィルタを変更したとき、sampleフィルタのチェックが外れてしまう問題を修正
  - 結果の選択数に加え、ダウンロード対象ファイル数も表示するよう変更

- 2021/08/30
  - 追加:download/error.zip, data/*, react_app/.env.template, configure, install.sh
  - 変更:download/CompressedDownload.php, react_app/*
  - File/Project検索への切り替え機能の実装
  - 複数のファイル情報を追加したProjectデータに対応
  - 結果選択時の絞り込み情報を元に、対象ファイルを選択
  - 表示件数の切り替え機能の実装
  - Zipファイルの作成に失敗した際に、error.zipを返すよう設定
  - 細かいUIの修正

# 必要なもの

- webサーバ (開発のバージョンはapache2.4.6)
- php 7>= + zipモジュール (開発のバージョンは7.3.29)
- elasticsearch 7>= (開発のバージョンは7.14.0)
- npm (開発のバージョンは6.14.13)

# セッティング(for express)
- mb-project3とmb-file3というインデックスを使用
- expressサーバのポートは5000

```
> git clone git@github.com:ddbj/mb_search.git
> cd mb_search
> ./configure -i ElasticSearchのIPアドレス(def=192.168.1.5) -p ElasticSearchのポート番号(def=9200)
ElasticSearch is "http://192.168.1.5:9200/".
> cd data
> ./regist.sh # mb-project3とmb-file3のindexへデータを登録
> cd ../download
```
- download/*をwebからアクセスできる場所に置き、react_app/.envファイルのREACT_APP_URL_TO_DOWNLOAD_FILESの値をCompressDownload.phpがアクセスできるURLに変更する(ex. REACT_APP_URL_TO_DOWNLOAD_FILES=http\://192.168.1.5/CompressedDownload.php)。
- webサーバにて、corsの設定を行う
```
> cd ../react_app
> npm install
> npm run build
> cd ../express_server
> npm init (いろいろ聞かれるが、全てENTERで動く)
> npm install express --save
> node index.js
```
- http\://IPアドレス:5000/でアクセスを確認する。

# セッティング
- mb-project3とmb-file3というインデックスを使用

```
> git clone git@github.com:ddbj/mb_search.git
> cd mb_search
> ./configure -i ElasticSearchのIPアドレス(def=192.168.1.5) -p ElasticSearchのポート番号(def=9200)
ElasticSearch is "http://192.168.1.5:9200/".
> cd data
> ./regist.sh # mb-project3とmb-file3のindexへデータを登録
> cd ../react_app
> npm install
> npm run build
> cd ..
> ./install.sh -r DocumentRootへのパス(def=/var/www/html) -o ファイルの所有者(def=apache) -g ファイルのグループ(def=apache)
Place the data to "/var/www/html/mb/".
Owner is "apache:apache".
```

- http\://IPアドレス/mb/でアクセスを確認する。

# 内容

- configure
  - elasticsearchへのアドレスを設定するスクリプト。-hでヘルプ表示。
- install.sh
  - reactとダウンロードスクリプトをDocumentRootへ設置するスクリプト。-hでヘルプ表示。
- data/
  - elasticsearchデータ
- download/
  - 圧縮ファイル群をダウンロードするphpスクリプト
- react_app/
  - 検索プログラム

# 補足
- jsonデータは、sparql2elasticsearch_prototype.rbのデータに、**id,files{instruments,files_format,filename,type},handling_type**の属性を追加している。
- reactivesearchでは、フィルタに使用できる属性は**keyword型**、検索に使用できる属性は**text型**のため、あらかじめマッピングを定義している。
- ダウンロードファイルは現在1万件以上あり、今後どの程度増えるか分からないため、ファイル名のmd5値の、**/一桁目/二、三桁目/ファイルの実体**、と言うような階層構造を持たせることを想定している。
- ***フィルタは相互に影響するよう修正。加えて、絞り込み検索もフィルタへ影響を及ぼすよう修正。これによって、チェック済みのフィルタをどう扱うかが問題となる。***
- taxonomy treeに関して、階層が深すぎるので、現在は-ales(目)と-aceae(科)以外は無視している。
