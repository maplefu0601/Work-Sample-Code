
/**
 * FnFileBrowser
 * the interface of file browser
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    2010-2015
 */
//Components.utils.import("resource://webpagesvrmoudleLoader/fnconfiguration.jsm"); 
Components.utils.import("resource://browsercontent/DbOperator.jsm");
Components.utils.import("resource://browsercontent/FnGlobalObject.jsm");
Components.utils.import("resource://browsercontent/thirdParty.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

function doFileBrowser(event)
{
    var doc = event.target.doc;
    doc.defaultView.postMessage("thisis a test", "http://192.168.5.17:8800");
    doc.body.setAttribute("callbackdata",browserSrv.getFiles());
    doc.body.setAttribute("callback", "showFiles", 0);	
//    alert(event.target);
}

function doLoad(targetobj)
{
    try {
        var doc = targetobj.doc;
        doc.body.setAttribute("callbackdata", browserSrv.getDrives());
        doc.body.setAttribute("callback", "processMessage", 0);	
    } catch(err) {
        alert(err);
    }
}

/************************************************************************/
/* FnFileBrowserSrv
/* provides functions and interfaces for fn browser
/* @Author: Raymond FuXing
/* @Date: 2012.07
/************************************************************************/
var FnFileBrowserSrv = {};

FnFileBrowserSrv.ExtensionUtils = function()
{
	this.createResourceTemp = function(name)
	{
		let ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		let resourceHandler = ioService.getProtocolHandler('resource').QueryInterface(Components.interfaces.nsIResProtocolHandler);
		let sfile = Components.classes["@mozilla.org/file/directory_service;1"].
			   getService(Components.interfaces.nsIProperties).
			   get("Home", Components.interfaces.nsIFile);
		sfile.append("Application Data");
		sfile.append(name || "ExtensionTemp");

		if(sfile.exists() == false)	{
			sfile.create(sfile.DIRECTORY_TYPE, 600);
		}
		else {
			//If the folder has been exists then recreate a new one
			sfile.remove(true);
			sfile.create(sfile.DIRECTORY_TYPE, 600);
		}
		let resourcesURI = ioService.newFileURI(sfile);
		//all letters in domain must be small case.!!!!!
		resourceHandler.setSubstitution("extensiontemp", resourcesURI);
	}
}

/************************************************************************/
/* FileBrowser
/* to get files and folders from local drives or cloud server
/* @Author: Raymond FuXing
/* @getDrives: return all drives
/* @getFiles: return all files under specific folder
/* @isFnLink: return a files is fn link or normal one
/************************************************************************/
FnFileBrowserSrv.FileBrowser = function()
{

	this.getDrives = function()
	{
		return browserSrv.getDrives();
	};
	
	this.getFiles = function(filter)
	{
		return browserSrv.getFiles(filter);
	};
	
	this.isFnlink = function(url)
	{
	    var ext = url.substring(url.lastIndexOf(".")+1).toLowerCase();
	    return ext == "fnlink" || ext == "fnl";
	}

	this.getFileDocId = function(file)
	{
	    return browserSrv.getFileDocId(file);
	}
	
	this.getFileReaderInfo = function(file)
	{
	    return browserSrv.getFileReaderInfo(file);
	}

    /*************************************/
    /* getFnFileProperty: to get recipients' information from file's header
    /* @param data: {file:"" }
    /* @return recipients:[{ownerId:9001, pubKey:"", hidden: false, accessLevel: 4},]
    /*************************************/
	this.getFnFileProperty = function(file, func)
	{
	    return browserSrv.getFnFileProperty(func, file);
	}

    /*************************************/
    /* setFnFileProperty: to set recipients' information to file's header
    /* @param data: {file:"", recipients:[{ownerId:9001, pubKey:"", hidden: false, accessLevel: 4},]}
    /* @return succeed or fail
    /*************************************/
	this.setFnFileProperty = function(data, func)
	{
	    return browserSrv.setFnFileProperty(func, data.file, JSON.stringify(data.recipients));
	}
	
}

/************************************************************************/
/* UserInfo
/* get user infomation from fn client
/* @Author: Raymond FuXing
/************************************************************************/
FnFileBrowserSrv.UserInfo = function()
{
    this.ownerId = function()
    {
        return browserSrv.getOwnerId();
    }
}

/************************************************************************/
/* DocBrowser
/* provides functions and interfaces for nodejs document processing
/* @Author: Raymond FuXing
/************************************************************************/
FnFileBrowserSrv.DocBrowser = function()
{
	this.docType = {fnLink:1,bwImage:2,fnText:4,};
	/**
	 * createFnlink: create a fnlink file
	 * @param docGuids: json string format
	 * @param path: the path to store fnlink file
	 * @return fnlink filename with full path
	 */
	this.createFnlink = function(docGuids, file)
	{
		return browserSrv.createDocFile(this.docType.fnLink, docGuids, file);
	};
	
	/**
	 * createBWImage: create a black and white jpeg image file
	 * @param docId: json string format
	 * @param path: the path to store image file
	 * @return b&w image file with full path
	 */
	this.createBWImage = function(docGuid, path)
	{
		return browserSrv.createDocFile(this.docType.bwImage, docGuid, path);
	};
	
	/**
	 * getDocGuidFromFnlink
	 * @param fnlink: filename with full path
	 * @return docGuids in file in Json string format
	 */
	this.getDocGuidFromFnlink = function(fileName)
	{
	    var content = browserSrv.getDocFile(this.docType.fnLink, fileName);
	    if (content) {
	        var docid = content.match(/^fndocid:([A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12})/g);
	        return docid[0];
	    }
	    return null;
	};
	
	/**
	 * getDocGuidFromBWImage
	 * @param imgData: file with binary image data
	 * @return docGuid
	 */
	this.getDocGuidFromBWImage = function(imgData)
	{
		return browserSrv.getDocFile(this.docType.bwImage, imgData);
	};
}

/************************************************************************/
/* DocEncryptor
/* provides functions and interfaces for encrypting documents
/* @Author: Raymond FuXing
/************************************************************************/
FnFileBrowserSrv.DocEncryptor = function()
{
	/**
	 * encryptFileFolder
	 * @param fileName: the file need to be encrypted
	 * @return all readers info with json format
	 * get GUID with atob("fnDocId")
	 */
	this.encryptFileFolder = function(func, fileName)
	{
	    return browserSrv.fnBrowserFileOpen({execute:func}, fileName);
	}
	
	/************************************************************************/
	/* encryptFileFolderEx
	/* without multithread
	/************************************************************************/
	this.encryptFileFolderEx = function(func, fileName)
	{
	    return browserSrv.fnBrowserFileOpenEx({execute:func}, fileName);
	}
	
	this.encryptFileFolderNewEx = function(func, fileName, emails)
	{
	    return browserSrv.fnBrowserFileOpenNewEx({execute:func}, fileName, emails);
	}
	
	this.decryptRepKey = function(repId, repKey)
	{
	    return browserSrv.decryptRecipientKey(repId, repKey);
	}
	
    //this works for plain richeditor
    this.encryptString = function(readers, data)
    {
        if(!new FnFileBrowserSrv.Message().isArray(readers)) {
            readers = [readers];
        }
        return browserSrv.encryptStringEx(readers.length, readers, data);
    }

   //this works for plain richeditor
	this.decryptString = function(data)
	{
	    return browserSrv.decryptStringEx(data);
	}
	
	this.encryptCiper = function()
	{
	}

	this.decryptCipher = function()
	{
	}

	this.generateSDF = function(repKey, repId)
	{
	    return browserSrv.generateDocSDF(repKey, repId);
	}

    /**
	 * encryptPlainTextAsFakeRTE
     * to create a fake RTE to encrypt a plain message, return by fndocid and key
	 * @param data: the message content need to be encrypted
	 * @return docid and keys
	 * @author Raymond FuXing
     * @date 2014-09-16
	 */
	this.encryptPlainTextAsFakeRTE = function (data)
	{
	    var ret = {};
	    var combiner = Cc["@fntechnologies.com/firefoxhelper/plaintextfnciphercombiner;1"].
                createInstance(Ci.IPlainTextFNCipherCombiner);

	    if (!combiner) {
	        return null;
	    }

	    var aJsonFormatReaders = new Object();
	    var aFneBinaryDataBase64 = new Object();
	    var afndocid = null;
	    try {
	        afndocid = combiner.fneEncodeTextWithMe(data, aJsonFormatReaders, aFneBinaryDataBase64);
	    }
	    catch (err) {
	        return null;
	    }

	    afndocid = atob(afndocid);

	    try {
	        var sentdataObj = JSON.parse(aJsonFormatReaders.value);
	    }
	    catch (err) {
	        return null;
	    }

	    var dataArray = [];
	    for (var counter = 0; counter < sentdataObj.length; ++counter) {
	        var areader = sentdataObj[counter];
	        if (areader.ownerid == "fnDocId") {
	            fndocid = atob(areader.pkey);
	        }
	        else {
	            dataArray.push(areader);
	        }
	    }
	    var msgData = aFneBinaryDataBase64.value;

	    if (fndocid == "") {
	        return null;
	    }

	    var uploadTextType = "text_plain";

	    return { fndocid: fndocid, reader: dataArray, dataType: "text_plain", data: msgData };

	    //aBrowserXULDOMWindow.sendOneDoc(dataArray, fndocid, fndocid, "3423423ssadsad_anystring_reserved", msgData, uploadTextType, sentcallback);


	}

    /**
	 * encryptPlainText
     * to encrypt a plain message, send fndocid and key to docserver
	 * @param data: the message content need to be encrypted {content:"content to be encrypted", invitationId:"invitation guid", ownerIds:[]}
     * @param returnJson: return data as JSON format
	 * @return HJ Message
	 * @author Raymond FuXing
     * @date 2014-10-03
	 */
	this.encryptPlainText = function (data, returnJson) {
	    try {
	        var receiverData = JSON.parse(data);
	        if (!receiverData || !receiverData.content) {
	            return "";
	        }

			var ownerMe = new FnFileBrowserSrv.DbServer().getMe();
	        var newObj = new FnFileBrowserSrv.DocEncryptor().encryptPlainTextAsFakeRTE(receiverData.content);
	        if (!newObj) {
	            return;
	        }
			var randKey = null;
			var key = newObj.reader[0].pkey;
			randKey = ECHelperNS.decryptPublicEncKey(key, ownerMe.ownerid);

	        if (receiverData.ownerIds) {
	            for (var i = 0; i < receiverData.ownerIds.length; ++i) {
					
					if (receiverData.ownerIds[i].isme == true) continue;
					//console.log(randKey + "\n" + recipients[j].publickey);
					if (receiverData.ownerIds[i].pkey) {
						receiverData.ownerIds[i].pkey = ECHelperNS.encryptRealKey(randKey, receiverData.ownerIds[i].pkey);
					}
	                newObj = new FnIm.Common().addOwnerIdToRTE(newObj, receiverData.ownerIds[i]);
	            }
	        }

	        var fndocid = newObj.fndocid;
	        var readers = newObj.reader;
	        var type = newObj.dataType;
	        var uploadData = newObj.data;
	        var outstr = "View HJ Message\nFree: http://dwn.hackjacket.com \n";
	        outstr += "HJC:" + fndocid;
	        if (receiverData.invitationId) {
	            outstr += " " + receiverData.invitationId;
	        }
	        if (returnJson) {
	            outstr = {"HJC": fndocid};
	            if (receiverData.invitationId) {
	                var hji = receiverData.invitationId.split(":")[1];
	                outstr.HJI = hji;
	            }
	            outstr = JSON.stringify(outstr);
	        }

	        var keyObjs = [];
	        for (var i = 0; i < readers.length; ++i) {
	            var readerInfo = readers[i];
	            var keyObj = {};
	            keyObj.docId = fndocid;
	            keyObj.repId = readerInfo.ownerid.split('@')[0];
	            keyObj.key = readerInfo.pkey;
	            keyObj.hash = "3423423ssadsad_wwwanystring_reserved";
	            keyObj.docKey = "";

	            keyObjs.push(keyObj);
	        }

	        var docObj = {};
	        docObj.docId = fndocid;
	        docObj.docName = fndocid + ".hja";
	        docObj.docHash = "";
	        docObj.docType = type;

	        new FnFileBrowserSrv.DocServer().createDoc(docObj);
	        new FnFileBrowserSrv.DocServer().createKey(keyObjs);
	        new FnFileBrowserSrv.DocServer().uploadBinary(fndocid + ".hja", atob(uploadData));
			if(receiverData.invitationId) {
				addInvitationFndoc(fndocid, readers[0].pkey);
			}

	        return outstr;

	    } catch (err) {
	        return "";
	    }
	}

    /**
     * sendAttachmentKeysToDocServer
     * to set keys and docids to key server
     *
     * @param   keysObj [{docid:abc, key:123}]
     * @param   needInv has HJI or not
     * @return	none
     * @access	none-static
     * @author  Raymond FuXing
     * @date    2015-01-26
     */
	//business logic, added on Jan 26,2015 by Raymond Fu
	//-----------------------------------------------------------------------------------------
	// add invitation table |	add key table	|	all owner have keys	|	need invitation
	// ----------------------------------------------------------------------------------------
	//	No					| add multiple keys	|	Yes					|	Yes 
	// ----------------------------------------------------------------------------------------
	//	No					| add multiple keys	|	Yes					|	No
	// ----------------------------------------------------------------------------------------
	//	Yes					| No				|	at least one no key	|	Yes
	// ----------------------------------------------------------------------------------------
	//	No					| add multiple keys	| 	at lease one no key	|	No
	// ----------------------------------------------------------------------------------------
	this.sendAttachmentKeysToDocServer = function(keysObj, recipients, needInv)
	{
		if(needInv) {
			//send to invitation table
			for(var i=0;i<keysObj.length;++i) {
				addInvitationFndoc(keysObj[i].docId, keysObj[i].key);
			}
		} else {
			//add keys to key server
			//decrypt attachments' public key using me, then encrypt using recipient's public key
			var ownerMe = new FnFileBrowserSrv.DbServer().getMe();
			var keyObjs = [];
			for(var i=0;i<keysObj.length;++i) {
			
				var randKey = null;
				var key = keysObj[i].key;
				randKey = ECHelperNS.decryptPublicEncKey(key, ownerMe.ownerid);
				
				if(randKey) {
				
					for (var j = 0; j < recipients.length; ++j) {
						var keyAttachment = null;
						if (recipients[j].isme == true) continue;
						//console.log(randKey + "\n" + recipients[j].publickey);
						if (recipients[j].publickey) {
							keyAttachment = ECHelperNS.encryptRealKey(randKey, recipients[j].publickey);
						}
						var keyObj = {};
						keyObj.docId = keysObj[i].docId;
						keyObj.repId = recipients[j].ownerid.match(/\d{5}/g);
						if(!keyObj.repId || !keyAttachment) {
							continue;
						}
						keyObj.key = keyAttachment;
						keyObj.hash = "";
						keyObj.docKey = "";
						keyObjs.push(keyObj);
					}
				}
			}

			new FnFileBrowserSrv.DocServer().createKey(keyObjs);

		}
	}

    /**
     * createInvitation
     * to get an invitation id from server
     *
     * @param   params={emails:"a@a.com,b@b.com",finish:callback}
     * @param   
     * @return	invitation id
     * @access	none-static
     * @author  Raymond FuXing
     * @date    2014-09-16
     */
	this.createInvitation = function (params)
	{
	    if (!params.emails) {
	        return;
	    }
	    var emails = params.emails;
	    var self = params;
	    var FNJSAPICaller = Components.classes["@FNTechnologies.com/Mozilla/FNWebSvrJSHelper;1"].
                        createInstance(Components.interfaces.IFNWebSvrJSHelper);
	    FNJSAPICaller.sendInvitation(emails,
            //this is a async function
            {
                call_withString: function (idInvitation) {
                    var id = "HJI:" + idInvitation.split(":")[1];
                    console.log("got invitation id:" + id);
                    if (self.finish) {
                        console.log("backing......." + id);
                        self.finish(id, self.args);
                    }
                }.bind({ params: this.params })
            });

	}

    /**
     * getRteContent
     * to get data from rte
     *
     * @param   doc
     * @param   
     * @return	base64 content data
     * @access	none-static
     * @author  Raymond FuXing
     * @date    2014-10-16
     */
	this.getRteContent = function (doc, selector)
	{
	    var ele;
	    if (selector) {
	        ele = doc.querySelector(selector);
	    } else {
	        ele = doc.querySelector("object[type ='application/fn-richeditor-proxy']");
	    }
	    return ele.GetFNRTEContent();
	}

    /**
     * setRteContent
     * to get data from rte
     *
     * @param   doc
     * @param   
     * @return	base64 content data
     * @access	none-static
     * @author  Raymond FuXing
     * @date    2014-10-16
     */
	this.setRteContent = function (doc, ele, content)
	{
	    try {
	    
	        for (var p in ele) {
	            if (typeof p === "function") {
	                console.log(p);
	            }
	        }
	        var orgContent = content;//this.decryptString(content);
	        ele.ShowPlainTextMsg("", "", orgContent);

	        return orgContent;

	    } catch (err) {
	        console.log("setRteContent error:"+err);
	    }
	}

    /**
     * setRteContent
     * to get data from rte
     *
     * @param   param: {docid:doc id that contains encrypted data}
     * @param   func: callback function to get returned data
     * @return	base64 content data
     * @access	none-static
     * @author  Raymond FuXing
     * @date    2014-10-21
     */
	this.getDocIdContent = function(param, func)
	{
	    try {
	        var self = this;
	        if (!param && !param.docid) {
	            return;
	        }
	        var ownerId = new FnFileBrowserSrv.UserInfo().ownerId();
	        var docid = param.docid;
	        var paramData = [{ "docGuid": docid, "repId": ownerId }];
	        new FnFileBrowserSrv.DocServer().getKeysByDocId(paramData, function (dataResp) {

	            if (!dataResp) {
	                return;
	            }

	            var rte = new FnFileBrowserSrv.RTEServer();
	            var keyRTE = rte.parseKey(dataResp);

	            new FnFileBrowserSrv.DocServer().getDocsById(this.data, function (docResp) {

	                if (!docResp) {
	                    return;
	                }

	                var docUri = rte.parseDocUri(docResp);

	                for (var id in docUri) {
	                    console.log("uriId:" + id + "=====" + docUri[id].docurl + "    type:" + docUri[id].doctype);
	                    if (docUri[id].docurl == null || docUri[id].docurl == undefined) {
	                        continue;
	                    }

	                    rte.download(docUri[id].docurl, function (dataRTE) {

	                        oFReaader = new FileReader();
	                        oFReaader.id = this.id;
	                        oFReaader.onload = function (oFRevent) {

	                            var msgEncodedTxt = oFRevent.target.result;
	                            console.log("length=====" + msgEncodedTxt.length);
	                            msgEncodedTxt = btoa(msgEncodedTxt);
	                            msgEncodedTxt = "BEGIN_FN_SECURE_MESSAGE_" + msgEncodedTxt + "_END_FN_SECURE_MESSAGE";
	                            console.log("downloaded file: " + msgEncodedTxt);

	                            var orgMsgTxt = self.decryptString(msgEncodedTxt);
	                            if (this.func) {
	                                this.func(orgMsgTxt);
	                            }

	                        }.bind({ func: this.func })

	                        oFReaader.readAsBinaryString(dataRTE);

	                    }.bind({func: this.func, id: id}));
	                }

	            }.bind({func: this.func}));

	        }.bind({data: paramData, func: func}));

	    } catch (err) {
	        console.log("getDocIdContent error:"+err);
	    }

	}

    /**
     * getRteDocId
     * to get doc id and invitation id from rte
     *
     * @param   doc
     * @param   eleRte  rte element
     * @param   needInv need to return invitation id or not
     * @param   func    callback function
     * @return	doc id and invitation id
     * @access	none-static
     * @author  Raymond FuXing
     * @date    2014-10-17
     */
	this.getRteDocId = function (doc, eleRte, needInv, ownerIds, func)
	{

	    try {
	        var objRTE = eleRte;
	        var rteContent = objRTE.GetFNRTEContent();

	        var reader = JSON.parse(objRTE.GetSendData(new FnIm.Common().getMsgDataContent(rteContent)));

	        var data = new FnIm.Common().parseRTE(reader, objRTE.GetFneBinaryData());

	        if (ownerIds) {
	            for(var i=0;i<ownerIds.length;++i) {
	                data = new FnIm.Common().addOwnerIdToRTE(data, ownerIds[i]);
	            }
	        }

	        this.processRteMsg(doc, data, needInv, function (ret, keyObjs) {
	            console.log("upload RTE done.");

	            if (this.needInv) {
	                //need to add invitation
	                var emails = "noemails@fn.com";
	                var FNJSAPICaller = Components.classes["@FNTechnologies.com/Mozilla/FNWebSvrJSHelper;1"].
                                    createInstance(Components.interfaces.IFNWebSvrJSHelper);
	                FNJSAPICaller.sendInvitation(emails,
                        //this is a async function
                        {
                            call_withString: function (idInvitation) {
                                var id = idInvitation.split(":")[1];
                                console.log("got invitation id:" + id);
                                this.docid.HJI = id;
	                            if (this.finish) {
	                                this.finish(JSON.stringify(this.docid));
	                            }
                                
                            }.bind({docid: this.docid, finish: this.finish })
                        });

	            } else {
	                if (this.finish) {
	                    this.finish(JSON.stringify(this.docid));
	                }
	            }

	        }.bind({ finish: func, docid: {HJC:data.docid}, needInv: needInv }));
	    } catch (err) {
	        console.log("preprocessMsg error:" + err);
	    }
	}

	this.processRteMsg = function (doc, msg, needInv, func) {
	    //1, use key that get from RTE, (encrypted key using me public key)
	    //2, decrypt key using me ownerid, decryptPublicEncKey = function(publickey, ownerid)
	    //3, encrypt new owner key using decrypted key
	    try {
	        var params = msg;
	        var keyObjs = [];
	        var randKey = "";
	        var mePkey = "";

	        for (var i = 0; i < params.reader.length; ++i) {
	            if (params.reader[i].isme == true) {
	                var repId = params.reader[i].ownerid.match(/\d{5}/g);
	                var key = params.reader[i].pkey;
	                mePkey = key;
	                randKey = ECHelperNS.decryptPublicEncKey(key, repId);

	            }

	        }

	        for (var i = 0; i < params.reader.length; ++i) {
	            if (params.reader[i].isme == true) {
	                continue;
	            } else {
					if(needInv) {
						addInvitationFndoc(params.docid, mePkey);
					}
	            }

	        }

	        for (var j = 0; j < params.reader.length; ++j) {
	            if (params.reader[j].isme == true) continue;
	            console.log(randKey + "\n" + params.reader[j].pkey);
	            if (randKey && params.reader[j].pkey) {
	                params.reader[j].pkey = ECHelperNS.encryptRealKey(randKey, params.reader[j].pkey);
	            }
	        }

	        new MsgService.MsgProcesser().sendDataToServer(doc, params, function (ret, keyObjs) {
	            if (func) {
	                func(ret, keyObjs);
	            }
	        });

	    } catch (err) {
	        console.error("processMsg:" + err);
	    }

	}
}

/**
 * FnFileBrowserSrv.Reader
 * interface of processing RTE reader ifomation
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.Reader = function (data)
{
    this.data = data;
    this.readerData = {readerInfo:{}, docGuid:""};
    this.parse();
}

FnFileBrowserSrv.Reader.prototype = {
    /************************************************************************/
    /* parse
    /* parse readers' key information
    /* @param data: all readers info with json format
    /* @return: all readers' recipient id and key
    /* if recipient id is 'fnDocId', it returns doc guid
    /************************************************************************/
    parse : function()
    {
        try {
            var data = this.data;
            var ret = {readerInfo:{}, docGuid:""};
            if(!(data instanceof Array)) {
                return ret;
            }
            for(var i=0;i<data.length;++i) {
                if(data[i]["recipientId"] == "fnDocId") {
                    ret.docGuid = atob(data[i]["docKey"]);
                } else {
                    ret.readerInfo[data[i]["recipientId"]] = data[i]["docKey"];
                }
            }
            
            this.readerData = ret;
            return ret;
        } catch(err) {
            alert(err);
        }
    },
    
    getDocGuid : function()
    {
        return this.readerData.docGuid;
    },
    
    getDocGuidJson : function()
    {
        return '[{"docGuid":"'+this.readerData.docGuid+'"}]';
    },
    
    getReaderInfo : function()
    {
        return this.readerData.readerInfo;
    },
}

