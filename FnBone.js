Raymond


Search Drive

Drive
.
Folder Path
My Drive
source
NEW 
Folders and views
My Drive
Shared with me
Google Photos
Recent
Starred
Trash
5 GB of 115 GB used
Upgrade storage
Get Drive for PC
.

Javascript
fileBrowserSrv.js

Javascript
fnBone.js

Compressed Archive
gdcdoc20160224GitSync.zip

Compressed Archive
gdcdoc20160226ConvertBookToYAMLDone.zip

Compressed Archive
gdcdoc20160227BookSync.zip

Compressed Archive
gdcdoc20160229DoneSync.zip

Compressed Archive
gdcdoc20160301Done.zip

Compressed Archive
gdcdocBook20160217Done.zip

Compressed Archive
gdcdocBook20160217Good.zip

Compressed Archive
gdcdocBook20160222MediaDone.zip

Android Package
hjbrowser.apk

Binary File
hjMoudles.js

Binary File
layoutBrowser.java

Compressed Archive
meng.tar

Compressed Archive
Neutun-2016-01-07.zip

Compressed Archive
src20151026.zip

Compressed Archive
srcNodeJs20140306Fu.tar

Compressed Archive
srcNodeJs20151026.zip

Compressed Archive
testgit201601271.zip

Compressed Archive
testgit20160128.zip

Compressed Archive
testgit20160202.zip

Compressed Archive
testgit20160202A.zip

Compressed Archive
testgit20160203.zip

Compressed Archive
testgit20160203Forever.zip

Compressed Archive
testgit20160205MDYaml.zip

Compressed Archive
testgit20160205Yaml.zip

Compressed Archive
testgit20160217Done.zip

Compressed Archive
testgit20160217Good.zip

Compressed Archive
testgit20160222MediaDone.zip

Compressed Archive
testgit20160229Guid.zip

Compressed Archive
testgit20160301.zip

Compressed Archive
twitter20141201.tar

Compressed Archive
yahoo20141201.tar
Javascript
fnBone.js
Details
Activity
LAST YEAR
R
Youmoved an item to
Dec 2, 2015
Google Drive Folder
source
Javascript
fnBone.js
R
Youcreated an item in
Dec 2, 2015
Google Drive Folder
My Drive
Javascript
fnBone.js
No recorded activity before December 2, 2015
All selections cleared 


/**
 * FnBone
 * the interface of boneback
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    not sure
 */

$(function(){

});


//usage
/**********************
 * 1, add subscribers
 * 2, fbone.request
 * 3, get call back data
 * 4, deal with UI
 */
 
var URL = "http://jlm9701.hackjacket.com:6600";
try {
    Components.utils.import("resource://browsercontent/DbOperator.jsm");
    URL = JsServerURL;
} catch(err) {}
var FnBone = FnBone || {};

