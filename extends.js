Function.prototype.extendsFrom = function(parentClassOrObject) 
{
    if(parentClassOrObject.constructor == Function) {
        this.prototype = new parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject.prototype;
    }
     else {
        this.prototype = parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parent = parentClassOrObject;
     }
     
     return this;
}

/************************************************************************/
/* base class for drag and drop, as a pure virtual class
/* Raymond Fu
/* 2010-03
/************************************************************************/
function baseDragAndDrop() {}
baseDragAndDrop = {
    onDragEnter : function (event,session)
    {
        session.canDrop = gCanDragDrop;
    },

    onDragOver : function (event,flavor,session)
    {	
        if(flavor.dataIIDKey == "nsIFile") {
            gCanDragDrop = true;
        } else {
            gCanDragDrop = false;
        }
        session.canDrop = gCanDragDrop;
    },

    onDragStart : function (event, transferData, dragAction)
    {
        alert('data='+transferData+'  action='+dragAction);
    },

    onDragExit : function (event,session)
    {
    },
    
    getSupportedFlavours : function ()
    {
        var flavours = new FlavourSet()
        flavours.appendFlavour("application/x-moz-file","nsIFile")
        flavours.appendFlavour("text/unicode")
        return flavours
    } ,

    getFileName : function() 
    {
        try {
            return this.fileName;
        } catch(err) {
            alert(err);
        }
    },

    getFileSize : function() 
    {
        try {
            return this.fileSize;
        } catch(err) {
            alert(err);
        }
    },
};    

function baseDrop(appType) 
{
    this.appType = appType || 0;
    this.bCanDrop = gCanDragDrop;
    this.indexFileUpload = g_indexFileUpload;
    this.imageid = null;
    this.fbPhoto = new FBPHOTO();
    
    applicationType = appType;
}
function getSiteName(appType)
{
    for(var idx=0;idx<siteInfo.length;idx++) {
        if(siteInfo[idx][1] == appType) {
            return siteInfo[idx][0];
        }
    }
    return "";
}
function isUploadable(appType, files) {
    if(appType == 7) {
        return true;
    }
    var siteName = getSiteName(appType);
    
    if(!utilService) {
        utilService = getUtilService();
    }
    var file = files.split(',');
    var ret = true;
    for(var i=0;i<file.length;i++) {
        ret = utilService.isFileUploadable(file[i],siteName);
        if(!ret) {
            break;
        }
    }
    
    return ret;
}
var gCanDragDrop = true;

baseDrop.prototype.onDrop = function (event,dropData,session)
{
    try
    {	
        event.preventDefault();
        getFbService();
        
        var contentType = dropData.dataList[0].dataList[0].flavour.contentType;
        dataClip = dropData.dataList[0].dataList[0].data;
        var dataArray = dropData.dataList;
//        fileName = dataArray[0].first.data.path + ",";
        var filename = dataArray[0].first.data.path + ",";
        var tmpFile = dataArray[0].first.data.path;
        this.fbPhoto.filename = filename;
        this.indexFileUpload = g_indexFileUpload;
//        fbservice.FbLog("onDrop()--file:"+filename+"  index:"+this.indexFileUpload);
        
        fbimageid = document.getElementById("image"+event.target.id);
        this.imageid = fbimageid;
        
        arrayFileUpload.push(this);
        g_indexFileUpload ++;
//        alert(arrayFileUpload.length+"  index="+indexFileUpload)
        gCanDragDrop = false;
        this.bCanDrop = gCanDragDrop;
        if(!fbservice.IsFile(tmpFile)) {
//            fbservice.FbLog(tmpFile+" cannot be processed...\n");
            fnalert(null,"message","This file cannot be processed!\n Please select another file.");
            gCanDragDrop = true;
            this.bCanDrop = gCanDragDrop;
            restoreIcon(fbimageid);
            return;
        }
        if(this.appType != TYPEDROPBOX && this.appType != TYPEBOX) {
            if(!isUploadable(this.appType, filename)) {
                gCanDragDrop = true;
                this.bCanDrop = gCanDragDrop;
                restoreIcon(fbimageid);
                setTimeout(showAlert, 100);
                return;
                
            }
        }
        this.openPage(this.appType, this.indexFileUpload);
//        setTimeout(this.openPage, 0, this.appType, this.indexFileUpload);
        
        return;

    } 
    catch(err){
        alert(err);
    }	
}

baseDrop.extendsFrom(baseDragAndDrop);


/***
 * you also could use the following method to implement extends
 * 1, baseDrop.prototype = Object.create(baseDragAndDrop.prototype);
 * 
 * 2, class baseDrop extends baseDragAndDrop {}
 * 
 * Raymond Fu
 * 2016-3
 ***/
 
