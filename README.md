# 履歴

- 2021/10/06
  - 変更:react_app/src/App.js, react_app/.env.template
  - 詳細ページへのURL（REACT_APP_URL_TO_DETAIL）をベースURLから、{ID}（変数）を含む完全URLへと変更。
  - ページネーションを上下の両方に表示
  - 検索結果の表記を変更

- 2021/10/04
  - 変更:react_app/src/App.js, react_app/.env.template
  - 検索結果から詳細ページへジャンプするリンクを追加。
  - 合わせて、リンク先のベースURLを示す環境変数を追加(REACT_APP_URL_TO_DETAIL=https://mb2.ddbj.nig.ac.jp/study)。
  - ページネーションの表示数を5から10に変更。

- 2021/10/02
  - 変更:configure, react_app/src/App.js, react_app/.env.template
  - 削除:download/
  - ファイルダウンロー時にエラーが発生した場合、今までerror.zipを返していたが、react内でエラーメッセージを表示するよう修正

- 2021/10/01
  - 変更:react_app/src/App.js, react_app/public/index.html, data/regist.sh
  - 表示名変更
  - ファセット検索部分を件数順に
  - メタデータ検索部分に、idとproject_idを追加
  - 上記に伴い、elasticsearch上のidとproject_idをkeyword型からtext型へ変更(そのため、今まで検索結果をID順に表示していたが、text型ではソートできないため、ソート指定を解除)

- 2021/09/28
  - 変更:react_app/src/App.js
  - add-cssブランチと2021/09/23の変更をマージ

- 2021/09/23
  - 変更:configure, react_app/.env.template, react_app/src/App.js, react_app/src/MetaDownload.css, data/mb-project.inc.template, data/regist.sh, express_server/index.js
  - 削除:tab.css
  - react_appのelasticsearchへのURLの環境変数を一つに集約
  - MetaDownloadの吹き出しの位置調整
  - configureにおけるデフォルト値をlocalhostへ変更、及び引数を変更
  - expressにおいて、elasticsearchへのアクセスをリバースプロキシするよう修正

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

- (expressサーバを使用しない場合)webサーバ (開発のバージョンはapache2.4.6)
- elasticsearch 7>= (開発のバージョンは7.14.0)
- npm (開発のバージョンは6.14.13)

# セッティング(for express)
- mb-project3とmb-file3というインデックスを使用
- expressサーバの設定
  - ポートは5000(PORT=で上書き可能)
  - elasticsearchへのリバースプロキシは/mb-project3,mb-file3/*にマッチする場合(INDEX=で上書き可能)
  - elasticsearchへのURLはlocalhost:9200(ES=で上書き可能)

```
> git clone git@github.com:ddbj/mb_search.git
> cd mb_search
> ./configure -u ElasticSearchのURL(def=http://localhost:9200/) -p ElasticSearchへのリバースプロキシURL(def=) -d ファイルダウンロードのURL(def=http://localhost/comp_dl.phar)
ElasticSearch is "http://localhost:9200/".
ReverseProxy is "http://localhost:5000/". # -pオプションが無い場合、-uと同じ値が使用される(リバースプロキシが無い状態)
DownloadURL is "http://localhost/comp_dl.phar".
> cd data
> ./regist.sh # mb-project3とmb-file3のindexへデータを登録
> cd ../react_app
> npm install
> npm run build
> cd ../express_server
> npm init (いろいろ聞かれるが、全てENTERで動く)
> npm install express --save
> npm install http-proxy --save # expressにelasticsearchのリバースプロキシをさせるなら
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
- react_app/
  - 検索プログラム

# 補足
- jsonデータは、sparql2elasticsearch_prototype.rbのデータに、**id,files{instruments,files_format,filename,type},handling_type**の属性を追加している。
- reactivesearchでは、フィルタに使用できる属性は**keyword型**、検索に使用できる属性は**text型**のため、あらかじめマッピングを定義している。
- ***フィルタは相互に影響するよう修正。加えて、絞り込み検索もフィルタへ影響を及ぼすよう修正。これによって、チェック済みのフィルタをどう扱うかが問題となる。***
- taxonomy treeに関して、階層が深すぎるので、現在は-ales(目)と-aceae(科)以外は無視している。
