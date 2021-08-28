import React, {Component} from 'react';
import {DataSearch,ReactiveBase,ReactiveList,ResultList,MultiList,SingleList} from '@appbaseio/reactivesearch';

import MetaDownload from './MetaDownload.js';
import TreeOnPopup  from './TreeOnPopup.js';

const {ResultListWrapper} = ReactiveList;

/*
Last-Update: 2021/8/28
ver0.91 File, Project検索の切り替えに対応
        表示件数切り替えを追加

ver0.9 新データモデルに対応

やること
・選択数と一緒に、対象ファイル数も表示する -> light
・データ構造の修正(データ構造が確定してからにする) -> middle
・samplesの選択が消える問題(componentDidUpdateは使えない) -> heavy

問題点
・selectedの切り替え
 -> ファイルやメタデータの保持方法次第で変わってしまう。

・ダウンロードファイルの切り替え
 -> Project単位だと、選択時だとファイルが存在しないケースがある。大分挙動がわかりづらい。

・labelをtrの外に置かなきゃいけない問題 -> light
*/


class App extends Component
{
	/*** 固定文字列 ***/
	// metaセッティングのrootID。これを使って、外のボタンから開閉を行う。
	metaFormID = "meta-settings";
	// ファイルをダウンロードするURL
//	downloadURL = '/CompressedDownload.php';
	downloadURL = process.env.REACT_APP_URL_TO_DOWNLOAD_FILES;

	/*** 通常変数 ***/
	// ツリークラスの実態
	popupTree    = null;
	// 選択されたデータ
	targetList = {};
	// 現在、File/Projectのどちらが選択されているか
	handledType = "project";

	constructor(props)
	{
		super(props);

		// state
		this.state = { count: 0, show_count: 5 };

		// bind
		this.reflectSelectedCount = this.reflectSelectedCount.bind(this)
		this.selectAllCheckbox    = this.selectAllCheckbox.bind(this);
		this.deselectAllCheckbox  = this.deselectAllCheckbox.bind(this);
		this.showMetaSettings     = this.showMetaSettings.bind(this);
		this.showTree             = this.showTree.bind(this);
		this.doDownload           = this.doDownload.bind(this);
		this.saveChecked          = this.saveChecked.bind(this);
		this.reflectCheckboxes    = this.reflectCheckboxes.bind(this);
		this.switch2File          = this.switch2File.bind(this);
		this.switch2Project       = this.switch2Project.bind(this);
		this.changeShowCount      = this.changeShowCount.bind(this);

		// init variables
		this.popupTree = React.createRef();

		this.targetList["project"] = {};
		this.targetList["file"]    = {};
	}

	/*
	render後に自動で呼ばれるメソッド
	*/
	componentDidMount()
	{
		document.getElementById("show_count_5").checked = true;
	}

