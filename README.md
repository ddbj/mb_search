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

- http://IPアドレス/mb/でアクセスを確認する。

# 内容

- configure
  - elasticsearchへのアドレスを設定するスクリプト。-hでヘルプ表示。
- install.sh
  - reactとダウンロードスクリプトをDocumentRootへ設置するスクリプト。-hでヘルプ表示。
- data/
  - elasticsearchデータ
- download\
  - 圧縮ファイル群をダウンロードするphpスクリプト
- react_app\
  - 検索プログラム

# 補足
- jsonデータは、sparql2elasticsearch_prototype.rbのデータに、**instruments,files_format,files**の属性を追加している。
- reactivesearchでは、フィルタに使用できる属性は**keyword型**、検索に使用できる属性は**text型**のため、あらかじめマッピングを定義している。
- ダウンロードファイルは現在1万件以上あり、今後どの程度増えるか分からないため、ファイル名のmd5値の、**/一桁目/二、三桁目/ファイルの実体**、と言うような階層構造を持たせることを想定している。
- ***フィルタは相互に影響するよう修正。加えて、絞り込み検索もフィルタへ影響を及ぼすよう修正。これによって、チェック済みのフィルタをどう扱うかが問題となる。***
- taxonomy treeに関して、階層が深すぎるので、現在は-ales(目)と-aceae(科)以外は無視している。