(function ($)
{

    var Backbone, fbone, fb, fins, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    //_ = (typeof require !== 'undefined') ? require('underscore') : this._;
    
    if (_ && (_.hasOwnProperty('_'))) {
        _ = _._;
    }

    Backbone = !this.Backbone && (typeof require !== 'undefined') ? require('backbone') : this.Backbone;
    fbone = $ = this.fbone = this.fb = typeof exports !== 'undefined' ? exports : {};
    fins = this.fins = typeof exports !== 'undefined' ? require('fnInstance') : {};
    
    var Subscribers = {"getDataFromNode":{}, "queryAUser":{}, "getOwnerInfo":{}, "uploadFile":{}};

	fbone.FnModel = Backbone.Model.extend({});
	fbone.FnCollection = Backbone.Collection.extend({
		Model: fbone.FnModel,
		fromJson : function(jsonObj) {
			return this.add(jsonObj);
		},
		
		initialize : function(dataArray) {
			if(dataArray instanceof Array) {
				return this.addArray(dataArray);
			}
		},
		
		addArray : function(dataArray) {
			var users = new fbone.FnCollection();
			for(var i=0;i<dataArray.length;++i) {
				var user = new fbone.FnModel({userid:dataArray[i]});
				users.add(user);
			}
			
			return users;
			
		},
	
	});

	fbone.utils = (function(){
		
		return {
	    	getParams : function(useAjax, method, serviceName, data)
	    	{
	    	    return {useAjax:useAjax, method:method, serviceName:serviceName,data:data};
	    	    
	    	},
	    	
	    	composeURI : function(uri, args)
	    	{
	    		if(args == null || args == undefined) {
	    			return;
	    		}
	    		if(args.method == null || 
	    				args.serviceName == null) {
	    			return;
	    		}
	    		var ret = {};
	    		var post = "";
	    		var url = "" + uri;
	    		var contentType = "";
	    		switch(args.method.toUpperCase()) {
		    		case "PUT":
		    		case "DELETE":
		    		case "GET": 
			    		{
			    			url += "/";
			    			url += args.serviceName;
			    			url += "?reqdata=";
			    			var dataTmp = args.data;
			    			if (dataTmp instanceof Backbone.Collection) {
			    			    dataTmp = fbone.utils.json.fromJson(args.data.toJSON());
			    			} else {
			    			    dataTmp = JSON.stringify(JSON.parse(args.data));
			    			}
			    			url += encodeURIComponent(dataTmp);
			    			break;
			    		}
		    		
		    		case "POST": 
			    		{
			    			url += "/";
			    			url += args.serviceName;
			    			
			            	var params = "";
			            	for(var arg in args) {
			            		if(arg == "method" || arg == "func") {
			            			continue;
			            		}
			            		if(arg == "data") {
			    			        var dataTmp = args.data;
			    			        if (dataTmp instanceof Backbone.Collection) {
			    			            dataTmp = fbone.utils.json.fromJson(args.data.toJSON());
			    			        } else {
			    			            dataTmp = JSON.stringify(JSON.parse(args.data));
			    			        }
			            			params += "reqdata=" + encodeURIComponent(dataTmp) + "&";
			            		} else {
			            			params += arg + "=" + args[arg] + "&";
			            		}
			            	}
			            	if(params[params.length-1] == "&") {
			            		params = params.substring(0, params.length-1);
			            	}
			            	post = params;
			    			break;
			    		}
			    	case "POSTFILE":
			    	{
		    			url += "/";
		    			url += args.serviceName;
		    			var boundary = fbone.utils.generateBoundary();
                        contentType = "multipart/form-data;boundary=" + boundary;          
		    			
		    			post = fbone.utils.compositeData(boundary, args.data.fileName, args.data.fileContent);
		
			    	    break;
			    	}
		    			
		    		default: break;
	    		}
	    		
	    		ret.post = post;
	    		ret.url = url;
	    		ret.contentType = contentType;
	    		
	    		return ret;
	    	},
		
		    //binary to string
		    b2s : function(buf) 
		    {
                return String.fromCharCode.apply(null, new Uint16Array(buf));
		    },
		    //string to binary
		    s2b : function(str) 
		    {
                var buf = new ArrayBuffer(str.length*2);
                var bufView = new Uint16Array(buf);
                for(var i=0;i<str.length;++i) {
                    bufView[i] = str.charCodeAt(i);
                }
                
                return buf;
		    },
    		
            generateBoundary: function()
            {
                return "---------------------" + new Date().valueOf();
            },
            
            compositeData: function(boundary, fileName, fileContent)
            {
                var CRLF = "\r\n";
                var parts = [];
                var part ="";

                part += 'Content-Disposition: form-data;';
                part += 'name="file";';
                part += 'filename="'+ fileName + '"'+CRLF;
                part += 'Content-Type: application/octect-stream';
                part += CRLF + CRLF;          
                part += fileContent + CRLF;
                parts.push(part);

                var request = "--" + boundary + CRLF;
                request += parts.join("--" +  boundary + CRLF);
                request += "--" + boundary + "--" + CRLF;
                return request;
            },
            
            isImage : function(fileName)
            {
                var ext = fileName.substring(fileName.lastIndexOf(".")+1);
                return ext.toUpperCase() in  {"BMP":0,"JPG":0,"GIF":0,"PNG":0,"TIF":0,"XBM":0,};
            },
            
            getPath : function(fileName)
            {
                return fileName.substring(0, fileName.lastIndexOf("\\"));
            },
		};
		
	})();
	
    fbone.utils.json = (function () {
    
        var stringTrimRegex = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;
        var stringTrim = function (string) {
            return (string || "").replace(stringTrimRegex, "");
        };
        var stringifyJson = function (data, replacer, space) {
            if ((typeof JSON == "undefined") || (typeof JSON.stringify == "undefined")) {
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            }
            return JSON.stringify(data, replacer, space);
        };
        
        return {
            toJson : function (jsonStr) {
                if (typeof jsonStr == "string") {
                    jsonStr = stringTrim(jsonStr);
                    if (jsonStr) {
                        if (window.JSON && window.JSON.parse) {
                            try {
                                return window.JSON.parse(jsonStr);
                            } catch(err) {
                                return jsonStr;
                            }
                            
                        }
                        return (new Function("return " + jsonStr))();
                    }
                }
                return null;
            },
            
            fromJson : function(jsonObj, replacer, space) {
                return stringifyJson(jsonObj, replacer, space);
            },

        };
        
    })();
    
    //args:     args.method:"Get" or "Post"
    //          args.post: "name=Henry&firstname=Ford"
    //          args.useAjax: true or false
    fbone.utils.ajax = function() 
    {
    
        this.http = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        
        GET = function(http,url, args) {
        	
            http.open("GET", url, args.useAjax==true?true:false);
            
        };
        PUT = function(http,url, args) {
        	
        	http.open("PUT", url, args.useAjax==true?true:false);
        	
        };
        POST = function(http,url, args, len) {
        	
            http.open("POST", url, args.useAjax==true?true:false);
            http.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            //http.setRequestHeader("Content-length",len);
            //http.setRequestHeader("Connection","close");
            
        };
        POSTFILE = function(http, url, args, len) {
            http.open("POST", url, args.useAjax==true?true:false);
        };
        DELETE = function(http,url, args) {
        	
        	http.open("DELETE", url, args.useAjax==true?true:false);
        	
        };
        HEAD = function(http,url, args) {
        	
        	http.open("HEAD", url, args.useAjax==true?true:false);
        	
        };
    }
    fbone.utils.ajax.prototype = {
        
            sendRequest : function(url, args, func) {
                this.http = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
		        this.args = args || {};
		        this.method = this.args.method || "NotSupported";
		        this.func = func;
                var sendStr = null;
                
                var ret = fbone.utils.composeURI(url, args);
                var post = ret.post || "";
                var geturl = ret.url;
                switch(this.method.toUpperCase()) {
                    case "GET" : GET(this.http, geturl, this.args); break;
                    case "PUT" : PUT(this.http, geturl, this.args); break;
                    case "DELETE" : DELETE(this.http, geturl, this.args); break;
                    case "POST" : POST(this.http, geturl, this.args, post.length); sendStr = post; break;
                    case "HEAD" : HEAD(this.http, geturl, this.args); break;
                    case "POSTFILE": POSTFILE(this.http, geturl, this.args, post.length); 
                        this.http.setRequestHeader("Content-Type", ret.contentType);
                    
                        this.http.upload.addEventListener("progress", function(ev) {
                            if(ev.lengthComputable) {
                                var percent = (ev.loaded / ev.total) * 100 + "%";
                            }
                        }, false);
                        this.http.upload.addEventListener("load", function(ev){}, false);
                        this.http.upload.addEventListener("error", function(ev) {console.log(ev);}, false);
                        
                        sendStr = post; 
                        break;
                        
                    case "NOTSUPPORTED" : return;
                }
                
                var _this = this;
                if(this.method.toUpperCase() == "POSTFILE") {
                    this.http.sendAsBinary(sendStr);
                } else {
                    this.http.send(sendStr);
                }
                
                if(_this.args.useAjax == false) {
                    console.log("readyState:"+_this.http.readyState+"    staus:"+_this.http.status);
                    if(_this.http.readyState == 4) {
                        var retMsg = {};
                        if(_this.http.status == 200) {
                            if(_this.http.responseText != null || _this.http.responseText != "") {
                                retMsg = fbone.utils.json.toJson(_this.http.responseText);
                            } else {
                                retMsg = "";
                            }
                            if(_this.func) {
                                _this.func(retMsg);
                            }
                        } else {
                            retMsg = {"response:":_this.http.responseText, "errorStatus":_this.http.status};
                        }
                    }
                } else {
                	this.http.onreadystatechange = function() {
//[{"userName":"ddff", "email":"fnffdd@fn.com"},{"userName":null, "email":"raym@fnm.com"}]

if(0) {                	
                        if(_this.http.readyState == 4) {
                            if(_this.func) {
                                _this.func(fbone.utils.json.toJson('[{"userName":"ssff", "email":"fnddff@fn.com"},{"userName":null, "email":"raym@fnm.com"}]'));
                            }
                        }
} else {                    
                        if(_this.http.readyState == 4) {
                            var retMsg = {};
                            if(_this.http.status == 200) {
                                retMsg = fbone.utils.json.toJson(_this.http.responseText);
                            } else {
                                retMsg = {"response:":_this.http.responseText, "errorStatus":_this.http.status};
                            }
                            if(_this.func) {
                                _this.func(retMsg);
                            }
                        }
    }                    
                    }
                                    	
                }
            },
        };
        
    
    fbone.utils.ajax.url = URL;
    
    //args:     useAjax: true or false
    //          method: Get or Post
    //          serviceName: getUserList
    //          data: Backbone collection
    //cmd:      getDataFromNode
    fbone.request = function(cmd, args, func, url)
    {
        this.cmd = cmd;
        this.args = args;
        if(args==null || args==undefined) {
        	this.args = {useAjax:true,method:"get",serviceName:"getUserList",data:new fbone.FnCollection([{userid:1},{userid:10}])};
        }
        this.func = func;
        
        function execCmd(cmd, args, func, url) {
        	args = args || {};
        	args.func = func;
			args.url = url
        	FnObs.publish(cmd, args);
        };
        
		execCmd(cmd, this.args, this.func, url);
        
    };
    
    fbone.request.prototype["test"] = function() {};
    
    //args.data: collection of backbone
    fbone.commandService = (function(){
        
        function json2Collection(jsonObj)
        {
        
        }
        
        function composeRequest(args, func)
        {
        	var url = args.url || URL;
			
        	new fbone.utils.ajax().sendRequest(url, args, func);
        }
        
        return {
            getDataFromNode : function(args) {
                if(args == null || args.method == null) {
                    return null;
                }
                
                composeRequest(args, args.func);
            },
        };
    })();

    var FnObs = fnInstance.getInst().getFnObs();
    for(var sub in Subscribers) {
    	var cmd = "fbone.commandService."+sub;
        FnObs.subscribe(sub, eval(cmd));
    }


})(FnBone);