/**
 * FnFileBrowserSrv.FilePro
 * interface of file processing
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.FilePro = function ()
{

}

FnFileBrowserSrv.FilePro.prototype.getBinary = function(file)
{
    try {
        return browserSrv.getBinary(file);
    } catch(err) {
        alert(err);
    }
}

FnFileBrowserSrv.FilePro.prototype.readBinary = function(file, func)
{
    try {
        var oFReaader = new FileReader();
        oFReaader.onload = function(evt) {
        
            if(func) {
                func(evt.target.result);	
            } else {
                console.log("readBinary data: "+evt.target.result);
            }

        }
        oFReaader.readAsBinaryString(file);	 
    
    } catch(err) {
        console.error("FnFileBrowserSrv.FilePro.prototype.readBinary::error:"+err);
    }
}

FnFileBrowserSrv.FilePro.prototype.readBinaryFromFile = function(file, func)
{
    try {
        var xhr = new XMLHttpRequest;
        var docUrl = "file://"+file;
        xhr.open('GET', docUrl, true);
        xhr.responseType = "moz-blob";
        xhr.onload = function(evt)
        {
          
            var reader = new FileReader();
            reader.onload = function(evt) {
            
                if(func) {
                    func(evt.target.result);	
                } else {
                    console.log("readBinary data: "+evt.target.result);
                }

            }
            reader.readAsBinaryString(xhr.response);	
              
        };
        
        xhr.onerror = function(event)
        {
            alert("download error:")
        };

        xhr.send();

    
    } catch(err) {
        console.error("FnFileBrowserSrv.FilePro.prototype.readBinary::error:"+err);
    }
}

FnFileBrowserSrv.FilePro.prototype.readBinaryFromFileSync = function(file, func)
{
    try {

        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        var fileInChannel = ios.newChannel("file://"+file, "", null);
        var binaryIS = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
        binaryIS.setInputStream(fileInChannel.open());
            
        var ret = binaryIS.readBytes(binaryIS.available());
        
        if(func) {
            func(ret);	
        } else {
            console.log("readBinary data: "+ret);
        }
        
        return ret;
        
    
    } catch(err) {
        console.error("FnFileBrowserSrv.FilePro.prototype.readBinary::error:"+err);
    }
}

/************************************************************************/
/* uploadDropboxFile
/* provides function and interface for uploading files to dropbox
/* @Author: Raymond FuXing
/************************************************************************/
FnFileBrowserSrv.FilePro.prototype.uploadDropboxFile = function(url, fileName, fileContent, func)
{
    try {
        var boundary = fbone.utils.generateBoundary();
        contentType = "multipart/form-data;boundary=" + boundary;          

        var post = (function(boundary, fileName, fileContent) {
                var CRLF = "\r\n";
                var parts = [];
                var part ="";

                part += 'Content-Disposition: form-data;';
                part += 'name="file";';
                part += 'filename="'+ fileName + '"'+CRLF;
                part += 'Content-Type: multipart/form-data';
                part += CRLF + CRLF;          
                part += fileContent + CRLF;
                parts.push(part);

                var request = "--" + boundary + CRLF;
                request += parts.join("--" +  boundary + CRLF);
                request += "--" + boundary + "--" + CRLF;
                return fileContent;
                
            })(boundary, fileName, fileContent);


        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        
        xhr.sendAsBinary(post);
        xhr.onload = function() {
            var retMsg = {"response:":xhr.responseText, "status":xhr.status};
            console.log("url:"+url+"\nresponse:"+JSON.stringify(retMsg));
            if(func) {
                func(retMsg);
            }
        }
    } catch(err) {
        console.error("error on uploadDropboxFile:"+err);
    }

}

