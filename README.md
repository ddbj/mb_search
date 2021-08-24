# 内容

- data
  - elasticsearchへ登録するjsonデータ
- download
  - 圧縮ファイル群をダウンロードするphpスクリプト
- react_app
  - 検索プログラム

# セッティング

## 修正箇所
- react_app/.env
  - REACT_APP_URL_TO_ELASTICSEARCH
    - elasticsearchへのURL。cur=http://192.168.1.5:9200/
  - REACT_APP_INDEX_OF_ELASTICSEARCH
    - elasticsearch上の対象インデックス。cur=mb-project2
  - REACT_APP_URL_TO_TAXONOMY
    - taxonomyデータを取得するためのURL。cur=http://192.168.1.5:9200/mb-project2/_search

- data/mb-project.sh
  - URL
    - elasticsearchへの「IPアドレス:ポート番号」。cur=192.168.1.5:9200
  - INDEX
    - elasticsearch上の対象インデックス。cur=mb-project2

- download/CompressedDownload.php
  - $DOCUMENT_ROOT
    - 修正必須。このフォルダ以下にdownloadとtmpフォルダを作成する。downloadにはダウンロードファイルが格納されている想定。def=/var/www/html/mb
  - $ROOT_DIR
    - オプション。ダウンロードファイルが置かれている場所。def=$DOCUMENT_ROOT/download
  - $TMP_DIR
    - オプション。zipファイルを作成する一時ディレクトリ。def=$DOCUMENT_ROOT/tmp

## 設置の流れ
- react_appをコンパイルして、buildフォルダを生成する。
- 上記buildフォルダ、data/、download/CompressedDownload.phpをサーバ上へ置く。
- buildフォルダをwebからアクセスできる場所へ移動。（ここでは/var/www/html/mb/を想定）
- CompressedDownload.phpをbuildフォルダ以下へ移動。（同様に/var/www/html/mb/を想定）
- CompressedDownload.php内の$ROOT_DIR, $TMP_DIRのフォルダを作成しておく。（/var/www/html/mb/download/, /var/www/html/mb/tmp/を想定）
- 各ファイルの所有者、パーミッションを設定する。

## reactのコンパイル
```
> cd react_app
> npm run build
> mv build /var/www/html/mb/
```

## CompressedDownload.phpの配置
```
> vi CompressedDownload.php # 必要なら$DOCUMENT_ROOT, $ROOT_DIR, $TMP_DIRを変更
> mv CompressedDownload.php /var/www/html/mb/
> cd /var/www/html/mb/
> mkdir download tmp
```

## データ登録
```
> cd data
> vi mb-project.sh # elasticsearchのURL、及びインデックスを設定
> sh mb-project.del.sh (既に登録済みなら)
> sh mb-project.schema.sh
> sh mb-project.regist.sh
```

## webからアクセス

- http://アドレス/mb/

# 補足
- jsonデータは、sparql2elasticsearch_prototype.rbのデータに、**instruments,files_format,files**の属性を追加している。
- reactivesearchでは、フィルタに使用できる属性は**keyword型**、検索に使用できる属性は**text型**のため、あらかじめマッピングを定義している。
- ダウンロードファイルは現在1万件以上あり、今後どの程度増えるか分からないため、ファイル名のmd5値の、**/一桁目/二、三桁目/ファイルの実体**、と言うような階層構造を持たせることを想定している。
- ***フィルタは相互に影響するよう修正。加えて、絞り込み検索もフィルタへ影響を及ぼすよう修正。これによって、チェック済みのフィルタをどう扱うかが問題となる。***
- taxonomy treeに関して、階層が深すぎるので、現在は-ales(目)と-aceae(科)以外は無視している。
