try {

/********************************
 * Settings
 * Author: Raymond FuXing
 * Date: May 11, 2015
********************************/
var JSXSettingsTitle = React.createClass({
	showFileListItemRadio: function() {
		try {
			HJMessage.send("showFileListItemRadio", {isShowRadio: true});
			HJMessage.send("showFileListFoot", {isShowFoot: true});
		} catch(err) {alert(err);}
	},

	close: function() {
		//HJMessage.send("showPreference", {isShow: true});
		//HtmlJava.exitWindow(function() {}, 0);
	},

    render: function() {
        return (
            <div className='titleBar'>
                <span className='labelTitle'>{this.props.title}</span>
                <img className='imgClose' src='images/close.png' onClick={this.close}/>
            </div>
        );
    }
});

var JSXSettingsSearchEngine = React.createClass({

	getInitialState: function() {
		return {isShow: true, currentSearchEngine: this.props.currentSearchEngine }
	},

	settingSearchEngine: function() {
		HJMessage.send("showSettings", {isShow: false});
		HJMessage.send("showSettingsSearchEngine", {isShow: true});

	},

	componentWillMount: function() {
		window.addEventListener("changeDefaultSearchEngine", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("changeDefaultSearchEngine", this.handleEvent, false);
	},

	handleEvent: function(e) {
		var self = this;
		switch(e.type) {
			case "changeDefaultSearchEngine" :
				self.setState({isShow: e.detail.isShow, currentSearchEngine: e.detail.currentSearchEngine});
				break;
			case "showSettingsSearchEngine":
				renderResult("searchEngines",{});
				break;
			case "showSettingsClearBrowserData":
				break;
			case "showSettingsRemoveDownloads":
				break;

			default: break;
		}
	},

	render: function() {
		return (
			<div className='content' onClick={this.settingSearchEngine}>
				<span>{this.props.title}</span>
				<span className="textRight">{this.state.currentSearchEngine+" >"}</span>
			</div>
		);
	}
});

var JSXSettingsClearBrowserData = React.createClass({

	clearBrowserData: function(e) {
		HJMessage.send("showSettings", {isShow: false});
		HJMessage.send("showSettingsClearBrowserData", {isShow: true});

	},

	render: function() {
		return (
			<div className="content" onClick={this.clearBrowserData}>
				<span>{this.props.title}</span>
				<span className="textRight">{">"}</span>
			</div>
		);
	}
});

var JSXSettingsRemoveDownloads = React.createClass({

	removeDownloads: function(e) {
		HJMessage.send("showSettings", {isShow: false});
		HJMessage.send("showSettingsRemoveDownloads", {isShow: true});

	},

	render: function() {
		return (
			<div className="content" onClick={this.removeDownloads}>
				<span>{this.props.title}</span>
				<span className="textRight">{">"}</span>
			</div>
		);
	}
});



var JSXSettings = React.createClass({

	getInitialState: function() {
		return {isShow: false, currentSearchEngine: this.props.currentSearchEngine }
	},

	componentDidMount: function() {
		this.setState({isShow: true});
	},

	componentWillMount: function() {
		window.addEventListener("showSettings", this.handleEvent, false);
		window.addEventListener("showSettingsSearchEngine", this.handleEvent, false);
		window.addEventListener("showSettingsClearBrowserData", this.handleEvent, false);
		window.addEventListener("showSettingsRemoveDownloads", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("showSettings", this.handleEvent, false);
		window.removeEventListener("showSettingsSearchEngine", this.handleEvent, false);
		window.removeEventListener("showSettingsClearBrowserData", this.handleEvent, false);
		window.removeEventListener("showSettingsRemoveDownloads", this.handleEvent, false);
	},

	handleEvent: function(e) {
		try {
		var self = this;
		var mountNode = document.getElementById("container");
		switch(e.type) {
			case "showSettings" :
				if(!e.detail.currentSearchEngine) {
					e.detail.currentSearchEngine = "GOOGLE";
				}
				self.setState({isShow: e.detail.isShow, currentSearchEngine: e.detail.currentSearchEngine});
				break;
			case "showSettingsSearchEngine":
				renderResult("searchEngines",{});
				break;
			case "showSettingsClearBrowserData":
				//LazyLoad.js(["clearBrowserData.js"], function() {
					try {
						renderResult("clearBrowserData", {});
					} catch(err) {alert(err);}
				//});
				break;
			case "showSettingsRemoveDownloads":

				// LazyLoad.js(["downloadStorage.js", "data.js"], function() {
					
				// 	getDownload(function(ret) {
					
				// 		try {
				// 			renderResult("showDownloads", {data:ret, from:"settings"});

				// 		} catch(err) {alert(err);}

					
				// 	});
				// });
				LazyLoad.js(["downloadStorage.js", "data.js"], function() {
					try {
						
						HtmlJava.showDownloads(function() {}, HJDatabaseName, Table.download, "select * from download", {from:"settings"});

					} catch(err) {alert(err);}
				});

				break;

			default: break;
		}
	} catch(err) {alert(err);}
	},


	render: function() {
		return (
			<div id="settings" className={this.state.isShow?"show":"hidden"}>
				<JSXSettingsTitle title={this.props.title} items={this.props.items} ></JSXSettingsTitle>
				<JSXSettingsSearchEngine title="Search Engine" currentSearchEngine={this.props.currentSearchEngine}></JSXSettingsSearchEngine>
				<JSXSettingsClearBrowserData title="Clear Browser Data"></JSXSettingsClearBrowserData>
				<JSXSettingsRemoveDownloads title="Remove Downloads"></JSXSettingsRemoveDownloads>
			</div>
		);
	}
});

/********************************
 * Search Engine Settings
 * Author: Raymond FuXing
 * Date: May 12, 2015
********************************/
var JSXSearchEngineTitle = React.createClass({

	onBack: function() {
		HJMessage.send("restoreSettings", {isShow: true});

	},

	onSave: function() {
		HJMessage.send("saveSearchEngine", {isShow: true});

	},

	render: function() {
		return (
			<div className="titleBar">
				<img className="imgLeft" src="images/back.png" onClick={this.onBack}></img>
				<span>{this.props.title}</span>
				<img className="textRight right5" src="images/check.png" onClick={this.onSave}></img>
			</div>
		);
	}
});

var JSXSearchEngineListItem = React.createClass({

	showItem : function(itemData) {
		HJMessage.send("currentSearchEngine", {currentSearchEngine: itemData.label});
	},

	getInitialState: function() {
		return {isShowRadio: true, isChecked: false, isShowItem: true }
	},

	onChange: function() {

		this.setState({isChecked: !this.state.isChecked});
	},

	componentWillMount: function() {
	},

	componentWillUnmount: function() {
	},

  
    render: function() {
    	
        return (
        	<div className="content">
	            <label className="listItem" itemdata='{JSON.stringify(this.props.itemData)}' onClick={this.showItem.bind(this, this.props.itemData)}>
	            	<input className={this.state.isShowRadio?'mediumRadio radioLeft':'hidden'} type='radio' name='listItemSetting' ></input>
	            	<span className="left5">{this.props.itemData.label}</span>
	            </label><br></br>
            </div>
 
        );
    }
});
  

var JSXSearchEngine = React.createClass({

	currentSearchEngine: '',

	getInitialState: function() {
		return {isShow: false}
	},

	componentDidMount: function() {
		this.setState({isShow: true});
	},

	componentWillMount: function() {
		window.addEventListener("restoreSettings", this.handleEvent, false);
		window.addEventListener("saveSearchEngine", this.handleEvent, false);
		window.addEventListener("currentSearchEngine", this.handleEvent, false);
		window.addEventListener("showSettingsSearchEngineWin", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("restoreSettings", this.handleEvent, false);
		window.removeEventListener("saveSearchEngine", this.handleEvent, false);
		window.removeEventListener("currentSearchEngine", this.handleEvent, false);
		window.removeEventListener("showSettingsSearchEngineWin", this.handleEvent, false);
	},

	handleEvent: function(e) {
		var self = this;
		switch(e.type) {
			case "currentSearchEngine":
				this.currentSearchEngine = e.detail.currentSearchEngine;
				break;
			case "restoreSettings" :
				self.setState({isShow: false});
				HJMessage.send("showSettings", {isShow: true});
				break;
			case "saveSearchEngine" :
				self.setState({isShow: false});
				renderResult("settings", {defaultSearchEngine: self.currentSearchEngine});
				HJMessage.send("showSettings", {isShow: true});
				HJMessage.send("changeDefaultSearchEngine", {currentSearchEngine: self.currentSearchEngine});
				break;
			case "showSettingsSearchEngineWin":
				self.setState({isShow: e.detail.isShow});
				break;
			default: break;
		}
	},


	render: function() {

		var searchEngines = [
			{label:"GOOGLE", value:"google"},
			{label:"YAHOO! CANADA", value:"yahooCanada"},
			{label:"YAHOO! QUEBEC", value:"yahooQuebec"},
			{label:"ASK", value:"ask"},
			{label:"BING", value:"bing"}
		];

		return (
			<div id="settingSearchEngine" className={this.state.isShow?"show":"hidden"}>
				<JSXSearchEngineTitle title="SEARCH ENGINE"></JSXSearchEngineTitle>
				{
					searchEngines.map(function(item, i) {
						return (
							<JSXSearchEngineListItem itemData={item} ></JSXSearchEngineListItem>
						);
					}, this)
				}
			</div>
		);
	}
});

/********************************
 * Clear Browser Data Settings
 * Author: Raymond FuXing
 * Date: May 13, 2015
********************************/
var JSXClearBrowserDataTitle = React.createClass({

	onBack: function() {
		HJMessage.send("backSettings", {isShow: true});

	},

	onSave: function() {
		HJMessage.send("closeClearBrowserData", {isShow: true});

	},

	render: function() {
		return (
			<div className="titleBar">
				<img className="imgLeft" src="images/back.png" onClick={this.onBack}></img>
				<span>{this.props.title}</span>
				<img className="textRight" src="images/close.png" onClick={this.onSave}></img>
			</div>
		);
	}
});

var JSXClearBrowserData = React.createClass({

	getInitialState: function() {
		return {isShow: false}
	},

	componentDidMount: function() {
		this.setState({isShow: true});
	},

	componentWillMount: function() {
		window.addEventListener("backSettings", this.handleEvent, false);
		window.addEventListener("closeClearBrowserData", this.handleEvent, false);
		window.addEventListener("showSettingsClearBrowserDataWin", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("backSettings", this.handleEvent, false);
		window.removeEventListener("closeClearBrowserData", this.handleEvent, false);
		window.removeEventListener("showSettingsClearBrowserDataWin", this.handleEvent, false);
	},

	handleEvent: function(e) {
		var self = this;
		switch(e.type) {
			case "backSettings" :
				self.setState({isShow: false});
				HJMessage.send("showSettings", {isShow: e.detail.isShow});
				break;
			case "closeClearBrowserData" :
				self.setState({isShow: false});
				//renderResult("settings", {});
				HJMessage.send("showSettings", {isShow: true});
				break;
			case "showSettingsClearBrowserDataWin":
				self.setState({isShow: e.detail.isShow});
				break;
			default: break;
		}
	},


	render: function() {

		return (
			<div id="settingClearBrowserData" className={this.state.isShow?"show":"hidden"}>
				<JSXClearBrowserDataTitle title="CLEAR BROWSER DATA"></JSXClearBrowserDataTitle>
			</div>
		);
	}
});

/********************************
 * speed dial page
 * Author: Raymond FuXing
 * Date: May 14, 2015
********************************/
var JSXSpeedialItem = React.createClass({

	render: function() {
		var imgPath = "images/speedial/"+this.props.itemData.name+".png";
		//alert(imgPath);

		return (
			<a className="content textLeft" href={this.props.itemData.url}>
				<img className="imgSpeedial" src={imgPath}></img><br></br>
				<span>{this.props.itemData.name.toUpperCase()}</span>
			</a>
		);
	}
});

var JSXSpeedial = React.createClass({

	getInitialState: function() {
		return {isShow: false, itemsData: this.props.items}
	},

	componentDidMount: function() {
		this.setState({isShow: true});
	},

	componentWillMount: function() {
		window.addEventListener("showSpeedialWin", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("showSpeedialWin", this.handleEvent, false);
	},

	newLink: function() {
		this.setState({isShow: false});
		LazyLoad.js(["data.js"], function() {
			getHistory(function(ret) {
				renderResult("addQuickLink", {history: ret});
			});
		});
	},

	handleEvent: function(e) {
		var self = this;
		switch(e.type) {
			case "backSettings" :
				self.setState({isShow: false});
				HJMessage.send("showSettings", {isShow: e.detail.isShow});
				break;
			case "closeClearBrowserData" :
				self.setState({isShow: false});
				//renderResult("settings", {});
				HJMessage.send("showSettings", {isShow: true});
				break;
			case "showSpeedialWin":
				var data = this.props.items;
				if(e.detail.items) {
					if(e.detail.items != this.props.items) {
						data = e.detail.items;
					}
				}
				self.setState({isShow: e.detail.isShow, itemsData: data});
				break;
			default: break;
		}
	},


	render: function() {

		return (
			<div id="speedial" className={this.state.isShow?"show":"hidden"}>
				<img src="images/newlink.png" alt="New Quick Link" className="imgBottom" onClick={this.newLink}></img>
				{
					this.state.itemsData.speedial.map(function(item, i) {
						return (
							<JSXSpeedialItem itemData={item} ></JSXSpeedialItem>
						);
					}, this)
				}
			</div>
		);
	}
});

/********************************
 * add quick link page
 * Author: Raymond FuXing
 * Date: May 14, 2015
********************************/
var JSXAddQuickLinkTitle = React.createClass({
	closeAddQuickLink: function() {
		try {
			HJMessage.send("showAddQuickLinkWin", {isShow: false});
			HJMessage.send("showSpeedialWin", {isShow: true});
		} catch(err) {alert(err);}
	},

	saveQuickLink: function() {
		HJMessage.send("saveQuickLink");
	},

    render: function() {
        return (
            <div className='titleBar'>
            	<span className="imgLeft" onClick={this.closeAddQuickLink}>CANCEL</span>
                <span className='labelTitle'>{this.props.title}</span>
                <span className='textRight' onClick={this.saveQuickLink}>DONE</span>
            </div>
        );
    }
});

var JSXAddQuickLink = React.createClass({

	getInitialState: function() {
		return {isShow: false}
	},

	componentDidMount: function() {
		this.setState({isShow: true});
	},

	componentWillMount: function() {
		window.addEventListener("saveQuickLink", this.handleEvent, false);
		window.addEventListener("showAddQuickLinkWin", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("saveQuickLink", this.handleEvent, false);
		window.removeEventListener("showAddQuickLinkWin", this.handleEvent, false);
	},

	setQuickLink: function(url) {
		var ele = document.querySelector("#addQuickLinkUrl");
		if(ele) {
			ele.value = url;
		}
	},

	handleEvent: function(e) {
		try {
			var self = this;
			switch(e.type) {
				case "saveQuickLink" :
					var eleTitle;
					var eleUrl;
					var eles = document.querySelectorAll("#addQuickLink input");
					if(eles) {
						eleTitle = eles[0];
						eleUrl = eles[1];
					}
					
					if(eleUrl && eleTitle) {
						var url = eleUrl.value;
						var title = eleTitle.value;
	
						var name = HJUtils.extractHostname(url);
						
						speedialData.add(function(ret) {}, title, url, name);

						self.setState({isShow: false});
						HJMessage.send("showSpeedialWin", {isShow: true});
						HJMessage.send("newTabMessages", {method:"refreshSpeedial"});
					}
					break;
				case "closeClearBrowserData" :
					self.setState({isShow: false});
					//renderResult("settings", {});
					HJMessage.send("showSettings", {isShow: true});
					break;
				case "showAddQuickLinkWin":
					self.setState({isShow: e.detail.isShow});
					break;
				default: break;
			}
		} catch(err) {alert(err);}
	},


	render: function() {

		return (
			<div id="addQuickLink" className={this.state.isShow?"show content":"hidden"}>
				<JSXAddQuickLinkTitle title="ADD QUICK LINK"></JSXAddQuickLinkTitle>
				<input id="addQuickLinkTitle" type="text" className="width100" placeholder="Quick Link Name"></input>
				<input id="addQuickLinkUrl" type="text" className="width100" placeholder="http://"></input>
				<p className="width100 seperatorText">Select Address</p>
				{
					this.props.items.history.map(function(item, i) {
						return (
							<div>
								<span className="width100 content" onClick={this.setQuickLink.bind(this,item.url)}>{item.url}</span><br></br>
							</div>
						);
					}, this)
				}
			</div>
		);
	}
});


/********************************
 * manage speed dial page
 * Author: Raymond FuXing
 * Date: May 19, 2015
********************************/
var JSXSpeedialsListTitle = React.createClass({
	showListItemRadio: function() {
		try {
			HJMessage.send("showSpeedialsListItemRadio", {isShowRadio: true});
			HJMessage.send("showSpeedialsListFoot", {isShowFoot: true});
		} catch(err) {alert(err);}
	},

	close: function() {
		if(this.props.from) {
			HJMessage.send("closeSpeedials", {isShow: false});
		} else {
			HJMessage.send("showPreference", {isShow: true});
			//HtmlJava.exitWindow(function() {}, 0);
		}
	},

    render: function() {
        return (
            <div className='titleBar'>
                <img className='imgTitle' src='images/editDownload.png' onClick={ this.showListItemRadio }/>
                <span className='labelTitle'>{this.props.title}</span>
                <img className='imgClose' src='images/close.png' onClick={this.close}/>
            </div>
        );
    }
});

var JSXSpeedialsListFoot = React.createClass({

	getInitialState: function() {
		return {isShowFoot: false }
	},

	componentWillMount: function() {
		window.addEventListener("showSpeedialsListFoot", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("showSpeedialsListFoot", this.handleEvent, false);
	},

	handleEvent: function(e) {
		var self = this;
		switch(e.type) {
			case "showSpeedialsListFoot" :
				self.setState({isShowFoot: e.detail.isShowFoot});
				break;

			default: break;
		}
	},

	doDelete: function() {
		try {
			HJMessage.send("deleteSpeedialsItem", {});
		} catch(err) {alert(err);}

	},

	closeFoot: function() {

		try {
			HJMessage.send("showSpeedialsListItemRadio", {isShowRadio: false});
			HJMessage.send("showSpeedialsListFoot", {isShowFoot: false});
		} catch(err) {alert(err);}

	},
  
    render: function() {
        return (
            <div className={'bottom '+(this.state.isShowFoot?'show':'hidden')}>
                <img className='imgLeft' src='images/deleteDownload.png' onClick={this.doDelete}/>
                <p className='textRight' onClick={this.closeFoot}>{this.props.caption}</p>
            </div>
 
        );
    }
});

var JSXSpeedialsListItem = React.createClass({

	showFile : function(itemData) {
		//alert(JSON.stringify(itemData));
	},

	getInitialState: function() {
		return {isShowRadio: false, isChecked: false, isShowItem: true }
	},

	onChange: function() {

		this.setState({isChecked: !this.state.isChecked});
	},

	componentWillMount: function() {
		window.addEventListener("showSpeedialsListItemRadio", this.handleEvent, false);
		window.addEventListener("removeSpeedialsItem", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("showSpeedialsListItemRadio", this.handleEvent, false);
		window.removeEventListener("removeSpeedialsItem", this.handleEvent, false);
	},

	handleEvent: function(e) {
		try {
		var self = this;
		switch(e.type) {
			case "showSpeedialsListItemRadio" :
				self.setState({isShowRadio: e.detail.isShowRadio});
				break;

			case "removeSpeedialsItem":
				if(self.state.isChecked) {
					var itemData = self.props.itemData;
					HJMessage.send("operateSpeedialsData", {method: "remove", data:{id: itemData.id}});
					HJMessage.send("newTabMessages", {method:"refreshSpeedial"});
					HtmlJava.refreshCurrentTab(function() {});


					self.setState({isShowItem: false});

					var item = self.getDOMNode();
					//item.parentNode.removeChild(item);
					React.unmountComponentAtNode(item.parentNode);
					//$(item).remove();

					self.setState({isShowRadio: self.state.isShowRadio});

					//alert(JSON.stringify(self.props.itemData));
				}
				break;

			default: break;
		}
		} catch(err) {alert(err);}
	},
  
    render: function() {
    	var ext = this.props.itemData.name + ".png";
        return (
            <div className={this.state.isShowItem?'fileListItem':'hidden'} itemdata='{JSON.stringify(this.props.itemData)}' onClick={this.showFile.bind(this, this.props.itemData)}>
            	
	            	<input className={this.state.isShowRadio?'bigRadio radioLeft':'hidden'} type='radio' name='speedialsList' onChange={this.onChange}/>
	                <img className='imgLeft' src={'images/speedial/'+ext}/>
	                <h4 className='left5'>{this.props.showName}</h4>
	                <h5 className='left5'>{this.props.showPath}</h5>
                
            </div>
 
        );
    }
});
  
var JSXSpeedialsList = React.createClass({

	getInitialState: function() {
		return {isShow: true }
	},

	componentWillMount: function() {
		window.addEventListener("deleteSpeedialsItem", this.handleEvent, false);
		window.addEventListener("closeSpeedials", this.handleEvent, false);
		window.addEventListener("operateSpeedialsData", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("deleteSpeedialsItem", this.handleEvent, false);
		window.removeEventListener("closeSpeedials", this.handleEvent, false);
		window.removeEventListener("operateSpeedialsData", this.handleEvent, false);
	},

	handleEvent: function(e) {
		var self = this;
		switch(e.type) {
			case "deleteSpeedialsItem" :
				self.deleteSpeedialsItem();
				break;

			case "closeSpeedials":
				self.setState({isShow: e.detail.isShow});
				break;
			case "operateSpeedialsData": {

				try {
					if(e.detail) {
						switch(e.detail.method) {
							case "add":
								break;
							case "remove":
								var data = e.detail.data;
								var id = data.id;
								speedialStorage.remove(id);
								break;
							case "update":
								break;
						}
					}
				} catch(err) {alert(err);}
				break;
			}
			default: break;
		}
	},

	deleteSpeedialsItem: function(fileName)
	{
		try {
			HJMessage.send("removeSpeedialsItem", null);

			if(!fileName) {
				var item = document.querySelector('input[name="speedialsList"]:checked');
				if(item) {
					//alert(item.parentNode.outerHTML);
					//var itemData = item.parentNode.getAttribute('itemData'); alert(itemData)
				}
			}

		} catch(err) {alert(err);}
	},

	render: function() {

		return (
			<div id="listSpeedialsContent" className={this.state.isShow?"show":"hidden"}>
				<JSXSpeedialsListTitle title="SPEED DIAL"></JSXSpeedialsListTitle>
				{
					this.props.items.map(function(item, i) {
						return (
							<JSXSpeedialsListItem itemData={item} showName={item.title} showPath={item.url}></JSXSpeedialsListItem>
						);
					}, this)
				}
				<JSXSpeedialsListFoot caption="CANCEL"></JSXSpeedialsListFoot>
			</div>
		);
	} 
});

/********************************
 * manage browsing historys
 * Author: Raymond FuXing
 * Date: Jul 22, 2015
********************************/
var HistoryList = React.createClass({

	mixins: [InfiniteScrollMixin],

	getInitialState: function() {
		return {isShow: true, itemDatas: this.props.items.slice(0, onePageNum) }
	},

	componentWillMount: function() {
		window.addEventListener("deleteHistoryItem", this.handleEvent, false);
		window.addEventListener("closeHistoryList", this.handleEvent, false);
		window.addEventListener("openHistoryUrl", this.handleEvent, false);
		window.addEventListener("clearAllHistoryList", this.handleEvent, false);
		window.addEventListener("filterHistoryList", this.handleEvent, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("deleteFileItem", this.handleEvent, false);
		window.removeEventListener("closeHistoryList", this.handleEvent, false);
		window.removeEventListener("openHistoryUrl", this.handleEvent, false);
		window.removeEventListener("clearAllHistoryList", this.handleEvent, false);
		window.removeEventListener("filterHistoryList", this.handleEvent, false);
	},

	handleEvent: function(e) {
		e.preventDefault();
		e.stopPropagation();
		var self = this;
		switch(e.type) {
			case "deleteHistoryItem" :
				var divId = e.detail.nodeId;
				var id = e.detail.id;
				alert(divId+"\n"+id);
				try {

					HtmlJava.dbOperate(function() {}, HJDatabaseName, Table.history, "delete * from history where id="+id, {from:"preference", callback:null});

				} catch(err) {alert(err);}

				break;

			case "closeHistoryList": alert(e.type);
				HtmlJava.showWebWindow(function() {}, "fullscreenWin", false);
				self.setState({isShow: false});
				break;

			case "openHistoryUrl":
					//HtmlJava.showWebWindow(function() {}, "fullscreenWin", false);
					//var url = e.detail.url;
					//HtmlJava.newTab(function() {}, url);
				break;

			case "clearAllHistoryList":
				try {

					HtmlJava.dbOperate(function() {}, HJDatabaseName, Table.history, "delete * from history", {from:"preference", callback:null});

				} catch(err) {alert(err);}

				break;

			case "filterHistoryList":
				HJMessage.send("closePopover", {});
				var pos = e.detail.pos;
				var datas = this.props.items;
				var data = this.handleFilterData(datas, pos);
				if(data) {
					self.setState({itemDatas: data});
				}
				break;
			default: break;
		}
	},

	handleFilterData: function(data, pos)
	{
		var today = new Date();
		var compareDatePrev = today;
		var compareDateNext = today;
		switch(pos) {
			case 0: //today
				compareDatePrev = new Date(today.getFullYear(), today.getMonth(), today.getDate());
				compareDateNext = today;
				break;
			case 1: //yesterday
				compareDatePrev = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
				compareDateNext = new Date(today.getFullYear(), today.getMonth(), today.getDate() -1, 23, 59, 59);
				break;
			case 2: //last 7 days
				compareDatePrev = new Date(today.getDate(0) - 7);
				compareDateNext = today;
				break;
			case 3: //this month
				compareDatePrev = new Date(today.getFullYear(), today.getMonth(), 1);
				compareDateNext = today;
				break;
			case 4: //this year
				compareDatePrev = new Date(today.getFullYear(), 0, 1);
				compareDateNext = today;
				break;
			case 5: //all
				return data;
		}

		if(data && data.length) {
			return data.filter(function(obj) {
				var date = new Date(obj.historyTime);
				return (date >= compareDatePrev && date <= compareDateNext);
			});
		}
		return [];
	},

	deleteHistoryItem: function(fileName)
	{
		try {
			HJMessage.send("removeFileItem", null);

			if(!fileName) {
				var item = document.querySelector('input[name="fileList"]:checked');
				if(item) {
					//alert(item.parentNode.outerHTML);
					//var itemData = item.parentNode.getAttribute('itemData'); alert(itemData)
				}
			}

		} catch(err) {alert(err);}
	},

	fetchNextPage: function(nextPage)
	{
		var begin = (nextPage+1) * onePageNum;
		var end = begin + onePageNum;
		var data = this.state.itemDatas;
		data = data.concat(this.props.items.slice(begin, end));

		this.setState({itemDatas: data});
	},

	render: function() {//alert(this.props.from+"\n"+JSON.stringify(this.props.items));
		return (
			<div id="listHistoryContent" className={this.state.isShow?"show":"hidden"}>
				<HistoryListTitle title={this.props.title} from={this.props.from}></HistoryListTitle>
				{
					this.state.itemDatas.map(function(item, i) {
						return (
							<HistoryListItem itemData={item} showName={item.fileName} showPath={item.url}></HistoryListItem>
						);
					}, this)
				}
				<HistoryListFoot caption='CLEAR BROWSING DATA'></HistoryListFoot>
			</div>
		);
	}
});

var historyListProps = {
  title: "HISTORY",
  theme: "hj",
  data: {
    left: [

      {
        
      }
    ],
    right: [
      {
        link: "",
        icon: "search",
        onclick:function(e) {alert("history search")}
      },
      {
        link: "",
        icon: "close",
        onclick: function(e) {HtmlJava.showWebWindow(function() {}, "fullscreenWin", false);}
      }
    ]
  }
};

function showFilter(pos)
{
	//filter data using pos
	HJMessage.send("filterHistoryList", {pos:pos});
}

// var historyFilters = ["Today", "Yesterday", "Last 7 Days", "This Month", "This Year", "All"];
// var divHistoryFilter = document.querySelector(".am-header-nav.am-header-left");
// if(divHistoryFilter) {
// 	var divDiv = document.createElement("span");
// 	divHistoryFilter.appendChild(divDiv);
// 	React.render(<HistoryListFilter items={historyFilters}/>, divDiv);
// }

var HistoryListFilter = React.createClass({
	render: function() {
		return (
			<PopoverTrigger
				trigger = "click"
				amSize = "sm"
				placement = "bottom"
				popover = {
					<Popover>
					{
						this.props.items.map(function(item, i) {
							var func = "function() {showFilter("+i+");}"
							return (
								<Dropdown.Item className="hjDropdown" onclick={func} >{item}</Dropdown.Item>
							);
						}, this)
					}
					</Popover>
				}>
				<Icon icon="filter" amStyle="primary"></Icon>
			</PopoverTrigger>

		);
	}
});

var HistoryListTitle = React.createClass({
	render: function() {
		return (
			<Sticky top={0} animation="slide-top">
				<Header {...historyListProps} />
			</Sticky>
		);
	}
});

var HistoryListItem = React.createClass({

	getInitialState: function() {
		return {isShowItem: true }
	},

	componentWillMount: function() {
		window.addEventListener("clearAllHistory", this.clearAllHistory, false);
	},

	componentWillUnmount: function() {
		window.removeEventListener("clearAllHistory", this.clearAllHistory, false);
	},

	deleteHistory: function(event) {
		try {
			var self = this;
			var id = this.props.itemData.id;
			
			//HJMessage.send("deleteHistoryItem", {nodeId: divId, id: id});
			HtmlJava.dbOperate(function() {}, HJDatabaseName, Table.history, "delete from history where id="+id, {from:"preference", callback:""});

			self.setState({isShowItem: false});

			var item = self.getDOMNode();
			//item.parentNode.removeChild(item);
			React.unmountComponentAtNode(item.parentNode);
		} catch(err) {alert(err);}
	},

	openHistory: function(event) {
		event.preventDefault();
		event.stopPropagation();
		var url = this.props.itemData.url;
		//HJMessage.send("openHistoryUrl", {url: url});
		HtmlJava.showWebWindow(function() {}, "fullscreenWin", false);
		HtmlJava.newTab(function() {}, url);
	},

	clearAllHistory: function(event) {
		this.setState({isShowItem: false});
		HJMessage.send("clearAllHistoryList", {});
	},

	render: function() {
		var favicon = 'http://www.google.com/s2/favicons?domain='+this.props.itemData.url;
		var url = (this.props.itemData.url.length > 40) ? this.props.itemData.url.substr(0, 40)+"..." : this.props.itemData.url;
		var title = (this.props.itemData.title.length > 50) ? this.props.itemData.title.substr(0, 50)+"..." : this.props.itemData.title;
		var itemId = new Date().getTime();
		return (
			<div id={itemId}  className={this.state.isShowItem?'fileListItem':'hidden'}>
				<img className="imgLeft" src={favicon}/>
				<img className="imgClose16" src="images/close.png" onClick={this.deleteHistory}/>
				<div className="left5" onClick={this.openHistory}>{title}</div>
				<div className="left5" onClick = {this.openHistory}>{url}</div>
			</div>
		);
	}
});

var historyListFooterData = {
	title: "CLEAR BROWSING DATA",
	theme: "hj",
	link: "#clearBrowserData"
};

var HistoryListFoot = React.createClass({

	clearAllHistory: function() {
		HJMessage.send("clearAllHistory", {});
	},


	render: function() {
		return (<Header {...historyListFooterData} onClick={this.clearAllHistory}/>);
	}
});
/**********************************
end HistoryList
***********************************/

} catch(err) {alert(err);}