FnFileBrowserSrv.FilePro.prototype.writeBinaryToLocalFile = function(data, destFile)
{
    try {
        var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        targetFile.initWithPath(destFile);
        targetFile.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0600);

        var stream = FileUtils.openSafeFileOutputStream(targetFile, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE);

        var binaryStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
        binaryStream.setOutputStream(stream);
        binaryStream.writeByteArray(data, data.length);

        FileUtils.closeSafeFileOutputStream(stream);
        console.log("wrote "+data.length+" bytes to "+destFile);

    } catch (err) {
        console.error("writeBinaryToLocalFile:"+err);
    }
}

FnFileBrowserSrv.FilePro.prototype.writeToLocalFile = function(data, destFile)
{
    try {
        var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        targetFile.initWithPath1(destFile);
        targetFile.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0600);

        if (new FnFileBrowserSrv.Message().isArray(data)) {
            data = String.fromCharCode.apply(String, data);
        }
        //console.log("want to write "+data);
        var stream = FileUtils.openSafeFileOutputStream(targetFile, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE);

        var binaryStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
        binaryStream.setOutputStream(stream);
        binaryStream.writeBytes(data, data.length);

        FileUtils.closeSafeFileOutputStream(stream);
        console.log("wrote "+data.length+" bytes to "+destFile);

    } catch (err) {
        console.error("writeToLocalFile:"+err);
    }
}

/**
 * FnFileBrowserSrv.DocServer
 * interface of processign document information from doc server
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.DocServer = function ()
{

}

FnFileBrowserSrv.DocServer.prototype.sendEmail = function(data)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "sendEmailFu",
                        data
                    ),
                    function (ret) {
                        alert(ret.response);
                    }
                );

}


FnFileBrowserSrv.DocServer.prototype.createDoc = function(val)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "createDoc",
                        new fbone.FnCollection(val)
                    ),
                    ""
                );

}

FnFileBrowserSrv.DocServer.prototype.createKey = function(val)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "createDocKey",
                        new fbone.FnCollection(val)
                    ),
                    ""
                );

}

FnFileBrowserSrv.DocServer.prototype.getKeyByDocId = function(docGuid, repId, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "getKeyByDocId",
                        new fbone.FnCollection({"docGuid":docGuid, "repId":repId})
                    ),
                    func
                );

}

FnFileBrowserSrv.DocServer.prototype.getKeysAndRepsByOnlyDocId = function(docGuid, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "getKeysAndRepsByOnlyDocId",
                        new fbone.FnCollection({"docGuid":docGuid, "repId":repId})
                    ),
                    func
                );

}

FnFileBrowserSrv.DocServer.prototype.getKeysByDocId = function(data, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "getKeyByDocId",
                        new fbone.FnCollection(data)
                    ),
                    func
                );

}

FnFileBrowserSrv.DocServer.prototype.getKeysByDocIdInv = function(data, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "getEncKeyFromIvtByDocId",
                        new fbone.FnCollection(data)
                    ),
                    func
                );

}

FnFileBrowserSrv.DocServer.prototype.setKey = function(data)
{
}

FnFileBrowserSrv.DocServer.prototype.getDocUri = function(docGuid, key, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "displayDocByKey",
                        new fbone.FnCollection({"docGuid":docGuid, "dockey":key})
                    ),
                    func
                );

}

FnFileBrowserSrv.DocServer.prototype.getDocById = function(docGuid, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "getDocById",
                new fbone.FnCollection({"docGuid":docGuid})
                ),
                func
           );

}

FnFileBrowserSrv.DocServer.prototype.getDocsById = function(data, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "getDocById",
                new fbone.FnCollection(data)
                ),
                func
           );

}

FnFileBrowserSrv.DocServer.prototype.getDocsByIdInv = function(data, func)
{
    
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "get",
                "getDocByIdInv",
                new fbone.FnCollection(data)
                ),
                func
           );

}

FnFileBrowserSrv.DocServer.prototype.downloadDocById = function(docGuid, func)
{
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "downloadDocById",
                new fbone.FnCollection({"docGuid":docGuid})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getDocIRM
 * return file's or message's priviledge using doc id
 * @param docGuids: doc ids
 * @param func: callback function
 * @return priviledges of docids
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getDocIRM = function(docGuids, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docGuids)) {
        docGuids = [docGuids];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({"type": "getDocRightsByDocIds", "data": docGuids})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.setDocIRM
 * return file's or message's priviledge using doc id
 * @param docObjs: array of {docGuid:id, ownerId:id1, priviledge:{erasable:1, limitTime:0, limitView:0, limitViewDuration:0, accessPriviledge: 1}}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.setDocIRM = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({type: "setDocRightsByDocIds", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.delDocIRM
 * remove documents' priviledge
 * @param docObjs: array of {docGuid:id, ownerId:id1, priviledge:{erasable:1, limitTime:0, limitView:0, limitViewDuration:0, accessPriviledge: 1}}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.delDocIRM = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({type: "delDocRightsByDocIds", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getRepIRM
 * return recipient's priviledge using doc id
 * @param docGuids: doc ids
 * @param func: callback function
 * @return priviledges of docids
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getRepIRM = function(docGuids, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docGuids)) {
        docGuids = [docGuids];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({type: "getRepRightsByDocIds", data: docGuids})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.setRepIRM
 * modify recipient's priviledge using doc id
 * @param docObjs: array of {docGuid:id, ownerId:id1, priviledge:{erasable:1, limitTime:0, limitView:0, limitViewDuration:0, accessPriviledge: 1}}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.setRepIRM = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({type: "setRepRightsByDocIds", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.delRepIRM
 * remove recipients' priviledge
 * @param docObjs: array of {docGuid:id, ownerId:id1, priviledge:{erasable:1, limitTime:0, limitView:0, limitViewDuration:0, accessPriviledge: 1}}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.delRepIRM = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({type: "delRepRightsByDocIds", data: docObjs})
                ),
                func
           );

}

FnFileBrowserSrv.DocServer.prototype.setDocSDF = function(versionMinor, versionMajor, docid, data, func)
{
    var docObjs = [{minor:versionMinor, major: versionMajor, docid: docid, data: data}];

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "setSecurityDefineFile",
                new fbone.FnCollection(docObjs)
                ),
                func
           );

}

FnFileBrowserSrv.DocServer.prototype.getDocSDF = function(versionMinor, versionMajor, docid, data, func)
{
    var docObjs = [{minor:versionMinor, major: versionMajor, docid: docid, data: data}];

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "get",
                "getSecurityDefineFile",
                new fbone.FnCollection(docObjs)
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.delRepIRM
 * remove recipients' priviledge
 * @param docObjs: array of {docGuid:id, ownerId:id1, priviledge:{erasable:1, limitTime:0, limitView:0, limitViewDuration:0, accessPriviledge: 1}}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date May 29, 2013
*/
FnFileBrowserSrv.DocServer.prototype.delRepIRM = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docRightsByDocIds",
                new fbone.FnCollection({type: "delRepRightsByDocIds", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.sendInvitation
 * send invitation id to nodes server, and put back to web page
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Sep 11, 2013
 */
FnFileBrowserSrv.DocServer.prototype.sendInvitation = function(idInvitation)
{
	var domainInv = FnDomains.getDomain("invitation");
	var invUrl = "http://"+domainInv + ":80";
    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "get",
                "sendInvitationData",
                new fbone.FnCollection(idInvitation)
                ),
                null,
				invUrl
           );

}

/**
 * FnFileBrowserSrv.DocServer.appendParentDocId
 * remove recipients' priviledge
 * @param docObjs: array of {docGuid:id}}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Sept 26, 2013
*/
FnFileBrowserSrv.DocServer.prototype.appendParentDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "appendParentDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getParentDocId
 * remove recipients' priviledge
 * @param docObjs: array of {docGuid:id}}
 * @param func: callback function
 * @return array of docGuidParent
 * @author: Raymond FuXing
 * @date Sept 26, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getParentDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "getParentDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getAllTopics
 * to get all subjects from doc server
 * @param none
 * @param func: callback function
 * @return array of subjects
 * @author: Raymond FuXing
 * @date Oct 18, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getAllTopics = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "getAllTopics", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getAssociationDocsByTopic
 * to get all docs from doc server using topic
 * @param none
 * @param func: callback function
 * @return array of subjects
 * @author: Raymond FuXing
 * @date Oct 18, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getAssociationDocsByTopic = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "getAssociationDocsByTopic", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getAssociationDocsByTopic
 * to get all docs from doc server using topic
 * @param none
 * @param func: callback function
 * @return array of subjects
 * @author: Raymond FuXing
 * @date Oct 18, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getAssociationDocsByTopicSimilar = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "getAssociationDocsByTopicSimilar", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.getAssociationDocsByParentDocId
 * to get all docs from doc server using parent docid
 * @param none
 * @param func: callback function
 * @return array of subjects
 * @author: Raymond FuXing
 * @date Oct 21, 2013
