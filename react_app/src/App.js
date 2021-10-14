import React, {Component} from 'react';
import {DataSearch,ReactiveBase,ReactiveList,ResultList,MultiList,SingleList} from '@appbaseio/reactivesearch';

import MetaDownload from './MetaDownload.js';
import TreeOnPopup  from './TreeOnPopup.js';

import topBar from './images/top_bar.png';

import './App.css';

const {ResultListWrapper} = ReactiveList;

/*
Last-Update: 2021/10/14
ver0.98 Organismのリストからbold体指定をはずす

ver0.97 表記を変更
        Fileタブ、DL(data)を非表示。結果にダウンロードリンクを追加(downloadURLが含まれている場合のみ)
        View sizeを10,50,100に変更

ver0.963 ヘッダ画像に/へのリンクを追加
         ElasticSearchの結果を1万件上限を、ElasticSerach側の設定に依存するよう修正

ver0.962 ページネーションを上下両方に表示
         REACT_APP_URL_TO_DETAILをベースURLから、変数使用可の完全URLに変更
         検索結果の表記を変更

ver0.961 検索結果から詳細ページへジャンプするリンクを追加
         ページネーションの数を５から１０に変更

ver0.96 ファイルダウンロード時にエラーが発生した場合、このコード内で処理するよう修正

ver0.95 ElasticSearchのURLを一つに集約

ver0.94 project検索にて、projectごとのファイル数を表示
				project検索にて、フィルタによるファイルの選定を無効にする(データモデルが決定するまで今は保留)

ver0.93 samplesのチェックボックスが、他のフィルタを更新時に消されてしまう問題に対処
					合わせて、TreeOnPopup.jsも修正

ver0.92 classをキャメルケースから、ハイフン区切りのものに変更
				細かいレイアウト、バグ修正

ver0.91 File, Project検索の切り替えに対応
				表示件数切り替えを追加

ver0.9 新データモデルに対応

やること
・データ構造の修正(データ構造が確定してからにする) -> middle

問題点
・selectedの切り替え
 -> ファイルやメタデータの保持方法次第で変わってしまう。

・ダウンロードファイルの切り替え
 -> Project単位だと、選択時だとファイルが存在しないケースがある。大分挙動がわかりづらい。

・labelをtrの外に置かなきゃいけない問題 -> light -> 保留
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

	sampleFilterArray = [];
	handleChange = null;
	totalResults = null;

	constructor(props)
	{
		super(props);

		// state
		this.state = { count: 0, file_count: 0, show_count: 10 };

		// bind
		this.reflectSelectedCount        = this.reflectSelectedCount.bind(this)
		this.selectAllCheckbox           = this.selectAllCheckbox.bind(this);
		this.deselectAllCheckbox         = this.deselectAllCheckbox.bind(this);
		this.showMetaSettings            = this.showMetaSettings.bind(this);
		this.showTree                    = this.showTree.bind(this);
		this.doDownload                  = this.doDownload.bind(this);
		this.saveChecked                 = this.saveChecked.bind(this);
		this.reflectCheckboxes           = this.reflectCheckboxes.bind(this);
		this.switch2File                 = this.switch2File.bind(this);
		this.switch2Project              = this.switch2Project.bind(this);
		this.changeShowCount             = this.changeShowCount.bind(this);
		this.changeSampleFilter          = this.changeSampleFilter.bind(this);
		this.reflectSampleFilterFromTree = this.reflectSampleFilterFromTree.bind(this);

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
// ダウンロードファイルはフィルタと関連づけないため、排除しておく
//				if(instruments.includes(json.files[i].instrument) && formats.includes(json.files[i].file_format))
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
let fileCount = 0;
let keys = Object.keys(this.targetList[this.handledType]);
for(let i = 0; i < keys.length; i ++)
	fileCount += this.targetList[this.handledType][keys[i]].files.length;

		this.setState({count:Object.keys(this.targetList[this.handledType]).length});
		this.setState({file_count:fileCount});
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
//		if(keys.length === 0){
		if(this.state.file_count === 0){
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
			if(!res.ok){
				if( res.status == 500 ) // ファイルが無い or Zip処理に失敗
					alert("Error: Files you specified does not exists OR Zip process failed.\nPlease contact the administrator with the following information.\n\n--request--\n" + request);
				else if( res.status == 503 ) // 一時ディレクトリの作成に失敗
					alert("Error: Failed to create tmp directory.\n\n  Maybe, there is a lot of access.\n  Please take a moment and try again.\n");
				else // unkonwn エラー
					alert("Error: " + res.status + " " + res.statusText + "\n\n--request--\n" + request);

				throw new Error(`${res.status} ${res.statusText}`);
			}
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
			//console.log(reason);
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

// sampleフィルタ //////////////////////////////////////////////////////
	/*
	sampleがクリックされた時に、選択対象を管理する
	e event クリックされたフィルタ項目
	*/
	changeSampleFilter(e)
	{
		if(!this.sampleFilterArray.includes(e.target.value))
			this.sampleFilterArray.push(e.target.value);
		else
			this.sampleFilterArray = this.sampleFilterArray.filter(function( item ) {  return item !== e.target.value; });
//console.log(this.sampleFilterArray);

		if(this.handleChange)
			this.handleChange();
	}

	/*
	tree上での変更が反映される時に呼ばれるコールバック関数
	targets array 選択対象のSampleフィルタ項目文字列
	*/
	reflectSampleFilterFromTree(targets)
	{
		// チェックボックスの状態をセット
		const checkboxes = document.getElementsByName("samples");
		for(let i = 0; i < checkboxes.length; i ++){
			checkboxes[i].checked = targets.includes(checkboxes[i].id);
		}

		// 検索用配列を更新
		this.sampleFilterArray = targets.concat();
		if(this.handleChange)
			this.handleChange();
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

		if(this.handleChange)
			this.handleChange();
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
				className="article-wrapper"
			>
			<div className="top-bar">
				<a href="/" title="MetaboBank"><img src={topBar} alt="MetaboBank integrated metabolome data repository" /></a>
			</div>
			<div className="contents">

				<article className="article">
	{/* フィルタコンテンツ */}
					<aside className="side-menu">
		{/* 装置のフィルタ */}
						<section className="filter-box">
							<p className="title serif">Instrument</p>
							<div className="contents">
								<MultiList
									componentId  = "instruments"
									dataField    = "files.instrument"
									showCheckbox = {true}
									showCount    = {true}
									showSearch   = {false}
									size         = {10}
									className    = "instruments"
									react        = {{
										"and": ["samples","files_format","meta_search","file_or_project"]
									}}
								/>
							</div>
						</section>
		{/* 拡張子のフィルタ */}
						<section className="filter-box">
							<p className="title serif">Data Format</p>
							<div className="contents">
								<MultiList
									componentId  = "files_format"
									dataField    = "files.file_format"
									showCheckbox = {true}
									showCount    = {true}
									showSearch   = {false}
									size         = {10}
									className    = "files_format"
									react        = {{
										"and": ["samples","instruments","meta_search","file_or_project"]
									}}
								/>
							</div>
						</section>
		{/* サンプル種のフィルタ */}
						<section className="filter-box">
							<div className="separate title">
								<p className="serif">Organism</p>
								<div className="filter-countr"><span id="taxonomy_button" className="metadownload-button hidden" onClick={this.showTree}>≡</span></div>
							</div>
				{/* サンプル種の絞り込み用テキストボックス */}
							<div className="contents">
								<DataSearch
									componentId = "sample-filter"
									dataField   = "taxonomy_names"
									queryFormat = "and"
									placeholder = "filter"
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
									react       = {{
										"and": ["sample-filter","samples.species","files_format","instruments","meta_search","file_or_project"]
									}}
									customQuery={() => {
										// クラス変数をそのまま渡すとうまく動作しないので、コピーする
										let array = this.sampleFilterArray.concat()

										if(this.sampleFilterArray.length === 0){
											return {};
										} else {
											return {
												query: { bool: { should: [{ terms:{ "samples.species": array } }] } }
											};
										}
									} }
									render = {({ loading, error, data, value, handleChange }) => {
										if (loading) 
											return <div className="scroll">Fetching Data.</div>;
										if (error)
											return <div className="scroll">Something went wrong! Error details {JSON.stringify(error)}</div>;

										// checkedの状態を設定
										this.handleChange = handleChange;
										for(let i = 0; i < data.length; i ++){
											let flag = false;
											for(let j = 0; j < this.sampleFilterArray.length; j ++){
												if(this.sampleFilterArray[j] === data[i].key){
													flag = true;
													break;
												}
											}
											data[i].checked = flag;
										}
										return (
											<div className="scroll">
											<ul>
												{data.map(item => (
													<li key={item.key} htmlFor={item.key}>
														<input type="checkbox" id={item.key} value={item.key} name="samples" onChange={this.changeSampleFilter} defaultChecked={item.checked} />
														<label for={item.key} className="sample-label">
															<span className="label unbold">{item.key}</span>
															<span className="count">{item.doc_count}</span>
														</label>
													</li>
												))}
											</ul>
											</div>
												);
										}}
								/>
							</div>
						</section>
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
					</aside>
	{/*** 結果コンテンツ ***/}
					<main className="main-content">
		{/* metaデータを検索するためのテキストボックス */}
						<DataSearch
							componentId = "meta_search"
							dataField   = {["id","project_id","project_label","description"]}
							queryFormat = "and"
							placeholder = "Search for Meta Data"
							className="search-input"
						/>
		{/* ProjectとFileの切り替え */}
						<div className="functions">
							<div className="project-file-style">
								<span className="tab selected-tab serif"   id="switch2Project" onClick={this.switch2Project}>Study</span>
								{/*<span className="tab unselected-tab serif" id="switch2File"    onClick={this.switch2File}>File</span>*/}
							</div>
							<div className="show-count">
								<p className="label">View size</p>
								<label htmlFor="show_count_10"><input type="radio" id="show_count_10" name="show_count" value="10" onChange={this.changeShowCount} defaultChecked={true} />10</label>
								<label htmlFor="show_count_50"><input type="radio" id="show_count_50" name="show_count" value="50" onChange={this.changeShowCount} />50</label>
								<label htmlFor="show_count_100"><input type="radio" id="show_count_100" name="show_count" value="100" onChange={this.changeShowCount} />100</label>
							</div>
						</div>
		{/* 結果を操作するボタン群 */}
						<div className="separate">
							<div>
								<span className="metadownload-button" onClick={this.selectAllCheckbox}  >Select all</span>
								<span className="metadownload-button" onClick={this.deselectAllCheckbox}>Deselect all</span>
							</div>
							<div>
								<span className="metadownload-button" onClick={this.showMetaSettings}>DL (meta)</span>
								{/*<span className="metadownload-button" onClick={this.doDownload}      >DL (data)</span>*/}
								<span>{this.state.count} <span className="small">selected</span>{/* ({this.state.file_count} <span className="small">files</span>)*/}</span>
							</div>
						</div>
		{/* Metaダウンロード設定 */}
						<MetaDownload formID={this.metaFormID} getMetaDataFunc={() => this.getMetaDataFunc()} />

		{/* 結果の表示 */}
						<ReactiveList
							componentId  = "list-component"
							dataField    = "id"
							defaultQuery = {() => ({ track_total_hits: true })}
							pagination   = {true}
							size         = {this.state.show_count}
							paginationAt = "both"
							pages        = "10"
							react        = {{
								"and": ["meta_search","instruments","files_format","samples","file_or_project"]
							}}
							renderResultStats={
								(stats) => {
									if( this.totalResults === null)
										this.totalResults = stats.numberOfResults;
									let start = stats.currentPage * this.state.show_count;
									return (
										<div dangerouslySetInnerHTML = {{
											__html: `<strong>${stats.numberOfResults}</strong> results out of ${this.totalResults} (showing ${start+1} to ${start+stats.displayedResults})`
										}}></div>
									)
								}
							}
							onPageChange = {
								() => { this.reflectCheckboxes(); }
							}
							className="result-list"
						>
							{({data, error, loading}) => {
								// file数のカウント
								if(this.handledType === "project"){
									for(let i = 0; i < data.length; i ++){
										data[i].file_count = data[i].files.length + " files(0 GB)";
										data[i].detailURL  = "<a href=\"" + process.env.REACT_APP_URL_TO_DETAIL.replace("{ID}", data[i].id)  + "\" target=\"_blank\" rel=\"noopener noreferrer\">ID:" + data[i].id + "</a>";
									}
								} else {
									for(let i = 0; i < data.length; i ++){
										data[i].file_count = data[i].files[0].file_format + " (0 GB)";
										data[i].detailURL  = "ID:" + data[i].id;
									}
								}
								// ダウンロードURL
								for(let i = 0; i < data.length; i ++){
									//if(typeof data[i].donwloadURL !== 'undefined')
									if(data[i].donwloadURL !== undefined)
										data[i].downloadLink = '<a href="' + data[i].downloadURL + '" download>data download</a>';
									else
										data[i].downloadLink = '';
								}
								return (
									<ResultListWrapper className="result-table">
									{
										data.map(item => (
											<ResultList key = {item._id}>
											<ResultList.Content>
												<input type="checkbox" name="download_check" value={JSON.stringify(item)} id={item.id} onChange={this.saveChecked} />
												<label htmlFor={item.id}>
													<div className="pointer">
														<ResultList.Title
															dangerouslySetInnerHTML = {{
															__html: "<div class=\"separate-compact\"><div>" + item.detailURL + "</div><div><span class=\"small\">" + item.file_count + "</span></div></div>"
														}}
														/>
														<ResultList.Description></ResultList.Description>
													</div>
												<span className="small" dangerouslySetInnerHTML={{__html:item.project_label}} />
												<div dangerouslySetInnerHTML = {{__html: item.downloadLink}} className="download-link"></div>
												</label>
											</ResultList.Content>
											</ResultList>
										))
									}
									</ResultListWrapper>
								);
							}}
						</ReactiveList>
		{/* ツリー用ポップアップ */}
						<TreeOnPopup ref={this.popupTree} onUpdate={this.reflectSampleFilterFromTree} filterName="samples" onReady="taxonomy_button" endpoint={process.env.REACT_APP_URL_TO_ELASTICSEARCH + process.env.REACT_APP_INDEX_OF_ELASTICSEARCH + "/_search"} column={process.env.REACT_APP_COLUMN_OF_TAXONOMY} />
					</main>
				</article>
			</div>
			</ReactiveBase>
		);
	}
}

export default App;
