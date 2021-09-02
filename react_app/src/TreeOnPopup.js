import React, {Component} from 'react';
import CheckBoxTree from './CheckBoxTree.js';

const checkboxTree = new CheckBoxTree();

/*
Last-Update: 2021/09/01
App_v0.93.js�Ɠ���

taxonomy�c���[��\���A�I������|�b�v�A�b�v��\������R���|�[�l���g
Usage: <TreeOnPopup onReady=idOfButton endpoint=URLtoElasticSearch column=columnName />
�EonUpdate = �t�B���^���X�V����Ƃ��ɌĂяo���R�[���o�b�N�֐�
�EonReady = �����������������ɗL���ɂ���{�^����ID -> �R�[���o�b�N�֐��ɕς���
�Eendpoint = taxonomy�����擾����elasticsearch�ւ�URL
�Ecolumn = taxonomy��񂪊i�[����Ă���elasticsearch�̃J������
//�EfilterName = Samples�t�B���^�^�O��(onUpdate�̎����ɂ��s�v��)

���_
�E�X�N���[�����Ȃ� -> �ł���΃w�b�_�͌Œ�ɂ�����
*/
class TreeOnPopup extends Component
{
	taxonomyColumn = ''; // taxonomy��񂪓����Ă���J������

//	taxonomyURL = 'http://192.168.1.5:9200/mb-project2/_search';
	taxonomyURL = ''; // taxonomy�����擾���邽�߂�elasticsearch�̃G���h�|�C���g�Bprops��ʂ��ăZ�b�g�����B
	onReady     = null; // ���������������ۂɁA�L���ɂ���{�^����ID�i�R�[���o�b�N�֐���ǂ񂾕��������j
	onUpdate    = null;

	taxonomyData = null; // elasticsearch���璼�ڎ擾����Staxonomy���


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

		// taxonomy�f�[�^���擾����
		var request = '{"query":{"match_all":{}},"size":0,"_source":{"includes":["*"],"excludes":[]},"aggs":{"' + this.taxonomyColumn + '":{"terms":{"field":"' + this.taxonomyColumn + '","size":1000,"order":{"_term":"asc"}}}}}';
		fetch(this.taxonomyURL, { // post
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: request
		}).then((res) => { // ���ʎ擾
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
		}).catch((reason) => { // �G���[
			console.log(reason);
		});
	}

	/*
	�|�b�v�A�b�v��\������
	�t�B���^���e�L�X�g�ōi�荞�݂ł��邽�߁A�\�����ɖ���c���[���\�z����悤�ɂ��Ă���
	*/
	openPopup(e)
	{
//		let sampleFilterStr = document.getElementsByClassName("sample-filter-textbox")[0].childNodes[0].value;
//		if(0 < sampleFilterStr.length){
//			alert("�c���[�\���́ASamples�̍i�荞�݂�����������Ԃł̂ݎg�p�ł��܂��B");
//			return;
//		}
		var rootElement = document.getElementById("tree_container");
		while(rootElement.firstChild)
			rootElement.removeChild(rootElement.firstChild);

		let   expandNodes = ['Root'];
		const targets = document.getElementsByName(this.filterName);
//		if(this.taxonomyTree == null){ // ������
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
		// ���݂̑I����Ԃ�ݒ�
		let checkedNodes = [];
		for(let i = 0; i < targets.length; i ++){
			if(targets[i].checked){
				checkedNodes.push(targets[i].id);
			}
		}
		checkboxTree.initChecked(checkedNodes)

		// �����̊J���
		checkboxTree.expands(expandNodes);

		// open
		document.getElementById("modal-area").className = "modal-background modal-background-open";
	}

	/*
	�`�F�b�N�����m�[�h�𔽉f���āA�|�b�v�A�b�v�����
	*/
	closePopupWithFilter(e)
	{
		// �I����Ԃ𔽉f������
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
	�|�b�v�A�b�v�����
	*/
	closePopup(e)
	{
		document.getElementById("modal-area").className = "modal-background modal-background-close";
	}

	/*
	�`��
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