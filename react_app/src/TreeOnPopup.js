import React, {Component} from 'react';
import CheckBoxTree from './CheckBoxTree.js';

const checkboxTree = new CheckBoxTree();

/*
Last-Update: 2021/09/01
App_v0.93.jsと同期

taxonomyツリーを表示、選択するポップアップを表示するコンポーネント
Usage: <TreeOnPopup onReady=idOfButton endpoint=URLtoElasticSearch column=columnName />
・onUpdate = フィルタを更新するときに呼び出すコールバック関数
・onReady = 準備が完了した時に有効にするボタンのID -> コールバック関数に変える
・endpoint = taxonomy情報を取得するelasticsearchへのURL
・column = taxonomy情報が格納されているelasticsearchのカラム名
//・filterName = Samplesフィルタタグ名(onUpdateの実装により不要に)

問題点
・スクロールしない -> できればヘッダは固定にしたい
*/
class TreeOnPopup extends Component
{
	taxonomyColumn = ''; // taxonomy情報が入っているカラム名

//	taxonomyURL = 'http://192.168.1.5:9200/mb-project2/_search';
	taxonomyURL = ''; // taxonomy情報を取得するためのelasticsearchのエンドポイント。propsを通じてセットされる。
	onReady     = null; // 準備が完了した際に、有効にするボタンのID（コールバック関数を読んだ方がいい）
	onUpdate    = null;

	taxonomyData = null; // elasticsearchから直接取得する全taxonomy情報


	constructor(props)
	{
		super(props);

		this.onUpdate       = props.onUpdate;
		this.onReady        = props.onReady;
		this.taxonomyURL    = props.endpoint;
		this.taxonomyColumn = props.column;
		this.filterName     = props.filterName;

		this.openPopup            = this.openPopup.bind(this);
		this.closePopupWithFilter = this.closePopupWithFilter.bind(this);

		// taxonomyデータを取得する
		var request = '{"query":{"match_all":{}},"size":0,"_source":{"includes":["*"],"excludes":[]},"aggs":{"' + this.taxonomyColumn + '":{"terms":{"field":"' + this.taxonomyColumn + '","size":1000,"order":{"_term":"asc"}}}}}';
		fetch(this.taxonomyURL, { // post
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: request
		}).then((res) => { // 結果取得
			if(!res.ok)
				throw new Error(`${res.status} ${res.statusText}`);
			return res.text();
		}).then((text) => {
			let array = JSON.parse(text);
			let buckets = array.aggregations[this.taxonomyColumn].buckets;
			this.taxonomyData = {};
			for(let i = 0; i < buckets.length; i ++){
				let line = buckets[i].key.replace(/;$/,'');
				let w    = line.split("; ");
				let key  = w[w.length-1];
				this.taxonomyData[key] = line;
//				this.taxonomyData.push(buckets[i].key.replace(/;$/,''));
			}
//			console.log(this.taxonomyData);
			document.getElementById(this.onReady).classList.remove("hidden");
		}).catch((reason) => { // エラー
			console.log(reason);
		});
	}

	/*
	ポップアップを表示する
	フィルタをテキストで絞り込みできるため、表示時に毎回ツリーを構築するようにしている
	*/
	openPopup(e)
	{
//		let sampleFilterStr = document.getElementsByClassName("sample-filter-textbox")[0].childNodes[0].value;
//		if(0 < sampleFilterStr.length){
//			alert("ツリー表示は、Samplesの絞り込みを解除した状態でのみ使用できます。");
//			return;
//		}
		var rootElement = document.getElementById("tree_container");
		while(rootElement.firstChild)
			rootElement.removeChild(rootElement.firstChild);

		let   expandNodes = ['Root'];
		const targets = document.getElementsByName(this.filterName);
//		if(this.taxonomyTree == null){ // 初期化
			let taxonomyTree = [];
//			for(let i = 0; i < this.taxonomyData.length; i ++)
//				taxonomyTree.push(this.taxonomyData[i]);
			for(let i = 0; i < targets.length; i ++){
				taxonomyTree.push(this.taxonomyData[targets[i].value]);
				let root = this.taxonomyData[targets[i].value].split("; ")[0].replace(/ /g, '_');
				if(!expandNodes.includes(root))
					expandNodes.push(root);
			}
			checkboxTree.createTree("Root", taxonomyTree, document.getElementById("tree_container"))
//		}
		// 現在の選択状態を設定
		let checkedNodes = [];
		for(let i = 0; i < targets.length; i ++){
			if(targets[i].checked){
				checkedNodes.push(targets[i].id);
			}
		}
		checkboxTree.initChecked(checkedNodes)

		// 初期の開閉状態
		checkboxTree.expands(expandNodes);

		// open
		document.getElementById("modal-area").className = "modal-background modal-background-open";
	}

	/*
	チェックしたノードを反映して、ポップアップを閉じる
	*/
	closePopupWithFilter(e)
	{
		// 選択状態を反映させる
/*		const selectedNodes = checkboxTree.getSelectedNodes();
		const targets = document.getElementsByName(this.filterName);
		for(let i = 1; i < targets.length; i ++){
			targets[i].checked = selectedNodes.includes(targets[i].id);
		}
*/
		this.onUpdate(checkboxTree.getSelectedNodes());

		this.closePopup(e);
	}

	/*
	ポップアップを閉じる
	*/
	closePopup(e)
	{
		document.getElementById("modal-area").className = "modal-background modal-background-close";
	}

	/*
	描画
	*/
	render() {
		return ( 
			<div id="modal-area" className="modal-no-display">
			 <div className="modal-popup">
			  <div className="modal-popup-title">
			   <div>Taxonomy Tree</div>
			   <div>
			    <span className="modal-popup-close-button" onClick={this.closePopupWithFilter}>SELECT</span>
			    <span className="modal-popup-close-button" onClick={this.closePopup}>CANCEL</span>
			   </div>
			  </div>
			  <hr />
			  <div className="modal-popup-content">
			   <div id="tree_container"></div>
			  </div>
			 </div>
			</div>
		);
	}
}


export default TreeOnPopup;