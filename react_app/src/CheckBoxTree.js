/*
Create: 2021/08/16
Last-Update: 2021/08/28

残り
バグ
*/
export default class CheckBoxTree
{
	EXPAND_STR   = "＋";
	COLLAPSE_STR = "－";
	LEAF_STR     = "";

//	constructor() {}

	/*
	treeを作る起点。
	rootNodeName string rootノードの表示名
	tree         array  「; 」区切りのノード情報(ex. leaf; parent; rootという順)
	root         dom    ツリーを追加するDOM要素
	*/
	createTree(rootNodeName, tree, root)
	{
		let t = {};
		t[rootNodeName] = {};
		for(let j = 0; j < tree.length; j ++){
			let w = tree[j].split("; ");
			let parent = t[rootNodeName];
//			for(let i = w.length-2; 0 <= i; i --){
			for(let i = 0; i < w.length; i ++){
				w[i] = w[i].replace(/ /g, '_'); // idとして使うため、「 」を「_」に変換する // ※
// テスト用のため、-ales(目)と-aceae(科)以外は省く
if(i === w.length-1 || i <= 1 || w[i].endsWith("ales") || w[i].endsWith("aceae")){
				if(!(w[i] in parent))
					parent[w[i]] = {};
				parent = parent[w[i]];
}
			}
		}
//		console.log(t);

		const childrenKeys = Object.keys(t[rootNodeName]);
		root.appendChild(this.createLine(rootNodeName, childrenKeys.length, ""));
		this.structTree(root, t, rootNodeName);
	}
	/*
	再帰的にノードを構築していく
	parent   dom       子ノードをしていく親DOM
	t        hasharray 連想配列にてツリー構造を構築する配列
	nodeName string    ノード名
	*/
	structTree(parent, t, nodeName)
	{
		const childrenKeys = Object.keys(t[nodeName]);
		t = t[nodeName];
		const frame = document.createElement("div");
		frame.className = "checkbox-tree-indent checkbox-tree-collapse";
		frame.id        = "p_" + nodeName;
		for(let i = 0; i < childrenKeys.length; i ++){
			let grandchildrenKeys = Object.keys(t[childrenKeys[i]]);
			let node = this.createLine(childrenKeys[i], grandchildrenKeys.length, nodeName)
			frame.appendChild(node);
			// 再帰
			if(0 < grandchildrenKeys.length)
				this.structTree(frame, t, childrenKeys[i]);
		}
		parent.appendChild(frame);
	}
	/*
	一行のノードのDOMを構築する
	nodeName   string ノード名
	hasChild   int    子ノードの数。0の場合、リーフと判断。
	parentName string 親ノードの名前
	*/
	createLine(nodeName, hasChild, parentName)
	{
		const _this = this;

		// コンテナ
		const myself = document.createElement("div");
		const span   = document.createElement("span");
		span.id = "s_" + nodeName;
		if(hasChild){ // ブランチノード
			span.className = "checkbox-tree-switch";
			span.innerHTML = this.EXPAND_STR;//"→";
			span.onclick   = function(){ _this.switchNode(nodeName); }
		} else { // リーフノード
			span.innerHTML = this.LEAF_STR;
			span.className = "checkbox-tree-no-switch";
		}
		// チェックボックス
		const check = document.createElement("input");
		check.type      = "checkbox";
		check.id        = "cb_" + nodeName;
		check.className = "taxonomy_check ch_" + parentName;
		if(!hasChild)
			check.className += " leaf";
		check.onclick = function(){ _this.allCheck(nodeName); }
		// 上記チェックボックスのラベル
		const label = document.createElement("label");
		label.htmlFor   = "cb_" + nodeName;
		label.className = "checkbox-tree-label";
		label.innerHTML = nodeName.replace(/_/g, ' '); // ※

		myself.appendChild(span);
		myself.appendChild(check);
		myself.appendChild(label);

		return myself;
	}

	/*
	指定されたIDを持つブランチノードを開く
	ids string[] 開きたいノードのID群
	*/
	expands(ids)
	{
		for(let i = 0; i < ids.length; i ++)
			this.expand(ids[i]);
	}
	/*
	指定されたIDを持つブランチノードを閉じる
	ids string[] 閉じたいノードのID群
	*/
	collapses(ids)
	{
		for(let i = 0; i < ids.length; i ++)
			this.collapse(ids[i]);
	}
	/*
	指定されたIDを持つブランチノードを開閉する
	ids string 開閉したいノードのID
	*/
	switchNode(id)
	{
		const element = document.getElementById("p_" + id);
		if(element.classList.contains("checkbox-tree-collapse"))
			this.expand(id);
		else
			this.collapse(id);
	}
	/*
	開く処理
	id string 開きたいノードのID
	*/
	expand(id)
	{
		const element = document.getElementById("p_" + id);
		document.getElementById("s_" + id).innerHTML = this.COLLAPSE_STR;//'↓';
		element.className = "checkbox-tree-indent checkbox-tree-expand";
	}
	/*
	閉じる処理
	id string 閉じたいノードのID
	*/
	collapse(id)
	{
		const element = document.getElementById("p_" + id);
		document.getElementById("s_" + id).innerHTML = this.EXPAND_STR;//'→';
		element.className = "checkbox-tree-indent checkbox-tree-collapse";
	}

