# セッティング

## reactのコンパイル
```
> cd react_app
> npm run build
```

## 設置
- 生成されたbuildフォルダ、data/mb-project.*、download/CompressedDownload.phpをサーバ上へコピー。
- buildフォルダは、webからアクセスできるパスへ
- CompressedDownload.phpはbuildフォルダへ
- CompressedDownload.phpの$ROOT_DIR, $TMP_DIRのフォルダを作成しておく。
- 所有者、パーミッションを適切に設定

## データ登録
```
> sh mb-project.del.sh (既に登録済みなら)
> sh mb-project.schema.sh
> sh mb-project.regist.sh
```

## 修正箇所
- react_app/.env
  - REACT_APP_URL_TO_ELASTICSEARCH
    - elasticsearchへのURL。cur=http://192.168.1.5:9200/
  - REACT_APP_INDEX_OF_ELASTICSEARCH
    - elasticsearch上の対象インデックス。cur=mb-project2
  - REACT_APP_URL_TO_TAXONOMY
    - taxonomyデータを取得するためのURL。cur=http://192.168.1.5:9200/mb-project2/_search

- mb-project.sh
  - URL
    - elasticsearchへの「IPアドレス:ポート番号」。cur=192.168.1.5:9200
  - INDEX
    - elasticsearch上の対象インデックス。cur=mb-project2

- CompressedDownload.php
  - $DOCUMENT_ROOT
    - 修正必須。このフォルダ以下にdownloadとtmpフォルダを作成する。downloadにはダウンロードファイルが格納されている想定。def=/var/www/html/mb
  - $ROOT_DIR
    オプション。ダウンロードファイルが置かれている場所。def=$DOCUMENT_ROOT/download
  - $TMP_DIR
    オプション。zipファイルを作成する一時ディレクトリ。def=$DOCUMENT_ROOT/tmp


## webからアクセス

# 補足
- jsonデータは、sparql2elasticsearch.rbのデータに、**instruments,files_format,files**の属性を追加している。
- reactivesearchでは、フィルタに使用できる属性は**keyword型**、絞り込み検索に使用できる属性は**text型**のため、あらかじめマッピングを定義している。
- ダウンロードファイルは現在1万件以上あり、今後どの程度増えるか分からないため、ファイル名のmd5値の、**/一桁目/二、三桁目/ファイルの実体**、と言うような階層構造を持たせることを想定している。
- ***フィルタは相互に影響するよう修正。加えて、絞り込み検索もフィルタへ影響を及ぼすよう修正。これによって、チェック済みのフィルタをどう扱うかが問題となる。***
