import React, {Component} from 'react';
import {DataSearch,ReactiveBase,ReactiveList,ToggleButton,ResultList,MultiList,SelectedFilters} from '@appbaseio/reactivesearch';

import MetaDownload from './MetaDownload.js';
import TreeOnPopup  from './TreeOnPopup.js';

const {ResultListWrapper} = ReactiveList;

/*
Last-Update: 2021/8/23
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

	constructor(props)
	{
		super(props);
		this.state = { count: 0 };
		this.reflectSelectedCount = this.reflectSelectedCount.bind(this)
		this.selectAllCheckbox    = this.selectAllCheckbox.bind(this);
		this.deselectAllCheckbox  = this.deselectAllCheckbox.bind(this);
		this.showMetaSettings     = this.showMetaSettings.bind(this);
		this.showTree             = this.showTree.bind(this);
		this.doDownload           = this.doDownload.bind(this);
		this.saveChecked          = this.saveChecked.bind(this);
		this.reflectCheckboxes    = this.reflectCheckboxes.bind(this);

		this.popupTree = React.createRef();
	}

// ダウンロード対象のチェックボックス処理 /////////////////////
	/*
	ダウンロード用チェックボックスの選択状態を保存する。
	e event イベント発動時のイベントオブジェクト
	*/
	saveChecked(e)
	{
		if(e.target.checked)
			this.targetList[e.target.id] = e.target;
		else
			delete this.targetList[e.target.id];
	}
	/*
	ページの表示状態が変わったとき、以前のチェック状態を戻す。
	e event イベント発動時のイベントオブジェクト
	*/
	reflectCheckboxes(e)
	{
		let targets = document.getElementsByName("download_check");
		for(let i = 0; i < targets.length; i ++){
			if(targets[i].id in this.targetList)
				targets[i].checked = true;
		}
	}
	/*
	ダウンロード対象のファイル数を変更する
	e event イベント発動時のイベントオブジェクト
	*/
	reflectSelectedCount(e)
	{
		let cur = this.state.count;
		if(e.target.checked)
			cur ++;
		else
			cur --;
		
		this.setState({count:cur})

		this.saveChecked(e);
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
		let count = 0;
		let targets = document.getElementsByName("download_check");
		for(let i = 0; i < targets.length; i ++){
			if(targets[i].checked != flag){
				targets[i].checked = flag;
				count += targets[i].checked  ? 1 : -1;
				let event = {"target": targets[i]};
				this.saveChecked(event);
			}
		}
		this.setState({count:this.state.count+count});
	}
	/*
	ダウンロードの実行
	e event イベント発動時のイベントオブジェクト
	*/
	doDownload(e)
	{
		let keys = Object.keys(this.targetList);
		if(keys.length == 0){
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
			files.push(JSON.parse(this.targetList[keys[0]].value).files);
//			files.push(this.targetList[keys[i]].value);
		let request = "files=" + files.join(",");

		let filename = "metabobank-files.zip";
		fetch(this.downloadURL, { // post
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
			body: request
		}).then((res) => { // 結果取得
			if(!res.ok)
				throw new Error(`${res.status} ${res.statusText}`);
			filename = res.headers.get("content-disposition").split('filename=')[1].replace(/\"/g,'');
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
		let str = "project,project_id,project_label,description,instruments,files_format,files\n";
		let keys = Object.keys(this.targetList);
		let data = [];
		data.push(str.split(","));
		for(let i = 0; i < keys.length; i ++){
			let json = JSON.parse(this.targetList[keys[i]].value);
			let array = [];
			array.push('"' + json.project + '"');
			array.push('"' + json.project_id + '"');
			array.push('"' + json.project_label + '"');
			array.push('"' + json.description + '"');
			array.push('"' + json.instruments + '"');
			array.push('"' + json.files_format + '"');
			array.push('"' + json.files + '"');
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

	// 実処理系 /////////////////////////////////////////////////
	/*
	描画
	*/
	render() {
		return ( 
			<ReactiveBase
//				app = "mb-project2"
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
						dataField    = "instruments"
						showCheckbox = {true}
						showCount    = {true}
						showSearch   = {false}
						size         = {10}
						sortBy       = "asc"
						react       = {{
							"and": ["samples","files_format","meta-search"]
						}}
					/>
	{/* 拡張子のフィルタ */}
					<div>File Format</div>
					<MultiList
						componentId  = "files_format"
						dataField    = "files_format"
						showCheckbox = {true}
						showCount    = {true}
						showSearch   = {false}
						size         = {10}
						sortBy       = "asc"
						react       = {{
							"and": ["samples","instruments","meta-search"]
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
							"and": ["sample-filter","samples.species","files_format","instruments","meta-search"]
						}}
						onChange  = {
							() => { console.log("a"); }
						}
						customQuery={() => {
							const targets = document.getElementsByName("taxonomy");
							let array = [];
							for(let i = 0; i < targets.length; i ++){
								if(targets[i].checked)
									array.push(targets[i].value);
							}
							if(array.length == 0){
								return {};
							} else {
								return {
									query: { bool: { should: [{ terms:{ "samples.species": array } }] } }
								};
							}
						} }
						render = {({ loading, error, data, handleChange }) => {
							if (loading) 
								return <div>Fetching Data.</div>;
							if (error)
								return <div>Something went wrong! Error details {JSON.stringify(error)}</div>;

							return (
								<div className="scroll">
								<table className="filter-table">
								  {data.map(item => (<label htmlFor={item.key.replace(/\/.*/, '')}>
								    <tr className="filter-tr">
								     <td><input type="checkbox" id={item.key.replace(/\/.*/, '')} value={item.key} name="taxonomy" onChange={handleChange} /></td>
								     <td className="filter-td">{item.key.replace(/\/.*/, '')}</td>
								     <td className="right-align">{item.doc_count}</td>
								    </tr></label>
								  ))}
								</table>
								</div>
					        );
					    }}
					/>
{/*					<div>Show Count</div>
					<ToggleButton
						componentId="show-count"
						data={[
							{ label: '10', value: 10 },
							{ label: '20', value: 20 },
							{ label: '50', value: 50 },
						]}
						defaultValue='10'
						multiSelect={false}
					/>*/}
				</div>
{/*** 結果コンテンツ ***/}
				<div className="main-content">
	{/* metaデータを検索するためのテキストボックス */}
					<DataSearch
						componentId = "meta-search"
						dataField   = {["project_label","description"]}
						queryFormat = "and"
						placeholder = "Search for meta data"
					/>
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
						pagination  = {true}
						size        = {10}
						react       = {{
							"and": ["meta-search","instruments","files_format","samples"]
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
									  <label htmlFor={item.files}>
									  <div className="pointer">
									   <ResultList.Title
									     dangerouslySetInnerHTML = {{
										   __html: "ID:" + item.project_id
										 }}
									   />
									   <ResultList.Description>
									    <div>
									     <input type="checkbox" name="download_check" value={JSON.stringify(item)} id={item.files} onChange={this.reflectSelectedCount} /><span className="small" dangerouslySetInnerHTML={{__html:item.project_label}} />
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
					<TreeOnPopup ref={this.popupTree} onReady="taxonomy_button" endpoint={process.env.REACT_APP_URL_TO_TAXONOMY} column={process.env.REACT_APP_COLUMN_OF_TAXONOMY} />

				</div>
			</article>
			</ReactiveBase>
		);
	}
}

export default App;