	componentDidUpdate()
	{
		console.log("abc");
	}

// ダウンロード対象のチェックボックス処理 /////////////////////
	/*
	現在選択されているフィルター一覧を取得する
	className string 対象フィルタのMultiListへ渡したclassName
	*/
	getFilterChoices(className)
	{
		let choices = [];
		let array = document.getElementsByClassName(className)[0].getElementsByTagName("input");
		for(let i = 0; i < array.length; i ++){
			if(array[i].checked)
				choices.push(array[i].value);
		}
		if(choices.length === 0){ // 一つも選択されていなければ、全選択肢を返す
			for(let i = 0; i < array.length; i ++)
				choices.push(array[i].value);
		}
		return choices;
	}
	/*
	ダウンロード用チェックボックスの選択状態を保存する。
	e event イベント発動時のイベントオブジェクト
	*/
	saveChecked(e)
	{
		let instruments = this.getFilterChoices("instruments");
		let formats     = this.getFilterChoices("files_format");

		if(e.target.checked) {
			this.targetList[this.handledType][e.target.id] = {};
			// domを保存
			this.targetList[this.handledType][e.target.id]["target"] = e.target;
			let json = JSON.parse(e.target.value);

			// 選択時の対象ファイルを保存
			let files = [];
			for(let i = 0; i < json.files.length; i ++){
				if(instruments.includes(json.files[i].instrument) && formats.includes(json.files[i].file_format))
					files.push(json.files[i].filename);
			}
			this.targetList[this.handledType][e.target.id]["files"] = files;

			// 選択時のmeta情報を保存
			let meta = {};
			meta.id            = json.id;
			meta.project       = json.project;
			meta.project_id    = json.project_id;
			meta.project_label = json.project_label;
			meta.description   = json.description;
			this.targetList[this.handledType][e.target.id]["meta"] = meta;
		} else
			delete this.targetList[this.handledType][e.target.id];
		this.reflectSelectedCount();
	}
	/*
	ページの表示状態が変わったとき、以前のチェック状態を戻す。
	e event イベント発動時のイベントオブジェクト
	*/
	reflectCheckboxes(e)
	{
		let targets = document.getElementsByName("download_check");
		for(let i = 0; i < targets.length; i ++){
			if(targets[i].id in this.targetList[this.handledType])
				targets[i].checked = true;
		}
	}
	/*
	ダウンロード対象のファイル数を変更する
	e event イベント発動時のイベントオブジェクト
	*/
	reflectSelectedCount(e)
	{
/*		let cur = this.state.count;
		if(e.target.checked)
			cur ++;
		else
			cur --;
		
		this.setState({count:cur})

		this.saveChecked(e);
*/
		this.setState({count:Object.keys(this.targetList[this.handledType]).length})
	}

// データダウンロード系 //////////////////////////////////////
	/*
	表示されているチェックボックスのチェックを全てつける
	e event イベント発動時のイベントオブジェクト
	*/
	selectAllCheckbox(e)
	{
		this.setAllCheckbox(true);
	}
	/*
	表示されているチェックボックスのチェックを全て外す
	e event イベント発動時のイベントオブジェクト
	*/
	deselectAllCheckbox(e)
	{
		this.setAllCheckbox(false);
	}
	/*
	表示されているチェックボックスのチェック状態を変更する
	*/
	setAllCheckbox(flag)
	{
//		let count = 0;
		let targets = document.getElementsByName("download_check");
		for(let i = 0; i < targets.length; i ++){
			if(targets[i].checked !== flag){
				targets[i].checked = flag;
//				count += targets[i].checked  ? 1 : -1;
				let event = {"target": targets[i]};
				this.saveChecked(event);
			}
		}
		this.reflectSelectedCount();
//		this.setState({count:this.state.count+count});
	}
	/*
	ダウンロードの実行
	e event イベント発動時のイベントオブジェクト
	*/
	doDownload(e)
	{
		let keys = Object.keys(this.targetList[this.handledType]);
		if(keys.length === 0){
			alert("Not selected.");
			return;
		}

/* // サンプルコード
		let str = "download\n";
		for(let i = 0; i < keys.length; i ++){
			str += "-" + this.targetList[keys[i]].value + "\n";
		}
		alert(str);
*/
		let files = [];
		for(let i = 0; i < keys.length; i ++)
			files.push(this.targetList[this.handledType][keys[i]].files.join(","));
//			files.push(JSON.parse(this.targetList[this.handledType][keys[0]].value).files);
		let request = "files=" + files.join(",");

		let filename = "metabobank-files.zip";
		fetch(this.downloadURL, { // post
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
			body: request
		}).then((res) => { // 結果取得
			if(!res.ok)
				throw new Error(`${res.status} ${res.statusText}`);
			filename = res.headers.get("content-disposition").split('filename=')[1].replace(/"/g,'');
			return res.blob();
		}).then((blob) => { // blob取得
			const url = URL.createObjectURL(blob);
			const a   = document.createElement("a");
			document.body.appendChild(a);
			a.download = filename;
			a.href     = url;
			a.click();
			a.remove();
			setTimeout(() => { // ???
				URL.revokeObjectURL(url);
			}, 1E4);
		}).catch((reason) => { // エラー
			console.log(reason);
		});
	}

// metaデータダウンロード系 ////////////////////////////////
	/*
	metaデータダウンロードsettingフォームの開閉を行う。
	*/
	showMetaSettings()
	{
		let e = document.getElementById(this.metaFormID);
		e.open = !e.open;
	}

	/*
	metaデータダウンロード用配列を返す。
	<MetaDownload>コンポーネントへ渡すコールバック関数。
	return string[][] metaデータの2次元配列。最初の配列はヘッダ。
	*/
	getMetaDataFunc()
	{
		let str = "id,project,project_id,project_label,description\n";
		let keys = Object.keys(this.targetList[this.handledType]);
		let data = [];
		data.push(str.split(","));
		for(let i = 0; i < keys.length; i ++){
			let json = this.targetList[this.handledType][keys[i]]["meta"];
//			let json = JSON.parse(this.targetList[this.handledType][keys[i]]["target"].value);
			let array = [];
			array.push('"' + json.id            + '"');
			array.push('"' + json.project       + '"');
			array.push('"' + json.project_id    + '"');
			array.push('"' + json.project_label + '"');
			array.push('"' + json.description   + '"');
			data.push(array);
		}

		return data;
//		return [["header1", "header2"],["a","b"]];
	}

// taxonomyツリー系 ////////////////////////////////////////
	/*
	ツリーの表示
	*/
	showTree()
	{
		this.popupTree.current.openPopup();
	}

// File/Project切り替え ////////////////////////////////////
	switch2File(event)
	{
		this.switchFileOrProject("file");
		this.switchFileProjectClass("switch2File", "switch2Project");
	}
	switch2Project(event)
	{
		this.switchFileOrProject("project");
		this.switchFileProjectClass("switch2Project", "switch2File");
	}
	switchFileOrProject(value)
	{
		this.handledType = value;
		var buttons = document.getElementsByName("file_or_project");
		for(var i = 0; i < buttons.length; i ++){
			if(buttons[i].value === value){
				var evt = document.createEvent( "MouseEvents" );
				evt.initEvent( "click", true, true );
				buttons[i].dispatchEvent( evt );
			}
		}
		this.reflectSelectedCount();
	}
	switchFileProjectClass(selected, unselected)
	{
		document.getElementById(selected).classList.add("selected-tab");
		document.getElementById(selected).classList.remove("unselected-tab");
		document.getElementById(unselected).classList.add("unselected-tab");
		document.getElementById(unselected).classList.remove("selected-tab");
	}

// 表示件数 //////////////////////////////////////////////////////
	/*
	結果の表示件数を変更する
	e event クリックされた件数のラジオボタン
	*/
	changeShowCount(e)
	{
		let count = parseInt(e.target.value);
		this.setState({show_count:count});

		// 強制検索させるために、samplesの先頭要素をクリックする
		let a = document.getElementsByName("samples")[0];
		a.checked = !a.checked;
		var evt = document.createEvent( "MouseEvents" );
		evt.initEvent( "click", true, true );
		a.dispatchEvent( evt );
	}

	// 実処理系 /////////////////////////////////////////////////
	/*
	描画
	*/
	render() {
		return ( 
			<ReactiveBase
//				app = "mb-project3,mb-file3"
//				url = "http://192.168.1.5:9200/"
				app = {process.env.REACT_APP_INDEX_OF_ELASTICSEARCH}
				url = {process.env.REACT_APP_URL_TO_ELASTICSEARCH}
			>
			<article className="article">
{/* フィルタコンテンツ */}
				<div className="side-menu">
	{/* 装置のフィルタ */}
					<div>Instrument</div>
					<MultiList
						componentId  = "instruments"
						dataField    = "files.instrument"
						showCheckbox = {true}
						showCount    = {true}
						showSearch   = {false}
						size         = {10}
						sortBy       = "asc"
						className    = "instruments"
						react        = {{
							"and": ["samples","files_format","meta_search","file_or_project"]
						}}
					/>
	{/* 拡張子のフィルタ */}
					<div>File Format</div>
					<MultiList
						componentId  = "files_format"
						dataField    = "files.file_format"
						showCheckbox = {true}
						showCount    = {true}
						showSearch   = {false}
						size         = {10}
						sortBy       = "asc"
						className    = "files_format"
						react        = {{
							"and": ["samples","instruments","meta_search","file_or_project"]
						}}
					/>
	{/* サンプル種のフィルタ */}
					<div className="separate">
					 <div>Samples</div>
					 <div className="filter-countr"><span id="taxonomy_button" className="metadownload-button hidden" onClick={this.showTree}>≡</span></div>
					</div>
		{/* サンプル種の絞り込み用テキストボックス */}
					<DataSearch
						componentId = "sample-filter"
						dataField   = "taxonomy_names"
						queryFormat = "and"
						placeholder = "Filter for TaxNames"
						autosuggest = {false}
						className   = "sample-filter-textbox"
					/>
		{/* サンプル種の列挙 */}
					<MultiList
						componentId = "samples"
						dataField   = "samples.species"
						showCheckbox= {true}
						showCount   = {true}
						showSearch  = {false}
						size        = {1000}
						sortBy      = "asc"
						react       = {{
							"and": ["sample-filter","samples.species","files_format","instruments","meta_search","file_or_project"]
						}}
						customQuery={() => {
							const targets = document.getElementsByName("samples");
							let array = [];
							for(let i = 0; i < targets.length; i ++){
								if(targets[i].checked)
									array.push(targets[i].value);
							}
							if(array.length === 0){
								return {};
							} else {
								return {
									query: { bool: { should: [{ terms:{ "samples.species": array } }] } }
								};
							}
						} }
						render = {({ loading, error, data, handleChange }) => {
							if (loading) 
								return <div className="scroll">Fetching Data.</div>;
							if (error)
								return <div className="scroll">Something went wrong! Error details {JSON.stringify(error)}</div>;

							return (
								<div className="scroll">
								<table className="filter-table">
								  {data.map(item => (<label key={item.key} htmlFor={item.key}>
								    <tr className="filter-tr">
								     <td><input type="checkbox" id={item.key} value={item.key} name="samples" onChange={handleChange} /></td>
								     <td className="filter-td">{item.key}</td>
								     <td className="right-align">{item.doc_count}</td>
								    </tr></label>
								  ))}
								</table>
								</div>
					        );
					    }}
					/>
	{/* ファイルかプロジェクトか */}
					<div className="hidden">
						<div>File/Project</div>
						<SingleList
							componentId ="file_or_project"
							dataField   ="handling_type"
							showCheckbox={true}
							showCount   ={false}
							showSearch  ={false}
							defaultValue="project"
							sortBy      ="asc"
							customQuery ={() => {
								var targets = document.getElementsByName("file_or_project");
								var targetValue = "project";
								if(2 <= targets.length)
									if(targets[0].checked)
										targetValue = "file";
								return {
									query: { bool: { must: [{ term:{ handling_type: targetValue } }] } }
								};
							}}
							render     ={({ loading, error, data, handleChange }) => {
								return (
									<div>
									  {data.map(item => (
									    <div key={item.key}><input type="radio" id={"type_"+item.key} value={item.key} name="file_or_project" onChange={handleChange} />{item.key} {item.doc_count}</div>
									  ))}
									</div>
								);
							}}
						/>
					</div>
	{/* 表示件数 */}
					<div className="margin-top">Show Count</div>
					<div>
					  <label htmlFor="show_count_5" ><input type="radio" id="show_count_5"  name="show_count" value="5"  onChange={this.changeShowCount} />5</label>
					  <label htmlFor="show_count_10"><input type="radio" id="show_count_10" name="show_count" value="10" onChange={this.changeShowCount} />10</label>
					  <label htmlFor="show_count_20"><input type="radio" id="show_count_20" name="show_count" value="20" onChange={this.changeShowCount} />20</label>
					  <label htmlFor="show_count_50"><input type="radio" id="show_count_50" name="show_count" value="50" onChange={this.changeShowCount} />50</label>
					</div>
				</div>
{/*** 結果コンテンツ ***/}
				<div className="main-content">
	{/* metaデータを検索するためのテキストボックス */}
					<DataSearch
						componentId = "meta_search"
						dataField   = {["project_label","description"]}
						queryFormat = "and"
						placeholder = "Search for Meta Data"
					/>
	{/* ProjectとFileの切り替え */}
					<div className="project-file-style">
					  <span className="tab selected-tab"   id="switch2Project" onClick={this.switch2Project}>Project</span>
					  <span className="tab unselected-tab" id="switch2File"    onClick={this.switch2File}>File</span>
					  <hr className="separation-hr" />
					</div>
	{/* 結果を操作するボタン群 */}
					<div className="separate">
					  <div>
					    <span className="metadownload-button" onClick={this.selectAllCheckbox}  >Select All</span>
					    <span className="metadownload-button" onClick={this.deselectAllCheckbox}>Deselect All</span>
					  </div>
					  <div>
					    <span className="metadownload-button" onClick={this.showMetaSettings}>DL(Meta)</span>
					    <span className="metadownload-button" onClick={this.doDownload}      >DL(File)</span>
					    <span>{this.state.count} <span className="small">selected.</span></span>
					  </div>
					</div>
	{/* Metaダウンロード設定 */}
					<MetaDownload formID={this.metaFormID} getMetaDataFunc={() => this.getMetaDataFunc()} />
					<hr />

	{/* 結果の表示 */}
					<ReactiveList
						componentId = "list-component"
						dataField   = "id"
						sortBy      = "asc"
						pagination  = {true}
						size        = {this.state.show_count}
						react       = {{
							"and": ["meta_search","instruments","files_format","samples","file_or_project"]
						}}
						onPageChange = {
							() => { this.reflectCheckboxes(); }
						}
					>
						{({data, error, loading}) => (
							<ResultListWrapper>
							{
								data.map(item => (
									<ResultList key = {item._id}>
									 <ResultList.Content>
									  <label htmlFor={item.id}>
									  <div className="pointer">
									   <ResultList.Title
									     dangerouslySetInnerHTML = {{
										   __html: "ID:" + item.id
										 }}
									   />
									   <ResultList.Description>
									    <div>
									     <input type="checkbox" name="download_check" value={JSON.stringify(item)} id={item.id} onChange={this.saveChecked} /><span className="small" dangerouslySetInnerHTML={{__html:item.project_label}} />
									    </div>
									   </ResultList.Description>
									  </div>
									  </label>
									 </ResultList.Content>
									</ResultList>
								))
							}
							</ResultListWrapper>
						)}
					</ReactiveList>
	{/* ツリー用ポップアップ */}
					<TreeOnPopup ref={this.popupTree} filterName="samples" onReady="taxonomy_button" endpoint={process.env.REACT_APP_URL_TO_TAXONOMY} column={process.env.REACT_APP_COLUMN_OF_TAXONOMY} />

				</div>
			</article>
			</ReactiveBase>
		);
	}
}

export default App;