*/
FnFileBrowserSrv.DocServer.prototype.getAssociationDocsByParentDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "getAssociationDocsByParentDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteAllAssociationTopics
 * to delete all docs from doc server using owner id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteAllAssociationTopics = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "deleteAllAssociationTopics", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteAssociationTopic
 * to delete one or more docs from doc server by owner id and topic name
 * @param {topic:"abc",senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteAssociationTopic = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "deleteAssociationTopic", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteAssociationByParentDocId
 * to delete one or more docs from doc server by owner id and topic name
 * @param {docGuidParent:"abc",senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteAssociationByParentDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "deleteAssociationByParentDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteAssociationByDocId
 * to delete one or more docs from doc server by owner id and topic name
 * @param {docGuid:"abc",senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteAssociationByDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "deleteAssociationByDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteAssociationBySender
 * to delete all docs from doc server by owner id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteAssociationBySender = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "deleteAssociationBySender", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteAssociationByDomain
 * to delete all docs from doc server by owner id
 * @param {domainName:"www.google.com",senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteAssociationByDomain = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "parentDocId",
                new fbone.FnCollection({type: "deleteAssociationByDomain", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteDoc
 * to delete all docs from doc server by owner id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteDoc = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docInfoDelete",
                new fbone.FnCollection({type: "deleteDoc", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteRecipientsByDocId
 * to delete all docs from doc server by owner id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteRecipientsByDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docInfoDelete",
                new fbone.FnCollection({type: "deleteRecipientsByDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteKeysByDocId
 * to delete all docs from doc server by owner id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteKeysByDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docInfoDelete",
                new fbone.FnCollection({type: "deleteKeysByDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteDocAndKeyByDocId
 * to delete all docs from doc server by owner id and doc id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.deleteDocAndKeyByDocId = function(docObjs, func)
{
    if(!new FnFileBrowserSrv.Message().isArray(docObjs)) {
        docObjs = [docObjs];
    }

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                "post",
                "docInfoDelete",
                new fbone.FnCollection({type: "deleteDocAndKeyByDocId", data: docObjs})
                ),
                func
           );

}

/**
 * FnFileBrowserSrv.DocServer.deleteDocAndKeyByDocId
 * to delete all docs from doc server by owner id and doc id
 * @param {senderId:11122}
 * @param func: callback function
 * @return none
 * @author: Raymond FuXing
 * @date Oct 22, 2013
*/
FnFileBrowserSrv.DocServer.prototype.uploadBinary = function(fileName, dataBinary, func)
{
    try {

        fbone.request('getDataFromNode',
	    		   fbone.utils.getParams(false,
	    				   "postfile",
	    				   "setUploadFile",
	    				   { filePath: "", fileName: fileName, fileContent: dataBinary }
	    		   ),
	    		   function (ret) {
	    		       console.log(ret)
	    		       if (func) {
	    		           func(ret);
	    		       }
	    		   });

    } catch (err) {
        alert("upload:" + err);
    }

}

/**
 * FnFileBrowserSrv.MessageServer
 * interface of accessing data from doc server
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.MessageServer = function ()
{
}

FnFileBrowserSrv.MessageServer.prototype.getCloudWebName = function (webType, func) {

    fbone.request('getDataFromNode',
                fbone.utils.getParams(true,
                        "post",
                        "getCloudWebName",
                        new fbone.FnCollection({ "webType": webType })
                    ),
                    func
                );

}



/************************************************************************/
/* RTEServer
/* provides functions and interfaces for RichdEditor
/* @Author: Raymond FuXing
/************************************************************************/
FnFileBrowserSrv.RTEServer = function()
{
    this.recipients = {};
    this.docs = {};
    this.dataFromKeyServer = null;
    this.dataFromDocServer = null;
}

FnFileBrowserSrv.RTEServer.prototype.parseKey = function(keyData)
{
    this.dataFromKeyServer = keyData;
    var cols = new fbone.FnCollection(this.dataFromKeyServer);
    var recipient = new fbone.FnModel();
    var ret = {};
    cols.forEach(function(recipient) {
        var temp = {};
        temp.docid = recipient.get("docguid");
        temp.repid = recipient.get("recipientid");
        temp.repkey = recipient.get("recipientkey");

        ret[temp.docid+temp.repid] = temp.repkey;
        
    });
    
    this.recipients = ret;
    return ret;

}

FnFileBrowserSrv.RTEServer.prototype.download = function(docUrl, func)
{
    for(var id in this.recipients) {

        var xhr = new XMLHttpRequest;
        xhr.open('GET', docUrl, true);
        xhr.responseType = "moz-blob";
        xhr.onload = function(oEvent)
        {
          if(func !== undefined && func != null) {
          
            func(xhr.response);
              
          }
        };
        
        xhr.onerror = function(event)
        {
            alert("download error:")
        };

        xhr.send();
  }
}

FnFileBrowserSrv.RTEServer.prototype.downloadImp = function(docData)
{
    this.parseDocUri(docData);    
}

FnFileBrowserSrv.RTEServer.prototype.parseDocUri = function(docData)
{
    var ret = {};
    this.dataFromDocServer = docData;
    
    var cols = new fbone.FnCollection(this.dataFromDocServer);
    var doc = new fbone.FnModel();
    cols.forEach(function(doc) {
        var temp = {};
        temp.docid = doc.get("docguid");
        temp.docname = doc.get("docname");
        temp.docurl = doc.get("docurl");
        temp.doctype = doc.get("doctype");
        console.log("=======>docid:"+temp.docid+"\ndocname:"+temp.docname+"\ndocurl:"+temp.docurl+"\ndoctype:"+temp.doctype);
        ret[temp.docid] = {docurl:"http://" + temp.docurl + "/" + temp.docname, doctype:temp.doctype}; 
             
    });
    
    this.docs = ret;
    
    return ret;

}

FnFileBrowserSrv.RTEServer.prototype.resetFnImData = function(imtype, sender, receiver)
{
    imtype = imtype || "notsupported";
    sender = sender || ["sender"];
    receiver = receiver || "receiver";
    
	if(!(new FnFileBrowserSrv.Message().isArray(sender))) {
		sender = [sender];
	}
    for(var i=0;i<sender.length;++i) {
        if(sender[i] === receiver) {
            continue;
        }
		var bufName = sender[i] + receiver;
		if(sender[i] == Senderme) {
			bufName = sender[i] + receiver;
		} else {
			bufName = receiver + sender[i];
		}
		console.log("reseting data:" +(bufName)+"\n");
        browserSrv.resetFnImData(imtype, bufName);
    }
}

FnFileBrowserSrv.RTEServer.prototype.setFnImData = function(doc, id, imtype, sender, receiver, data)
{
    imtype = imtype || "notsupported";
    sender = sender || ["sender"];
    receiver = receiver || "receiver";
    
	if(!(new FnFileBrowserSrv.Message().isArray(sender))) {
		sender = [sender];
	}
    for(var i=0;i<sender.length;++i) {
        if(sender[i] === receiver) {
            continue;
        }
		var bufName = sender[i] + receiver;
		if(sender[i] == Senderme) {
			bufName = sender[i] + receiver;
		} else {
			bufName = receiver + sender[i];
		}
		console.log("sending data:" +(bufName)+"\n"+ data);
        browserSrv.setFnImData(doc, imtype, bufName, id, data);
    }
}

/************************************************************************/
/* setFnImDataAll
/* send message to RTE receiver
/* @param ownerid: owner id
/* @param key: key
/* @param doc: HTML document
/* @param id: element id of RTE plugin in HTML
/* @param data: data contains sender and message
/* @author: Raymond FuXing
/************************************************************************/
FnFileBrowserSrv.RTEServer.prototype.setFnImDataAll = function(imtype, sender, receiver, ownerid, key, doc, id, data)
{
	console.log("sender:"+sender+"------------is array:"+new FnFileBrowserSrv.Message().isArray(sender));
	console.log("receiver:"+receiver+"------------is array:"+new FnFileBrowserSrv.Message().isArray(receiver));

	if(!new FnFileBrowserSrv.Message().isArray(receiver)) {
		receiver = [receiver];
	}

	console.log("**********adding sender and receiver**************");
	for(var i=0;i<receiver.length;++i) {
		var bufName = sender + receiver[i];
		if(sender == Senderme) {
			bufName = sender + receiver[i];
		} else {
			bufName = receiver[i] + sender;
		}

		console.log("====***====="+bufName+"\nsender:"+sender+"\n====="+ownerid+"\nsenderme:"+Senderme);
		console.log("ownerid:"+ownerid+"\nkey:"+key+"\nid:"+id+"\ndata:"+data);
		browserSrv.setFnImDataAll(imtype, bufName, ownerid, key, doc, id, data);

	}
	console.log("*********************************************");
	
}

FnFileBrowserSrv.RTEServer.prototype.setFnImDataAllInv = function(imtype, sender, receiver, ownerid, key, doc, id, data)
{
    console.log("sender:"+sender+"------------is array:"+new FnFileBrowserSrv.Message().isArray(sender));
    console.log("receiver:"+receiver+"------------is array:"+new FnFileBrowserSrv.Message().isArray(receiver));
    var Senderme = "me";

    if(!new FnFileBrowserSrv.Message().isArray(receiver)) {
        receiver = [receiver];
    }

    if(receiver==null || receiver.length==0) {
        receiver = ["me"];
    }
    console.log("**********adding sender and receiver**************");
    for(var i=0;i<receiver.length;++i) {
        var bufName = sender + receiver[i];
        if(sender == Senderme) {
            bufName = sender + receiver[i];
        } else {
            bufName = receiver[i] + sender;
        }

        console.log("====***====="+bufName+"\nsender:"+sender+"\n====="+ownerid+"\nsenderme:"+Senderme);
        console.log("ownerid:"+ownerid+"\nkey:"+key+"\nid:"+id+"\ndata:"+data);
        browserSrv.setFnImDataAll(imtype, bufName, ownerid, key, doc, id, data);

    }
    console.log("*********************************************");
    
}

/**
 * FnFileBrowserSrv.Message
 * interface of accessing message
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.Message = function ()
{

}

FnFileBrowserSrv.Message.prototype.isDocIdOnly = function(msg)
{
//2ecd465d-b266-4308-a7bc-b403270b87a2

    var regex = /^([A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12})/g;
    
    return regex.test(msg);

}

FnFileBrowserSrv.Message.prototype.isArray = function(msg)
{
    return (Object.prototype.toString.call(msg) == "[object Array]");
}

FnFileBrowserSrv.Message.prototype.isHandShakeMessage = function(msg)
{
	var regex = /^([0-9]{9}$)/g;
	return regex.test(msg);
}

FnFileBrowserSrv.Message.prototype.generateRandomKey = function()
{
    return "";
}

FnFileBrowserSrv.Message.prototype.parseKey = function(keyData)
{
    var cols = new fbone.FnCollection(keyData);
    var recipient = new fbone.FnModel();
    var ret = {};
    cols.forEach(function(recipient) {
        var temp = {};
        temp.docid = recipient.get("docguid");
        temp.repid = recipient.get("recipientid");
        temp.repkey = recipient.get("recipientkey");

        ret[temp.docid+temp.repid] = temp;
        
    });
    
    return ret;

}


var FnIm = FnIm || {};


FnIm.Common = function()
{
    this.parseRTE = function(dataReader, dataBin)
    {
	    var fndocid = "";
	    var msgData = "";
        var reader = [];	  
	    
	    if(dataReader.length > 1) {	   	      
	    
	          for(var counter =0; counter <dataReader.length; ++counter) {
    	      
	              var areader = dataReader[counter];
	              if(areader.ownerid == "fnDocId") {
    	          
	                 fndocid = atob(areader.pkey);
    	             
	              } else {
					 areader.isme = true;
	                 reader.push(areader);
	              }    
	          } 
	          msgData = (dataBin);
        }    
        return {docid:fndocid, msg: msgData, reader: reader};
    }
    
    /************************************************************************/
    /* addOwnerIdToRTE: add extra ownerid and key to key server
    /* @param data: current data from RTE, including readers and key
    /* @param ownerIds: ownerids and keys need to add into key server
    /************************************************************************/
    this.addOwnerIdToRTE = function(data, ownerid)
    {
        if(data == null || ownerid == null) {
            return data;
        }

        data.reader.push({ownerid:ownerid.ownerid, pkey:ownerid.pkey, isme:ownerid.isme});
		
		return data;
    }
    
    this.getMsgDataContent = function(data)
    {
        
        return data.replace(/(BEGIN_FN_SECURE_MESSAGE_)|(_END_FN_SECURE_MESSAGE)/g, "");
    }
    
    this.setMsgDataContent = function(objRTE, ownerId, pkey, data)
    {
        try
        {
            var FNJSAPICaller = Components.classes["@FNTechnologies.com/Mozilla/FNWebSvrJSHelper;1"].
                            createInstance(Components.interfaces.IFNWebSvrJSHelper);
            FNJSAPICaller.setRTEContent(objRTE, ownerId, pkey, data);        
        } catch(err) {
           alert(err);
        }
    
    }
    
}

FnIm.Receiver = function()
{

}

FnIm.Sender = function()
{

}

/**
 * FnFileBrowserSrv.DbServer
 * interface of accessing database
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.DbServer = function ()
{
    this.queryGetOwnerIdByImHandle = "select distinct(b.ownerid),b.publickey from SecureKeyImHandleMap a, securekey b where a.contactId=b.id and a.contactId in (select contactId from SecureKeyImHandleMap where ";
    this.queryGetEmailByImHandle = "select [emailAddress] from Email where contactId in (select contactId from SecureKeyImHandleMap where ";
    this.queryMe = "select ownerid, publickey from securekey where isme=1;";
    this.queryGetOwnerIdByEmail = "select [ownerid], [publickey], [isme] from securekey where [id] in (select [contactId] from email where ";
    this.queryAllContactsBasicAndEmail = "select a.[firstName], a.[lastName], b.[emailAddress], c.[image] from BasicInfo a, Email b, securekey c where a.[basicInfoId]=c.[basicInfoId] and b.[contactId]=c.[id];";
    this.queryAllContactsBasicAndEmailXMe = "select a.[firstName], a.[lastName], b.[emailAddress], c.[image] from BasicInfo a, Email b, securekey c where a.[basicInfoId]=c.[basicInfoId] and b.[contactId]=c.[id] and c.[isme] is not 1;";
    this.queryGetCloudName = "select [cloudId],[cloudName] from cloudName;";
    this.queryGetCloudDisplayName = "select [displayName],[uid],[accessKey],[accessSecret] from cloudDisplayName a where (";
    this.queryGetUsersByGroup = "select a.[firstName] firstName, a.[lastName] lastName, b.[emailAddress] email, c.[image] image, 0 isGroup from BasicInfo a, Email b, securekey c, securekey_group_relation d where a.[basicInfoId]=c.[basicInfoId] and b.[contactId]=c.[id] and c.[isme] is not 1 and c.[id] in ( select securekeyid from securekey_group_relation where groupid=:groupid) group by b.[emailAddress];";
    this.queryGetEmailInfo = "select c.[firstName], c.[lastName], a.[emailAddress], b.[image]  from Email a, securekey b, BasicInfo c where a.[contactId]=b.[id] and b.[basicInfoId]=c.[basicInfoId] order by c.[firstName], c.[lastName];";
    this.queryGetCloudAccessKey = "select [accessKey] from cloudDisplayName where ";
	this.queryInsertCloudAccessKey = "insert into cloudDisplayName values(";
    this.queryLoadCloudAccessKey = "select [cloudId],[uid],[accessKey],[accessSecret] from cloudDisplayName where ";
}

FnFileBrowserSrv.DbServer.prototype.checkServiceDataFromDb = function(serviceName)
{
    try {
    
        var ret = {};
        var query = "select imName from SecureKeyImHandleMap where imName='" + (serviceName||"") + "'";
        DbService.getQueryData("fndbdata", query, [], ret, true);

        console.log(query);
        console.log(JSON.stringify(ret.data));

        return (ret==null || ret.data == null || ret.data.length == 0);

    } catch(err) {
        console.log("checkServiceDataFromDb error:" + err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getAutoInfoData = function()
{
    try {
        var ret = {};
        var query = 'select c.[cardName] as "T1", c.[cardNumber] as "T2",  \
                     b.[firstName] as "T5", b.[lastName] as "T6", b.[birthDay] as "T7", \
                     b.[birthMonth] as "T8", b.[birthYear] as "T9", c.[expirationMonth] as "T11", \
                     c.[expirationYear] as "T12", a.[street] as "T14", a.[city] as "T15", \
                     a.[province] as "T16", a.[country] as "T17", a.[postalCode] as "T18", \
                     e.[emailAddress] as "T33", c.[cardPin] as "T34", c.[cardHolder] as "T35", \
                     c.[iban] as "T36" from Address a left join BasicInfo b on a.[addressId]=1 \
                     and b.basicInfoId=1 left join Email e on a.[addressId]=1 and b.[basicInfoId]=1 \
                     left join CreditCardInfo c on c.[cardId]=1 limit 1;';
        DbService.getQueryData("fndbdata", query, [], ret, true);
        if(ret == null || ret.data == null || ret.data.length == 0) {
            return {};
        }
        return ret.data[0];

    } catch(err) {
        console.log("getAutoInfoData error:"+err);
    }
}

FnFileBrowserSrv.DbServer.prototype.setPreloadData = function(name, handle, extra)
{
    try {
    
        var ret = {};
        var query = "insert into preloadData(name, value, extra) values('"+name+"','"+handle+"','"+extra+"')";
        
        DbService.getQueryData("fnwebservice", query, [], ret, true);

        console.log(query);
        console.log(JSON.stringify(ret.data));

        return ret;

    } catch(err) {
        console.log("setPreloadData error:" + err);
    }

}

FnFileBrowserSrv.DbServer.prototype.getPreloadData = function(name)
{
    try {
    
        var ret = {};
        var query = "select value from preloadData where name='"+name+"';";
        DbService.getQueryData("fnwebservice", query, [], ret, true);

        console.log(query);
        console.log(JSON.stringify(ret.data));

        return ret;

    } catch(err) {
        console.log("getPreloadData error:" + err);
    }
}

FnFileBrowserSrv.DbServer.prototype.removePreloadData = function(name)
{
    try {
    
        var ret = {};
        var query = "delete from preloadData where name='"+name+"';";
        DbService.getQueryData("fnwebservice", query, [], ret, true);

        return ret;

    } catch(err) {
        console.log("getPreloadData error:" + err);
    }
}

FnFileBrowserSrv.DbServer.prototype.getOriginalFolder = function(driver)
{
    try {
    
        var ret = {};
        var query = "select originalFolder from fileSelectorFolder where driver='"+driver+"';";
        DbService.getQueryData("fndict", query, [], ret, true);


    } catch(err) {
        console.log("getOriginalFolder error:" + err);
    }
}

FnFileBrowserSrv.DbServer.prototype.setCloudNameTest = function ()
{
    try {
        var query = "insert into cloudName(cloudName) values('test001')";
        console.log(query);
        DbService.getQueryData("fndbdata", query, [], null, true);
    } catch (err) {
        console.log("error getEmailInfo:" + err);
    }
}

FnFileBrowserSrv.DbServer.prototype.getEmailInfo = function (func)
{
    try {
        DbService.getQueryData("fndbdata", this.queryGetEmailInfo, [], func);
    } catch (err) {
        console.log("error getEmailInfo:" + err);
    }
}

FnFileBrowserSrv.DbServer.prototype.getCloudName = function ()
{
    try {
        var ret = {};
        DbService.getQueryData("fndbdata", this.queryGetCloudName, [], ret, true);

        return ret;

    } catch (err) {
        console.log("error getCloudName:" + err);
    }
}

/* note: DbService.getQueryData will return an array of json format objects 
         you can access the result by retturn.data[i].[colName]  where i is index and
         colName must be exactly same as the one you use in DB 
*/
FnFileBrowserSrv.DbServer.prototype.getCloudDisplayName = function (params)
{
    try {
        /* get the cloudId from db */
        var getCloudIdQuery = "select [cloudId] from cloudName where [cloudName]='" + params[0] +"';";
        var cloudIdRet = {};
        DbService.getQueryData("fndbdata", getCloudIdQuery, [], cloudIdRet, true);      
        
        if(cloudIdRet.data.length == 1 ) {   //cloudIdRet must have only one 
            var query = this.queryGetCloudDisplayName;
            query += " [cloudId]=" + cloudIdRet.data[0].cloudId;
            query += ");";
            var ret = {};
            //DbService.getQueryData("fndbdata", query, [tempParams], ret, true);
            DbService.getQueryData("fndbdata", query, [], ret, true);        
            return ret;
        }
        return {};
    
        
//        var tempParams = {};
//        for (var i = 0; i < params.length; ++i) {
//            
//            //query += " [cloudId]=:cloudId" + (i + 1);
//query += " [cloudId]=1";
//            if (i < params.length - 1) {
//                query += " or ";
//            }

//            for(var prop in params[i]) {
//                var name = prop+(i+1);
//                tempParams[name] = params[i][prop];
//            }
//        }

//        query += ");";
//        console.log(query);
//        var ret = {};
//        //DbService.getQueryData("fndbdata", query, [tempParams], ret, true);
//DbService.getQueryData("fndbdata", query, [], ret, true);        
//console.log("ret=" + ret);
//        return ret;

    } catch (err) {
        console.log("error getCloudDisplayName:" + err);
    }
}

/*
@params: param[0] cloud type, 
         param[1] display name
         param[2] user name
         param[3] uid
         param[4] access key
         param[5] access secret
*/
FnFileBrowserSrv.DbServer.prototype.insertCloudAccessKey = function (params)
{
    try {
        var query = this.queryInsertCloudAccessKey;
        var tempParams = {};
        
        for(var name in params[0]) {
            //var name = prop;
            if(name === "cloudId"){
            	query += params[0][name] +",";
            }else if(name === "accessSecret") {
            	query += "'"+params[0][name] + "'";
            }else{
            	query += "'"+params[0][name] + "',";
            }
            
            tempParams[name] = params[0][name];
        }
        query+= ")";
        var ret = {};
        DbService.getQueryData("fndbdata", query, [tempParams], ret, true);
        return ret;

    } catch (err) {
        console.log("error insertCloudAccessKey:" + err.message);
    }
}
/*
@params: param["cloudType"] cloud type, 
         param["displayName"] display name
         param["uid"] uid
*/
FnFileBrowserSrv.DbServer.prototype.loadCloudAccessKey = function (params)
{
    try {
    		//get the cloudId
    		var query = "select [cloudId] from cloudName where [cloudName]=:cloudName";
    		var tempParams = {};
    		var ret = {};
    		tempParams["cloudName"] = params[0]["cloudName"];
        DbService.getQueryData("fndbdata", query, [tempParams], ret, true);
    		
    		var cloudId = ret.data[0].cloudId;

        query = this.queryLoadCloudAccessKey + "([cloudId]=:cloudId and [uid]=:uid)";
       	tempParams = {};
        ret= {};
        console.log("@loadCloudAccessKey\n"+query + "\n" + cloudId + "::" + params[0]["uid"]);
        tempParams["cloudId"] = cloudId;
        tempParams["uid"] = params[0]["uid"];

        ret = {};
        DbService.getQueryData("fndbdata", query, [tempParams], ret, true);

        
        return ret;
    } catch (err) {
        console.log("error loadCloudAccessKey:" + err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getOwnerIdByImHandle = function(params, func, args)
{
    try {
		args = args || null;
        var tempParams = {};
        for (var i = 0; i < params.length; ++i) {
            this.queryGetOwnerIdByImHandle += " imHandle=:imHandle" + (i+1);
            this.queryGetOwnerIdByImHandle += " and imName=:imName" + (i+1);

            if (i < params.length-1) {
                this.queryGetOwnerIdByImHandle += " or ";
            }

            for(var prop in params[i]) {
                var name = prop+(i+1);
                tempParams[name] = params[i][prop];
            }
        }
        this.queryGetOwnerIdByImHandle += ");";
        
		if(args) {
			DbService.getQueryData("fndbdata", this.queryGetOwnerIdByImHandle, [tempParams], func, false, args);
		} else {
			DbService.getQueryData("fndbdata", this.queryGetOwnerIdByImHandle, [tempParams], func);
		}

    } catch (err) {
        console.log("error getOwnerIdByImHandle"+err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getOwnerIdAndMeByImHandle = function(params, func, args)
{
    try {
		args = args || null;
		var query = "select distinct(b.ownerid),b.publickey, b.isme from SecureKeyImHandleMap a, securekey b where b.id=1 or a.contactId=b.id and a.contactId in (select contactId from SecureKeyImHandleMap where ";
        var tempParams = {};
        for (var i = 0; i < params.length; ++i) {
            query += " imHandle=:imHandle" + (i+1);
            query += " and imName=:imName" + (i+1);

            if (i < params.length-1) {
                query += " or ";
            }

            for(var prop in params[i]) {
                var name = prop+(i+1);
                tempParams[name] = params[i][prop];
            }
        }
        query += ");";
        
		if(args) {
			DbService.getQueryData("fndbdata", query, [tempParams], func, false, args);
		} else {
			DbService.getQueryData("fndbdata", query, [tempParams], func);
		}

    } catch (err) {
        console.log("error getOwnerIdAndMeByImHandle"+err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getEmailByImHandleAndName = function(params, func, args)
{
    try {
		var imName = params.imName || "facebookName";
		var imHandles = params.imHandle;
		var query = "select email as emailAddress from securekey where id in (select contactId from SecureKeyImHandleMap where (";
		
		imHandles.forEach(function(handle, index) {
			query += "imName='" + imName + "' and imHandle like '" + handle + "%'";
			if(index < imHandles.length-1) {
				query += " or ";
			}
		});
		query += "));";
		//console.log(query);
        DbService.getQueryData("fndbdata", query, [], func, false, args);

    } catch (err) {
        console.log("error getOwnerIdByImHandleAndName:"+err.message);
    }
}

//params={firstName:"",lastName:""}
FnFileBrowserSrv.DbServer.prototype.storeBasicInfo = function(params, func)
{
	try {
	
		var queryBasicInfo = "insert into basicInfo(firstName,lastName) values('%','%');";
		queryBasicInfo = queryBasicInfo.fmt([params.firstName, params.lastName]);
		//console.log(queryBasicInfo);
		if(func) {
			DbService.getQueryData("fndbdata", queryBasicInfo, [], func, false, "");
		} else {
			DbService.getQueryData("fndbdata", queryBasicInfo, [], null, true, "");
		}
		
	} catch(err) {
		console.log("storeBasicInfo error:" + err);
	}
}

//params={nickName:"",basicInfoId:0}
FnFileBrowserSrv.DbServer.prototype.storeSecureKey = function(params, func)
{
	try {
	
		var query = "insert into secureKey(nickName,basicInfoId) values('%',%);";
		query = query.fmt([params.nickName, params.basicInfoId]);
		//console.log(query);
		if(func) {
			DbService.getQueryData("fndbdata", query, [], func, false, "");
		} else {
			DbService.getQueryData("fndbdata", query, [], null, true, "");
		}
		
	} catch(err) {
		console.log("storeSecurekey error:" + err);
	}
}

//params={contactId:3,imHandle:"",imName}
FnFileBrowserSrv.DbServer.prototype.storeSecureKeyImHandle = function(params, func)
{
	try {
	
		var query = "insert into SecureKeyImHandleMap(contactId,imHandle, imName) values(%,'%','%');";
		query = query.fmt([params.contactId, params.imHandle, params.imName]);
		//console.log(query);
		if(func) {
			DbService.getQueryData("fndbdata", query, [], func, false, "");
		} else {
			DbService.getQueryData("fndbdata", query, [], null, true, "");
		}
		
	} catch(err) {
		console.log("storeSecureKeyImHandle error:" + err);
	}
}

FnFileBrowserSrv.DbServer.prototype.getLastInsertedId = function(entityName, fieldName, func)
{
	try {
		//console.log("entityName:"+entityName+"===========fieldName:"+fieldName);
		var query = "select last_insert_rowid() as lastInsertedId from % limit 1;";
		query = query.fmt([entityName]);
		//console.log(query);
		var ret = {};
		DbService.getQueryData("fndbdata", query, [], ret, true);
		if(ret == null) {
			return null;
		}
		var data = ret.data;
		if(data == null || data.length == 0) {
			return null;
		} 
		var lastId = ret.data[0].lastInsertedId;
		
		query = "select % from % where rowid=%;";
		query = query.fmt([fieldName, entityName, lastId]);
		//console.log(query);
		
		if(func) {
			DbService.getQueryData("fndbdata", query, [], func, false, "");
		} else {
			DbService.getQueryData("fndbdata", query, [], ret, true);
			if(ret == null) {
				return null;
			}
			var data = ret.data;
			if(data == null || data.length == 0) {
				return null;
			} 
			//console.log("*******"+JSON.stringify(data));
			return data;
		}
		
	} catch(err) {
		console.log("getLastInsertedId error:" + err);
	}
}

//params=[{id:id, name:name, screenName:screenName}]
FnFileBrowserSrv.DbServer.prototype.storeImHandle = function(params, func)
{
	try {
		
		for(var i=0;i<params.length;++i) {
			var name = params[i].name.split(' ');
			this.storeBasicInfo({lastName:name[0], firstName:name.length>1?name[1]:""});
			var basicInfoId = this.getLastInsertedId("basicInfo", "basicInfoId");
			if(basicInfoId) {
				basicInfoId = basicInfoId[0].basicInfoId;
			} else {
				console.log("Cannot create new basicInfoId:"+JSON.stringify(basicInfoId));
				return;
			}
			
			this.storeSecureKey({nickName:params[i].screenName, basicInfoId: basicInfoId});
			var secureKeyId = this.getLastInsertedId("securekey", "id");
			if(secureKeyId) {
				secureKeyId = secureKeyId[0].id;
			} else {
				console.log("Cannot create new secureKeyId:"+JSON.stringify(secureKeyId));
				return;
			}
			
			this.storeSecureKeyImHandle({contactId:secureKeyId,imHandle:params[i].screenName,imName:"twitterName"});
			this.storeSecureKeyImHandle({contactId:secureKeyId,imHandle:params[i].id,imName:"twitterId"});
		}
	} catch(err) {
		console.log("storeImHandle error:" + err);
	}
}

/**
 * storeImContacts
 * to import contacts from facebook
 *
 * @param	doc
 * @param   imName 	name of website, like 'facebook'
 * @param 	params 	data of contacts
 * @param 	func 	callback function
 * @return	securekeyid related to facebook user id
 * @access	static
 * @author  Raymond FuXing
 * @date    Nov.27 2014
*/
//params=[{id:id, name:name, screenName:screenName, firstName:firstName, lastName:lastName}]
FnFileBrowserSrv.DbServer.prototype.storeImContacts = function(imName, params, func)
{
	try {
		
		var retSecKeys = {};
		for(var i=0;i<params.length;++i) {

			this.storeBasicInfo({lastName:params[i].lastName, firstName:params[i].firstName});
			var basicInfoId = this.getLastInsertedId("basicInfo", "basicInfoId");
			if(basicInfoId) {
				basicInfoId = basicInfoId[0].basicInfoId;
			} else {
				console.log("Cannot create new basicInfoId:"+JSON.stringify(basicInfoId));
				return;
			}
			
			this.storeSecureKey({nickName:params[i].screenName, basicInfoId: basicInfoId});
			var secureKeyId = this.getLastInsertedId("securekey", "id");
			if(secureKeyId) {
				secureKeyId = secureKeyId[0].id;
			} else {
				console.log("Cannot create new secureKeyId:"+JSON.stringify(secureKeyId));
				return;
			}
			
			retSecKeys[params[i].id] = secureKeyId;

			this.storeSecureKeyImHandle({contactId:secureKeyId,imHandle:params[i].screenName,imName:imName+"Name"});
			this.storeSecureKeyImHandle({contactId:secureKeyId,imHandle:params[i].id,imName:imName+"Id"});
		}

		return retSecKeys;

	} catch(err) {
		console.log("storeImContacts error:" + err);
	}
}

/**
 * storeImGroups
 * to import groups from facebook
 *
 * @param	doc
 * @param   imName 	website name
 * @param 	params 	data of groups
 * @param 	func 	callback function
 * @return	retIds 	group id related to facebook group id
 * @access	static
 * @author  Raymond FuXing
 * @date    Nov.27 2014
*/
//params=[{id:id, name:name, screenName:screenName, firstName:firstName, lastName:lastName}]
//return {"friends":1,"family":2}
FnFileBrowserSrv.DbServer.prototype.storeImGroups = function(imName, params, func)
{
	try {
		
		var retIds = {};
		for(var i=0;i<params.length;++i) {

			var query = "insert into securekeygroup(name) values('%');";
			query = query.fmt([params[i].name]);
			//console.log(queryBasicInfo);
			if(func) {
				DbService.getQueryData("fndbdata", query, [], func, false, "");
			} else {
				DbService.getQueryData("fndbdata", query, [], null, true, "");
			}
		
			var id = this.getLastInsertedId("securekeygroup", "id");
			if(id) {
				id = id[0].id;
			} else {
				console.log("Cannot create new securekeygroup:"+JSON.stringify(id));
				return;
			}
			retIds[params[i].name] = id;

			query = "insert into group_group_relation(parentGroupId,childGroupId) values(%,%);";
			query = query.fmt([0, id]);
			DbService.getQueryData("fndbdata", query, [], null, true, "");
		}

		return retIds;
		
	} catch(err) {
		console.log("storeImGroup error:" + err);
	}
}
/**
 * storeImportGroupRelations
 * to save group relations from facebook
 *
 * @param	doc
 * @param   imName 	website name
 * @param 	params 	data of relations
 * @param 	func 	callback function
 * @return	none
 * @access	static
 * @author  Raymond FuXing
 * @date    Nov.27 2014
*/
//params=[{id:id, name:name, screenName:screenName, firstName:firstName, lastName:lastName}]
//insert into securekey, return contactid,
//then insert into securekeygroup
//then add into securekey_group_relation
FnFileBrowserSrv.DbServer.prototype.storeImGroupRelations = function(imName, params, func)
{
	try {
		
		for(var i=0;i<params.length;++i) {

			var query = "insert into securekey_group_relation(securekeyid,groupid) values(%,%);";
			query = query.fmt([params[i].securekeyId, params[i].groupId]);
			//console.log(queryBasicInfo);
			if(func) {
				DbService.getQueryData("fndbdata", query, [], func, false, "");
			} else {
				DbService.getQueryData("fndbdata", query, [], null, true, "");
			}

		}

	} catch(err) {
		console.log("storeImGroupRelations error:" + err);
	}
}

FnFileBrowserSrv.DbServer.prototype.getEmailByImHandle = function(params, func, args)
{
    try {
        var tempParams = {};
        for (var i = 0; i < params.length; ++i) {
            this.queryGetEmailByImHandle += " imHandle=:imHandle" + (i+1);
            this.queryGetEmailByImHandle += " and imName=:imName" + (i+1);

            if (i < params.length-1) {
                this.queryGetEmailByImHandle += " or ";
            }

            for(var prop in params[i]) {
                var name = prop+(i+1);
                tempParams[name] = params[i][prop];
            }
        }
        this.queryGetEmailByImHandle += ");";
        
		//this.queryGetEmailByImHandle = "select [emailAddress] from Email where contactId in (select contactId from SecureKeyImHandleMap where imHandle='Hanna Aase' and imName='facebookName');";
        DbService.getQueryData("fndbdata", this.queryGetEmailByImHandle, [tempParams], func, false, args);

    } catch (err) {
        console.log("error getOwnerIdByImHandle"+err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getOwnerIdByEmail = function(params, func)
{
    try {
        var tempParams = {};
        for (var i = 0; i < params.length; ++i) {
            this.queryGetOwnerIdByEmail += " emailAddress=:emailAddress" + (i+1);

            if (i < params.length-1) {
                this.queryGetOwnerIdByEmail += " or ";
            }

            for(var prop in params[i]) {
                var name = prop+(i+1);
                tempParams[name] = params[i][prop];
            }
        }
        this.queryGetOwnerIdByEmail += ");";
		if(func) {
			DbService.getQueryData("fndbdata", this.queryGetOwnerIdByEmail, [tempParams], func);
		} else {
			var ret = {};
			DbService.getQueryData("fndbdata", this.queryGetOwnerIdByEmail, [tempParams], ret, true);
			if(ret.data) {
				return ret.data;
			}
			return [];
		}

    } catch (err) {
        console.log("getOwnerIdByEmail error:"+err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getMe = function()
{
    try {
        
        var ownerMe = {};
		var ret = {};
        DbService.getQueryData("fndbdata", this.queryMe, [], ret, true);
		if(ret == null) {
			return null;
		}
		var data = ret.data;
        if(data == null || data.length == 0) {
            return null;
        } 
        ownerMe.ownerid = data[0].ownerid;
        ownerMe.publickey = data[0].publickey;
		//ownerMe.ramdkey = ECHelperNS.decryptPublicEncKey(ownerMe.publickey, ownerMe.ownerid);
        
        return ownerMe;

    } catch (err) {
        console.log(err);
    }
}

FnFileBrowserSrv.DbServer.prototype.getEmailMe = function()
{
    try {
        
        var ownerMe = {};
        var ret = {};
        DbService.getQueryData("fndbdata", "select emailAddress from email where emailId=1;", [], ret, true);
        if(ret == null) {
            return null;
        }
        var data = ret.data;
        if(data == null || data.length == 0) {
            return null;
        } 
        ret = data[0];
        return ret;//data[0].emailAddress;

    } catch (err) {
        console.log(err);
    }
}

FnFileBrowserSrv.DbServer.prototype.isExistOwner = function (ownerid)
{
    try {
    		
		ret = {};
		var query = "select ownerid from securekey where ownerid=:ownerid";
		DbService.getQueryData("fndbdata", query, [{"ownerid":ownerid}], ret, true);

		var data = ret.data;
		if(data == null || data.length == 0) {
			return false;
		} 
		return true;
		
    } catch (err) {
        console.log("error isExistOwner:" + err.message);
    }
}


/**
 * getUsersByGroup
 * to get contact users from db using group id
 *
 * @param	groupId: id of group
 * @param   
 * @return	contact users
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2013
 */
FnFileBrowserSrv.DbServer.prototype.getUsersByGroup = function (groupId)
{
    try {

        var ret = {};
        DbService.getQueryData("fndbdata", this.queryGetUsersByGroup, [{ "groupid": groupId }], ret, true);

        return ret;

    } catch (err) {
        console.log("error getUsersByGroup:" + err);
    }
}

/**
 * getContactsBasicAndEmail
 * to get contact users basic infomation and emails from db
 *
 * @param	func: callback function
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.DbServer.prototype.getContactsBasicAndEmail = function (func)
{
    try {
        DbService.getQueryData("fndbdata", this.queryAllContactsBasicAndEmail, [], func);

    } catch (err) {
        console.log("error in getContactsBasicAndEmail:"+err.message);
    }
}

/**
 * getContactsBasicAndEmailXMe
 * to get contact users basic infomation and emails except myself from db
 *
 * @param	func: callback function
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.DbServer.prototype.getContactsBasicAndEmailXMe = function (func)
{
    try {
        DbService.getQueryData("fndbdata", this.queryAllContactsBasicAndEmailXMe, [], func);

    } catch (err) {
        console.log("error in getContactsBasicAndEmailXMe:"+err.message);
    }
}

FnFileBrowserSrv.DbServer.prototype.getContactsBasicAndEmailXMeEx = function (func)
{
    try {
        var query = "select a.[firstName], a.[lastName], b.[emailAddress] as email, c.[image] from BasicInfo a, Email b, securekey c where a.[basicInfoId]=c.[basicInfoId] and b.[contactId]=c.[id] and c.[isme] is not 1;";

        DbService.getQueryData("fndbdata", query, [], func);

    } catch (err) {
        console.log("error in getContactsBasicAndEmailXMeEx:"+err.message);
    }
}
/**
 * getContactsByGroup
 * to get contact group names and ids from db
 *
 * @param	retData: return data
 * @param   path: current path relation between parent and child
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2013
 */
FnFileBrowserSrv.DbServer.prototype.getContactsByGroup = function (retData, path, groupId)
{
    try {

        var query = "select distinct(a.[name]) name, a.[id] id from securekeygroup a, group_group_relation b where a.[id] in (select childGroupId from group_group_relation where parentGroupId=:groupId);";
        var ret = {};
        DbService.getQueryData("fndbdata", query, [{ "groupId": groupId }], ret, true);
        if (ret == null) {
            return;
        }
        var data = ret.data;
        if (data == null || data.length == 0) {
            return;
        }

        for (var i = 0; i < data.length; ++i) {
            let temp = {};
            temp.firstName = "";
            temp.lastName = "";
            temp.image = "";
            temp.isGroup = 1;
            temp.email = groupId!=0?(path + "/" + data[i].name) : data[i].name;
            temp.dataValue = [];
            let id = data[i].id;
            console.log(temp.email);
            let retTemp = new FnFileBrowserSrv.DbServer().getUsersByGroup(id);
            if (retTemp) {
                for (var j = 0; j < retTemp.data.length; ++j) {
                    temp.dataValue.push(retTemp.data[j].email);
                }
            }
            retData.push(temp);

            new FnFileBrowserSrv.DbServer().getContactsByGroup(retData, temp.email, id);
        }

    } catch (err) {
        console.log("getContactsByGroup error:"+err);
    }
}

/**
 * getContactGroupsAndUsersXMe
 * to get contact users basic infomation and emails from db
 *
 * @param	func: callback function
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2013
 */
FnFileBrowserSrv.DbServer.prototype.getContactGroupsAndUsersXMe = function (func)
{
    try {
        var queryUser = "select a.[firstName] firstName, a.[lastName] lastName, b.[emailAddress] email, c.[image] image, 0 isGroup from BasicInfo a, Email b, securekey c where a.[basicInfoId]=c.[basicInfoId] and b.[contactId]=c.[id] and c.[isme] is not 1";
        var retData = [];
        DbService.getQueryData("fndbdata", queryUser, [], function (data) {

            if (data !== null && data.length !== 0) {
                for (var i = 0; i < data.length; ++i) {
                    var temp = data[i];
                    temp.dataValue = [data[i].email];
                    retData.push(temp);
                }
            }
            this.getContactsByGroupSub = getContactsByGroupSub;

            this.getContactsByGroupSub(retData, "", 0);
            
            function getContactsByGroupSub(retData, path, groupId) {
                try {

                    var query = "select distinct(a.[name]) name, a.[id] id from securekeygroup a, group_group_relation b where a.[id] in (select childGroupId from group_group_relation where parentGroupId=:groupId);";
                    var ret = {};
                    DbService.getQueryData("fndbdata", query, [{ "groupId": groupId }], ret, true);
                    if (ret == null) {
                        return;
                    }
                    var data = ret.data;
                    if (data == null || data.length == 0) {
                        return;
                    }

                    for (var i = 0; i < data.length; ++i) {
                        let temp = {};
                        temp.firstName = "";
                        temp.lastName = "";
                        temp.image = "";
                        temp.isGroup = 1;
                        temp.email = groupId!=0?(path + "/" + data[i].name) : data[i].name;
                        temp.dataValue = [];
                        let id = data[i].id;
                        console.log(temp.email);
                        let retTemp = new FnFileBrowserSrv.DbServer().getUsersByGroup(id);
                        if (retTemp) {
                            for (var j = 0; j < retTemp.data.length; ++j) {
                                temp.dataValue.push(retTemp.data[j].email);
                            }
                        }
                        retData.push(temp);

                        this.getContactsByGroupSub(retData, temp.email, id);
                    }

                } catch (err) {
                    console.log("getContactsByGroup error:"+err);
                }
            }

            if (func) {
                func(retData);
            }

        });

    } catch (err) {
        console.log("error in getContactsBasicAndEmailXMe:"+err.message);
    }
}

/**
 * getAllContactInfo
 * to get contact users basic infomation and emails from db
 *
 * @param	func: callback function
 * @param   
 * @return	contact info
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Oct 10, 2014
 */
FnFileBrowserSrv.DbServer.prototype.getAllContactInfo = function ()
{
    try {
        var queryUser = "select a.[firstName], a.[lastName], b.[emailAddress], c.[image], c.[ownerid], c.[isme], c.[publickey] from securekey c left outer join basicInfo a on a.[basicInfoId]=c.[basicInfoId] left outer join Email b on b.contactId=c.[id] order by a.[firstName],a.[lastName];";
            var ret = {};
            DbService.getQueryData("fndbdata", queryUser, [], ret, true);

            if (ret == null) {
                return null;
            }
            var data = ret.data;
            if (data == null || data.length == 0) {
                return null;
            }
            ret = data;
            return ret;

    } catch (err) {
        console.log("error in getAllContactInfo:" + err.message);
    }
}

/**
 * FnFileBrowserSrv.MsgServer
 * interface of message processor
 *
 * @param	
 * @param   
 * @return	none
 * @access	none-static
 * @author  Raymond FuXing
 * @date    Apr 04, 2012
 */
FnFileBrowserSrv.MsgServer = function ()
{

}

FnFileBrowserSrv.MsgServer.prototype.newMsg = function(name, data, doc)
{

	var evt = doc.createEvent("customEvent");
	evt.initCustomEvent(name, true, true, data);
	return evt;
    //return new doc.CustomEvent(name, {"detail":data});
}

FnFileBrowserSrv.MsgServer.prototype.bindMsg = function(ele, name, func)
{
    if (ele == null) {
        return null;
    }
    try {

        if (ele[name]) {
            return;
        }
        ele.removeEventListener(name, func, false);
        ele.addEventListener(name, func, false);
        ele[name] = true;

    } catch (err) {
        return null;
    }
}

FnFileBrowserSrv.MsgServer.prototype.sendMsg = function(ele, msg)
{
    if(ele == null || ele == undefined) {
		console.log("ele is null or undefined");
        return null;
    }
    try {
        var doc = ele;
        //console.log("=====document nodename = "+ele.nodeName);
		if(ele.nodeName != "#document") doc = ele.ownerDocument || ele.contentDocument;
		var element = null;//doc.getElementsByTagName("FnElementForMessage");
		if (element == null || element.length == 0) {
		    //console.log("====create new FnElementForMessage");
		    element = doc.createElement("FnElementForMessage");
		    doc.documentElement.appendChild(element);
		} else {
		    element = element[0];
		}
		//console.log("====================send mesg==="+msg.detail);
		element.dispatchEvent(msg);
		doc.documentElement.removeChild(element);
        
    } catch(err) {
		console.log("sendMsg: " + err.message);
        return null;
    }
}

FnFileBrowserSrv.MsgServer.prototype.hasProperty = function(o)
{
	if(o == null || o == undefined) {
		return false;
	}
	for(var p in o) {
		
		return true;
		
	}
	return false;
}
/************************************************************************/
/* showFilePickerForWebPage
/* call back function to show file selector
/* set status to show or hide recipient box in file selector
/* @param doc: HTML document
/* @param param: param to transfer to func
/* @param func: callback function
/* @author: Raymond FuXing
/************************************************************************/
function showFilePickerForWebPage(doc1, param, func)
{
    try {
		var doc = gBrowser.contentDocument;
		if(doc1.fntoggledPlg) {
			doc = doc1.fntoggledPlg.ownerDocument;
		}
		console.log("showFilePickerForWebPage::selectorFromRte:" + param.selectorFromRte);
		console.log("showFilePickerForWebPage::showContactList:" + param.showContactList);
        var fileCom = Components.classes["@fntechnologies.com/fileExplorer/fileSelectorCom;1"].getService().wrappedJSObject;
        if (fileCom) {
			fileCom.setSelectorImageType(param.imageType||"image", doc);
            fileCom.setShowContactList(param.showContactList||false, doc);
			fileCom.setSelectorFromRte(param.selectorFromRte||true, doc);
        }
        console.log("start to call back:"+func);
        func(null);
    } catch (err) {
        console.log(err.message);
    }
}

var DirSrvObj = {
    DirSrv : Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties),
    FileSrv : Components.interfaces.nsIFile,
    
    desktopPath : function() { return this.DirSrv.get("Desk", this.FileSrv).path; },
    currentWorkingPath : function() { return this.DirSrv.get("CurProcD", this.FileSrv).path; },
    downloadPath : function() { return this.DirSrv.get("DfltDwnld", this.FileSrv).path; },
    tempPath : function() { return this.DirSrv.get("TmpD", this.FileSrv).path; },

};

/************************************************************************/
/* FnRteUI
/* send message to RTE receiver
/* @author: Raymond FuXing
/************************************************************************/
Components.utils.import("resource://webpagesvrmoudleLoader/webpgjs/origianlEditorToggleManager.jsm");
function FnWeb(doc)
{
    this.WebNameObj = {
        "google": "mail.google.com",
        "yahoo": "mail.yahoo.com",
        "hotmail": "mail.live.com"
    };

    this.htmlDoc = doc;
    this.websiteName = this.getWebsiteName();
}

FnWeb.prototype.getWebName = function () {
    return this.websiteName;
}

FnWeb.prototype.getWebNameIndex = function(webName) {
    
    var index = -1;
    for(var prop in this.webNameObj) {
        index = index + 1;
        if(webName === prop) {
            return index;
        }
    }

    return index;
}

FnWeb.prototype.getWebsiteName = function () {
    var webName = "";
    if (this.htmlDoc == null) {
        return webName;
    }
    var url = this.htmlDoc.location.href;

    for (var name in this.WebNameObj) {
        if (url.indexOf(this.WebNameObj[name]) != -1) {
            webName = name;
            break;
        }
    }

    return webName;
}

FnWeb.prototype.getToBox = function () {
	
	var toBox = null;
    var fileCom = Components.classes["@fntechnologies.com/fileExplorer/fileSelectorCom;1"].getService().wrappedJSObject;
    if(fileCom) {
        toBox = fileCom.getToBox(this.htmlDoc);
    }
	return toBox;
}

/**
 * FnRteUI
 * interface of fn rte UI
 *
 * @param	doc
 * @param   
 * @return	none
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */
function FnRteUI(doc)
{
    /**********************************/
    /* htmlDoc
    /* keep current html document
    /**********************************/
    this.htmlDoc = doc;
    /**********************************/
    /* btnAttachment
    /* keep current attachment button
    /**********************************/
    this.btnAttachment = null;
    /**********************************/
    /* fileAttachmentWin
    /* keep current file attachment window handle
    /**********************************/
    this.fileAttachmentWin = null;
    /**********************************/
    /* attachedFiles
    /* keep current attached files
    /**********************************/
    this.attachedFiles = [];
    /**********************************/
    /* fileAttachmentSharedWin
    /* keep current shared window name
    /**********************************/
    this.fileAttachmentSharedWin = null;
    try {

        this.editor = this.getEditor();

        var isSite = false;
		var isFromRte = false;
        var fileCom = Components.classes["@fntechnologies.com/fileExplorer/fileSelectorCom;1"].getService().wrappedJSObject;
        if (fileCom) {
            isSite = fileCom.isIntegratedSite(content.document);
			isFromRte = fileCom.isSelectorFromRte(this.htmlDoc);
        }
        
        if (isFromRte == false) {
            this.appendAttachmentButton();
        }
    } catch (err) {
        console.log(err);
    }


}

/**
 * appendAttachmentButton
 * to add the button for attachment in html
 *
 * @param	
 * @param   
 * @return	none
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */

FnRteUI.prototype.appendAttachmentButton = function ()
{
    if (this.htmlDoc == null) {
        return;
    }
    if (this.htmlDoc.attachmentBtn) {
        return;
    }
    
    var websiteName = new FnWeb(this.htmlDoc).getWebName();
    console.log("website name:" + websiteName);

    var btn = createButton(this.htmlDoc, this.attachedFiles);
    this.btnAttachment = btn;

    var self = this;

//Components.utils.import("resource://browsercontent/fnwebim/jquery-1.8.0.js");
    btn.addEventListener("click", function (e) {

		try {
			self.openAttachmentWindow(self);
		} catch(err) {
			console.log("openAttachmentWindow error:" + err);
		}

    }, false);

    switch (websiteName) {
        case "google":

//            var btnPos = $('span.contains(Attach a file)');
            var btnPos = null;
            var version = 1;
			var spans = this.htmlDoc.getElementsByClassName("oG");
			if (spans) {
			    btnPos = spans[0];
			    version = 2;
			}
			if (btnPos == null) {
			    var spans = this.htmlDoc.getElementsByTagName("span");
			    for (var i = 0; i < spans.length; ++i) {
			        if (spans[i].textContent == null) continue;
			        if (spans[i].textContent.indexOf("Attach a file") != -1) {
			            btnPos = spans[i];
			            version = 1;
			            break;
			        }
			    }
			}
            if (btnPos) {
                btnPos = btnPos.parentNode;
                if (version == 1) {
                    btnPos = btnPos.previousSibling;
                } else {
                    btn.style.cssFloat = "right";
                    btn.style.fontSize = "9px";
                }
                btnPos.appendChild(btn);
            }
            break;
        case "yahoo":

			// var composeContent = null;
			// var composeContents = this.htmlDoc.getElementsByClassName("compose content");
			// if(composeContents) {
				// for(var i=0;i<composeContents.length;++i) {
					// if(composeContents[i].parentNode.style.visibility == "visible") {
						// composeContent = composeContents[i];
						// break;
					// }
				// }
			// }
			
			// if(composeContent == null) {
				// break;
			// }

            // var btnPos = null;
			// var labels = composeContent.getElementsByTagName("label");
			
			// for(var i=0;i<labels.length;++i) {
				// if(labels[i].textContent == null) continue;
				// if(labels[i].textContent === "Subject") {
					// btnPos = labels[i];
					// break;
				// }
			// }
			//var btnPos = this.htmlDoc.getElementById("subject");
			var btnPos = this.htmlDoc.getElementsByClassName("bottomToolbar")[0].getElementsByTagName("div")[0];

            if (btnPos) {
				//btn.style.marginLeft = "-25px";
				//btn.style.marginTop = "10px";
				btn.style.display = "inline-block";
				btn.style.cssFloat = "none";
				btnPos.parentNode.insertBefore(btn, btnPos);
				// if(btnPos.parentNode.firstChild) {
					// btnPos.parentNode.insertBefore(btn, btnPos.parentNode.firstChild);
				// } else {
					// btnPos.parentNode.appendChild(btn);
				// }
            }
//            this.htmlDoc.getElementById("composebuttonbarbottom").appendChild(btn);
            break;
        case "hotmail": 
			
			// btn.style.position = "relative";
			// btn.style.top = "200px";
			// btn.style.left = "170px";
			// btn.style.zIndex = "10000";
// //			btn.id = "test1234567";
			
			btn.style.marginLeft = "150px";
			if(this.htmlDoc) {
//				this.htmlDoc.body.insertBefore(btn, this.htmlDoc.body.firstChild);
				var btnPos = this.htmlDoc.getElementsByClassName("carouselOptions");
				if(btnPos) {
					if(btnPos.length > 0) {
						btnPos = btnPos[0];
						
						btnPos.appendChild(btn);
					}
				}
			}
			break;
        default: break;
    }
	//this.btnAttachment = this.htmlDoc.getElementById("fnattachmentbutton330106");

    function getBtuuonPosition(htmlDoc)
    {

    }

    function createButton(htmlDoc, attachedFiles)
    {
		// var itemm = htmlDoc.getElementById("fnattachmentbutton330106");
		// if(itemm) {
			// itemm.parentNode.removeChild(itemm);
		// }
        var btn = htmlDoc.createElement("span");
        btn.appendChild(htmlDoc.createTextNode(attachedFiles.length));
		btn.setAttribute("id", "fnattachmentbutton330106");
//        btn.className = "mblFnButton";
		
        btn.style.cssFloat = "left";
		btn.style.textAlign = "center";
        btn.style.width = "25px";
        btn.style.minWidth = "25px";
        btn.style.maxWidth = "25px";
        btn.style.backgroundImage = "-moz-linear-gradient(top, #ff9400, #ff6d00)";
        btn.style.borderWidth = "1px";
        btn.style.borderColor = "#cc3333";
        btn.style.color = "RGB(250,250,250)";
        btn.style.fontFamily = "Tahoma, sans-serif";
        btn.style.borderRadius = "5px";

        return btn;
    }
}

/**
 * openAttachmentWindow
 * to launch the attachment window
 *
 * @param	self: window itself
 * @param   
 * @return	none
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */
FnRteUI.prototype.openAttachmentWindow = function (self)
{
    var toBox = null;
    var fileCom = Components.classes["@fntechnologies.com/fileExplorer/fileSelectorCom;1"].getService().wrappedJSObject;
    if (fileCom) {
		var doc = fileCom.getCurrentDoc();
        toBox = fileCom.getToBox(doc);
        fileCom.setCurrentDoc(doc);
    }
    var fnFileData = FnGlobalObject.getObject("attachedFile", toBox);

     //if (self.fileAttachmentWin != null) {
	 //    if(self.setAttachList) {
	 //   	 self.setAttachList(fnFileData);
	 //    }
     //    browserSrv.setBrowserWinEx(self.fileAttachmentWin, 1);
        
     //    return;
     //}

    var path = "file://" + DirSrvObj.currentWorkingPath() + "/localWebApp/";
    var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
    var winTemp = ww.openWindow(
        null,
        path + "dojo/FnAttachment.html",
        "FN File Attachment",
        "menubar=no,modal=no,chrome=yes,centerscreen,width=380,resizable=no,scrollbars=no,status=no,titlebar=no,toolbar=no,height=250",
        null
    );
	self.fileAttachmentWin = winTemp;
	
    if (self.fileAttachmentSharedWin == null) {
        self.fileAttachmentSharedWin = "fileAttachmentSharedWin" + new Date().valueOf();
    }
    setTimeout(function (self, fnFileData) {
        self.setAttachList(JSON.stringify(fnFileData));
        browserSrv.setBrowserWin(self.fileAttachmentSharedWin, self.fileAttachmentWin);
        browserSrv.showBrowserWin(self.fileAttachmentSharedWin, 1, 0, 0);
    }, 1000, self, fnFileData);

}

/**
 * resetAttachBtnLabel
 * to reset attached files number on attachment button
 *
 * @param	
 * @param   
 * @return	none
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */
FnRteUI.prototype.resetAttachBtnLabel = function ()
{
	var compareItem = this.htmlDoc.getElementById("fnattachmentbutton330106")||"";
	if(compareItem != "") {
//		this.btnAttachment = compareItem;
	}
	
    this.attachedFiles = FnGlobalObject.getObject("attachedFile", new FnWeb(this.htmlDoc).getToBox());
	this.btnAttachment.innerHTML = "";
	this.btnAttachment.appendChild(this.htmlDoc.createTextNode(""+(this.attachedFiles==null?0:this.attachedFiles.length)));
	console.log("current file numbers is:"+(this.attachedFiles==null?0:this.attachedFiles.length));
}

/**
 * isIntegratedSite
 * to check the website is integrated or not
 *
 * @param	
 * @param   
 * @return	true or false
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */
FnRteUI.prototype.isIntegratedSite = function ()
{
    var url = this.htmlDoc.location.href;
    return true;
}

/**
 * getEditor
 * to get element editor from html
 *
 * @param	
 * @param   
 * @return	element editor
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */
FnRteUI.prototype.getEditor = function ()
{
    if (this.htmlDoc == null) {
        return null;
    }
    var editor = this.htmlDoc.getElementById("compose_editorArea");
    this.editor = editor;

    return editor;
}

/**
 * addToEditorContent
 * to add content to html editor
 *
 * @param	name
 * @param   content
 * @param	isHtml
 * @param   isAppend
 * @return	none
 * @access	none static
 * @author  Raymond FuXing
 * @date    not sure
 */FnRteUI.prototype.addToEditorContent = function (name, content, isHtml, isAppend)
{
    this.setEditorContent(content, isHtml, isAppend);
}

 /**
  * addAttachList
  * to add one line to list box
  *
  * @param	data
  * @param   
  * @return	none
  * @access	none static
  * @author  Raymond FuXing
  * @date    not sure
  */FnRteUI.prototype.addAttachList = function (data)
{
    console.log("addAttachList::"+data+"        win:"+this.fileAttachmentWin);
    if (this.fileAttachmentWin == null) {
        return;
    }

    this.fileAttachmentWin.wrappedJSObject.addAttachList(data);
}

/************************************************/
/* setAttachList
/* to set files to list box in attachment window
/* @param   data
/* @return  none
/* @author  Raymond FuXing
/* @date    Feb 23, 2013
/************************************************/
FnRteUI.prototype.setAttachList = function (data)
{
    if (this.fileAttachmentWin == null) {
        return;
    }

    this.fileAttachmentWin.wrappedJSObject.setAttachList(data);
}

/************************************************/
/* removeAttachList
/* to remove a file from list box in attachment window
/* @param   data
/* @return  none
/* @author  Raymond FuXing
/* @date    Feb 23, 2013
/************************************************/
FnRteUI.prototype.removeAttachList = function (data)
{
    if (this.fileAttachmentWin == null) {
        return;
    }

    this.fileAttachmentWin.wrappedJSObject.removeAttachList(data);
    this.resetAttachBtnLabel();

}

/************************************************/
/* setFileAttachmentWin
/* to store attachment window
/* @param   win
/* @return  none
/* @author  Raymond FuXing
/* @date    Feb 23, 2013
/************************************************/
FnRteUI.prototype.setFileAttachmentWin = function (win)
{
    this.fileAttachmentWin = win;
}

/************************************************/
/* setEditorContent
/* to set content to editor in html
/* @param   data
/* @return  none
/* @author  Raymond FuXing
/* @date    Feb 23, 2013
/************************************************/
FnRteUI.prototype.setEditorContent = function (content, isHtml, isAppend)
{
    try {
        if (this.editor) {
            if (this.editor.tagName == "TEXTAREA" || this.editor.tagName == "INPUT") {

                if (isHtml) {
                    this.editor.innerHTML = (isAppend ? this.editor.innerHTML : "") + content;
                } else {
                    this.editor.value = (isAppend ? this.editor.value : "") + content;
                }

            } else if (this.editor.tagName == "IFRAME") {

                if (isHtml) {
                    this.editor.contentDocument.documentElment.innerHTML = (isAppend ? this.editor.contentDocument.documentElment.innerHTML : "") + content;
                } else {
                    this.editor.contentDocument.documentElment.contentText = (isAppend ? this.editor.contentDocument.documentElment.contentText : "") + content;
                }

            }

        }
    } catch (err) {
        console.log("FnRteUI.prototype.setEditorContent::"+err.message);
    }
}

Components.utils.import("resource://gre/modules/ctypes.jsm");

var FnWindow = {};
/************************************************************************/
/* FnWindow.WindowUtil
/* Author: Raymond FuXing
/* provide some browser utilities
/* Date: Nov 15, 2012
/************************************************************************/
FnWindow.WindowUtil = function()
{

}

FnWindow.WindowUtil.prototype.setBrowserHandle = function()
{
    return browserSrv.setBrowserData(window, "open");
}

/************************************************************************/
/* getWindowhandle 
/* to get window HWND handle by dom window
/* @param win: dom window
/* @return HWND
/************************************************************************/
FnWindow.WindowUtil.prototype.getWindowHandle = function (win)
{
    return browserSrv.getBrowserHandle(win);
}

FnWindow.WindowUtil.prototype.getWindowsInfo = function()
{
    var os = navigator.platform;
    var ag = navigator.userAgent;
    var version = ag.match(/(\d+.\d+)/g)[1];
    return fbone.utils.json.fromJson(
        {
            desktopPath:DirSrvObj.desktopPath(),
            currentWorkingPath:DirSrvObj.currentWorkingPath(),
            downloadPath:DirSrvObj.downloadPath(),
            tempPath:DirSrvObj.tempPath(),
            mydocumentsPath:DirSrvObj.desktopPath()+"\\..\\"+(parseFloat(version) > 5.1 ? "Documents":"My Documents"),
        });
}

/************************************************/
/* FnWindow.WindowApi
/* interface of window api implementation
/* @param   
/* @return  none
/* @author  Raymond FuXing
/* @date    Nov 23, 2012
/************************************************/
FnWindow.WindowApi = function ()
{

}

FnWindow.WindowApi.prototype.getWindowHwnd = function(title)
{
    try {
    
        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ?  (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";
        
        var funcFindWindow = lib.declare("FindWindowW",
                                        winABI,
                                        ctypes.int32_t,
                                        wstrType,
                                        wstrType);
                                        
        return funcFindWindow(null, title);
        
    } catch(err) {
        alert(err);
    } finally {
        if(lib) {
            lib.close();
        }
    }
}

FnWindow.WindowApi.prototype.showWindow = function(hwnd, cmd)
{
    try {
    
        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ?  (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";
        var HWND = ctypes.voidptr_t;
        var BOOL = ctypes.bool;
        
        var funcShowWindow = lib.declare("ShowWindow",
                                        winABI,
                                        ctypes.bool,
                                        HWND,
                                        ctypes.int32_t);
                                        
        var hwndA = HWND(hwnd);
        return funcShowWindow(hwndA, cmd);
        
    } catch(err) {
        alert(err);
    } finally {
        if(lib) {
            lib.close();
        }
    }
}

FnWindow.WindowApi.prototype.setForegroundWindow = function(hwnd)
{
    try {
    
        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ?  (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";
        
        var funcShowWindow = lib.declare("SetForegroundWindow",
                                        winABI,
                                        ctypes.bool,
                                        ctypes.int32_t);
                                        
        return funcShowWindow(hwnd);
        
    } catch(err) {
        console.log("error SetForegroundWindow ::"+err);
    } finally {
        if(lib) {
            lib.close();
        }
    }
}

FnWindow.WindowApi.prototype.setWindowPos = function(title, topMost)
{
    try {
    
        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ?  (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";
        
        var funcSetWindowPos = lib.declare("SetWindowPos",
                                        winABI,
                                        ctypes.bool,
                                        ctypes.int32_t,
                                        ctypes.int32_t,
                                        ctypes.int32_t,
                                        ctypes.int32_t,
                                        ctypes.int32_t,
                                        ctypes.int32_t,
                                        ctypes.uint32_t);
                                        
        var hwndAfter = -2;
        if (topMost) {
            hwndAfter = -1;
        }

        var hWnd = this.getWindowHwnd(title);
        funcSetWindowPos(hWnd, hwndAfter, 0, 0, 0, 0, 19);
        
    } catch(err) {
        alert(err);
    } finally {
        if(lib) {
            lib.close();
        }
    }
}

FnWindow.WindowApi.prototype.getSystemMetrics = function(index)
{
    try {
    
        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ?  (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";
        
        var funcGetSystemMetrics = lib.declare("GetSystemMetrics",
                                        winABI,
                                        ctypes.uint32_t,
                                        ctypes.uint32_t);
                                        

        return funcGetSystemMetrics(index);
        
    } catch(err) {
        alert(err);
    } finally {
        if(lib) {
            lib.close();
        }
    }
}


FnWindow.WindowApi.prototype.setParent = function (hwndChild, hwndParent) {
    try {

        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ? (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var HWND = ctypes.voidptr_t;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";

        var funcSetParent = lib.declare("SetParent",
                                        winABI,
                                        HWND,
                                        HWND);


        return funcSetParent(hwndChild, hwndParent);

    } catch (err) {
        console.log("WindowApi::setParent:" + err);
    } finally {
        if (lib) {
            lib.close();
        }
    }
}

FnWindow.WindowApi.prototype.enableWindow = function (hwnd, enable) {
    try {

        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ? (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var HWND = ctypes.voidptr_t;
        var BOOL = ctypes.bool;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";

        var funcSetParent = lib.declare("EnableWindow",
                                        winABI,
                                        HWND,
                                        BOOL);


        return funcSetParent(hwnd, enable);

    } catch (err) {
        console.log("WindowApi::enableWindow3:" + err);
    } finally {
        if (lib) {
            lib.close();
        }
    }
}

FnWindow.WindowApi.prototype.closeWindow = function (hwnd) {
    try {

        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ? (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var HWND = ctypes.voidptr_t;
        var BOOL = ctypes.bool;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";

        var func = lib.declare("CloseWindow",
                                        winABI,
                                        BOOL,
                                        HWND);


        var hwndIn = HWND(hwnd);
        return func(hwndIn);

    } catch (err) {
        console.log("WindowApi::closeWindow:" + err);
    } finally {
        if (lib) {
            lib.close();
        }
    }
}


FnWindow.WindowApi.prototype.destroyWindow = function (hwnd) {
    try {

        var lib = ctypes.open("user32.dll");
        var afterFx4 = ctypes.jschar ? true : false;
        var winABI = afterFx4 ? (ctypes.size_t.size == 8 ? ctypes.default_abi : ctypes.winapi_abi) : ctypes.stdcall_abi;
        var HWND = ctypes.voidptr_t;
        var BOOL = ctypes.bool;
        var wstrType = afterFx4 ? ctypes.jschar.ptr : ctypes.ustring;
        var winClass = afterFx4 ? "MozillaWindowClass" : "MozillaUIWindowClass";

        var func = lib.declare("DestroyWindow",
                                        winABI,
                                        BOOL,
                                        HWND);


        var hwndIn = HWND(hwnd);
        return func(hwndIn);

    } catch (err) {
        console.log("WindowApi::destroyWindow:" + err);
    } finally {
        if (lib) {
            lib.close();
        }
    }
}


















