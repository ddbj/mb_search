import React, {Component} from 'react';

/*
Last-Update: 2021/08/21

metaデータをダウンロードするためのフォーム、及び機能を実装したコンポーネント
Usage: <MetaDownload getMetaDataFunc={getData}> />
function getData()
{
	return [[header1, header2, header3],["a","b","c"],["d","e","f"]];
}
*/
class MetaDownload extends Component
{
	// ダウンロードさせるmetaデータ
	metaData = "";
	// metaデータのデリミタ
	metaDataDelimiter = ",";
	// metaデータソースを取得する関数。親から渡される。
	getMetaDataFunc = () => {return [];}
	// ルートDOM(detailsタグ)のid属性値
	formID = "meta-settings";

	/*
	getMetaDataFunc = metaデータを取得するためのコールバック関数。metaデータ配列を返す。
	*/
	constructor(props)
	{
		super(props);
		this.getMetaDataFunc = props.getMetaDataFunc;
		this.formID          = props.formID;

		this.downloadFile         = this.downloadFile.bind(this);
		this.performCopy          = this.performCopy.bind(this);
		this.buildMetaData        = this.buildMetaData.bind(this);
		this.getDateString        = this.getDateString.bind(this);
		this.switchMetaFormat     = this.switchMetaFormat.bind(this);
//		this.switchDownloadMethod = this.switchDownloadMethod.bind(this);
	}
	/*
	** コンポーネント構築時に自動的に呼び出されるイベント **
	初期設定を反映させる。
	*/
	componentDidMount()
	{
		this.switchMetaFormat();
//		this.switchDownloadMethod();
	}

	/*
	metaデータをダウンロードする
	*/
	downloadFile()
	{
		if(this.buildMetaData()){ // 二つ下のメソッド
			let tmp      = document.getElementById("meta-download-link");

// バッククォートに意味はある？ ////////////////////////////////////
			// ダウンロードデータとファイル名の設定
//			tmp.href     = `data:plain/text;charset=UTF-8,` + this.metaData.replace(/ /g,"%20");
			tmp.href     = `data:plain/text;charset=UTF-8,` + encodeURI(this.metaData);

			tmp.download = 'MetaData_' + this.getDateString() + '.txt';

			// クリックによるダウンロード実行
			let evt = document.createEvent( "MouseEvents" );
			evt.initEvent( "click", true, true );
			tmp.dispatchEvent( evt );
		} else {
			alert("Not selected.");
		}
	}
	/*
	コピーを実行する
	*/
	performCopy()
	{
		let message;
		if(this.buildMetaData()){ // 直下のメソッド
			this.copyTextToClipboard(this.metaData); // 二つ下のメソッド
// 別の通知方法を検討 //////////////////////////////////////////////
			message = "Copied to clipboard.";
		} else {
			message = "Not selected.";
		}
		alert(message);

	}
	/*
	metaデータを構築する
	*/
	buildMetaData()
	{
		let data = this.getMetaDataFunc();
		if(data.length <= 1)
			return false;

		let meta = "";
		for(let i = 0; i < data.length; i ++)
			meta += data[i].join(this.metaDataDelimiter).trim() + "\n";
		this.metaData = meta;

		return true;
	}
	/*
	与えられた文字列をクリップボードへコピーする
	str    string  コピーしたい文字列
	return boolean コピーの成否
	*/
	copyTextToClipboard(str)
	{
	 	let body = document.getElementsByTagName("body")[0];

		let textarea = document.createElement("textarea");
		textarea.textContent = str;
	 	body.appendChild(textarea);

		textarea.select();
		let res = document.execCommand('copy');
		body.removeChild(textarea);

		return res;
	}

	/*
	日付文字列を取得する。
	return string YYYYMMDDhhmmss の文字列
	*/
	getDateString()
	{
		let date = new Date();
		return date.getFullYear() +
				this.fillInZero(date.getMonth() + 1) +
				this.fillInZero(date.getDate()     ) +
				this.fillInZero(date.getHours()    ) +
				this.fillInZero(date.getMinutes()  ) +
				this.fillInZero(date.getSeconds()  );
	}
	/*
	与えられた数値が1桁だった場合に、頭に0を付けて文字列にして返す
	n      int    先頭を0で埋めたい数値
	return string 2桁の文字列
	*/
	fillInZero(n)
	{
		n = n.toString();
		if(n.length < 2)
			n = "0" + n;
		return n;
	}

	/*
	metaデータのデリミタを変更する
	現在サポートしているのは、csv、tsv。
	*/
	switchMetaFormat()
	{
		let e = document.getElementsByName("meta-download-format")[0];
		let format = e.options[e.selectedIndex].value;
		switch(format){
			case 'csv':
				this.metaDataDelimiter = ',';
				break;
			case 'tsv':
				this.metaDataDelimiter = '	';
				break;
		}
	}
	/*
	performボタンを押したときの挙動を変更する。※未使用
	現在サポートしているのは、コピーとダウンロードのみ。
	*/
/*	switchDownloadMethod()
	{
		let e = document.getElementsByName("meta-download-medium")[0];
		let medium = e.options[e.selectedIndex].value;

		let button = document.getElementById("meta-download");
		button.removeEventListener('click', this.performCopy);
		button.removeEventListener('click', this.downloadFile);

		switch(medium){
			case 'copy':
				button.addEventListener('click', this.performCopy);
				break;
			case 'download':
				button.addEventListener('click', this.downloadFile);
				break;
		}

	}*/

	/*
	描画
	*/
	render() {
		return ( 
			<details id={this.formID}>
			 <summary id="meta-summary"></summary>
			 <div className="balloon4top">
			  Format:
			  <select className="meta-select" name="meta-download-format" onChange={this.switchMetaFormat}>
			   <option value="csv">CSV</option>
			   <option value="tsv">TSV</option>
			  </select>
{/*			  Medium:
			  <select className="meta-select" name="meta-download-medium" onChange={this.switchDownloadMethod}>
			   <option value="download">Download</option>
			   <option value="copy"    >Copy</option>
			  </select>*/}
			  <span className="metadownload-button" id="meta-download" onClick={this.downloadFile}>download</span><a id="meta-download-link"></a>
			 </div>
			</details>
		);
	}

}

export default MetaDownload;