	/*
	選択状態を初期化する。
	checkedNodeIDs array 初期状態で選択をしておくleafのID
	*/
	initChecked(checkedLeafIDs)
	{
		// 全ノードを初期化
		const checkboxes = document.getElementsByClassName("taxonomy_check");
		for(let i = 0; i < checkboxes.length; i ++){
			checkboxes[i].checked = false;
			checkboxes[i].classList.remove("checkbox-tree-check-half");
		}

		// 対象ノードをチェック状態に
		for(let i = 0; i < checkedLeafIDs.length; i ++){
			checkedLeafIDs[i] = checkedLeafIDs[i].replace(/ /g, '_'); // ※
			let leaf = document.getElementById("cb_" + checkedLeafIDs[i]);
			leaf.checked = true;
			this.allCheck(checkedLeafIDs[i]);
		}
	}
	/*
	指定したノード名をidに持つノードの、全子ノードにチェックを付ける
	parentName string 起点となるブランチノードの名前
	*/
	checkedChildren(parentName)
	{
		const children = document.getElementsByClassName("ch_" + parentName);
		if(children == null)
			return;

		for(let i = 0; i < children.length; i ++){
			children[i].classList.remove("checkbox-tree-check-half");
			children[i].checked = true;
			this.checkedChildren(children[i].id.substr(3));
		}
	}
	/*
	指定したノード名をidに持つノードの、全子ノードのチェックをはずす
	parentName string 起点となるブランチノードの名前
	*/
	uncheckedChildren(parentName)
	{
		const children = document.getElementsByClassName("ch_" + parentName);
		if(children == null)
			return;

		for(let i = 0; i < children.length; i ++){
			children[i].classList.remove("checkbox-tree-check-half");
			children[i].checked = false;
			this.uncheckedChildren(children[i].id.substr(3));
		}
	}
	/*
	指定したノードのチェック状態を処理する。rootまで再帰処理する
	targetName string 処理をするノードの名前
	*/
	checkParentToRoot(targetName)
	{
		if(targetName.length <= 0)
			return;

		const myself   = document.getElementById("cb_" + targetName); // checkbox
		const children = document.getElementsByClassName("ch_" + targetName); // child

		let checkedCount   = 0;
		let uncheckedCount = 0;
		// まず、子ノードの状態を調べ、全てチェック済みか、全て未チェック済みか、混在状態かを調べる
		for(let i = 0; i < children.length; i ++){
			if(children[i].classList.contains("checkbox-tree-check-half")){
				checkedCount = uncheckedCount = -1;
				break;
			}
			if(children[i].checked)
				checkedCount ++;
			else
				uncheckedCount ++;
		}
		if(children.length === checkedCount){ // 全てチェック
			myself.checked = true;
			myself.classList.remove("checkbox-tree-check-half");
		} else if(children.length === uncheckedCount){ // 全て未チェック
			myself.checked = false;
			myself.classList.remove("checkbox-tree-check-half");
		} else { // 混在
			myself.checked = true;
			myself.classList.add("checkbox-tree-check-half");
		}

		// 親ノードへ再帰的に処理していく
		for(let i = 0; i < myself.classList.length; i ++){
			if(myself.classList[i].startsWith("ch_")){
				let parentName = myself.classList[i].substr(3);
				this.checkParentToRoot(parentName);
				break;
			}
		}
	}
	/*
	指定したノードのチェック状態を子ノード、親ノードに渡って処理する
	nodeName string 対象ノードの名前
	*/
	allCheck(nodeName)
	{
		const myself   = document.getElementById("cb_" + nodeName);
//		const children = document.getElementsByClassName("ch_" + nodeName);

		if(myself.classList.contains("checkbox-tree-check-half") || myself.checked){ // 削除(全てがチェック済み)
			myself.classList.remove("checkbox-tree-check-half");
			myself.checked = true;
			this.checkedChildren(nodeName);
		} else { // チェック(未チェック、もしくは混在)
			this.uncheckedChildren(nodeName);
		}

		// 親要素の処理
		for(let i = 0; i < myself.classList.length; i ++){
			if(myself.classList[i].startsWith("ch_")){
				let parentName = myself.classList[i].substr(3);
				this.checkParentToRoot(parentName);
				break;
			}
		}
	}

	/*
	選択されているleafのID配列を取得する
	return string[] ID配列
	*/
	getSelectedNodes()
	{
		let array = [];
		const leaves = document.getElementsByClassName("leaf");
		for(let i = 0; i < leaves.length; i ++){
			if(leaves[i].checked)
				array.push(leaves[i].id.substr(3).replace(/_/g, ' ')); // ※
		}
		return array;
	}

}