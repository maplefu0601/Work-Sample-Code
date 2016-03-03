<?php 


/**
 * mkdoc_nid_filter: to implementation of hook_filter
 * author: Raymond Fu
 * date; Feb 4, 2016
 */
function mkdoc_nid_filter($op, $delta = 0, $format = -1, $text = '') {
  
 
  switch ($op) {
	  case 'list':
		return array(0 => t('Mark doc to node id'));

	  case 'description':
		return t('By including the syntax (*.md), this filter will embed the node with given NID');

	  case 'prepare':
		return $text;

	  case 'no cache':
		return TRUE;

	  case "process":

		//$viewNid = mkdoc_nid_getCurrentNodeId();
		//$bookId = mkdoc_nid_getCurrentBookId($viewNid);
		////dsm($text);

		return mkdoc_nid_convertion($text);

	  }
}
/*
function mkdoc_nid_getNodeId($mdName) {

	$mkdoc = MkDoc::getInstance();
	$linkNames = $mkdoc->getLinkNames();


}
*/

function mkdoc_nid_convertion($text) {

	$text = mkdoc_nid_convertMdLinks($text);

	$text = mkdoc_nid_convertImages($text);

	$text = mkdoc_nid_convertAudios($text);

	$text = mkdoc_nid_convertVideos($text);

	$text = mkdoc_nid_convertDocuments($text);

	return $text;
	
}
//\[(.*?)\]\((.*?)\)
//using ----- \[(.*)\]\((.*\.(md))
function mkdoc_nid_convertMdLinks($text) {
	
    return preg_replace_callback('/\[(.*?)\]\((.*?)\)/', function($matches) {

		if(strpos($matches[2], '.md') == FALSE) {
			return $matches[0];	
		}
		$nid = mkdoc_nid_getNodeId($matches[2]);

		if($nid === NULL) {
			$output = $matches[0];	
		} else {
			$output = '<a href="'.$nid.'">'.$matches[1].'</a>';
		}

		return $output;
		
	}, $text);
	
}
//using ---- \[\!\[(.*?)\]\((.*\.(png|jpg|jpeg|gif|tif|bmp))\).* \"(.*)\"\) 
function mkdoc_nid_convertImages($text) {
	
    return preg_replace_callback('/\[?\!\[(.*?)\]\((.*\.(png|jpg|jpeg|gif|tif|bmp))\)\]?.*[.* \"(.*)\"\)]?/', function($matches) {
		

		$linkFolder = mkdoc_nid_getNodeFolder($matches[2]);
		$title = $matches[1];
		if(array_key_exists(4, $matches)) {
			$title = $matches[4];	
		}

		if($linkFolder === NULL) {
			$output = $matches[2];	
		} else {
			$output = '<p><a href="'.$linkFolder.'" title="'.$title.'"><img src="'.$linkFolder.'" alt="'.$matches[1].'"/></a></p>';
		}

		return $output;
		
	}, $text);
	
}

function mkdoc_nid_convertAudios($text) {
	
    return preg_replace_callback('/\((.*\.(mp3|ogg|wav))\)/', function($matches) {
		

		$linkFolder = mkdoc_nid_getNodeFolder($matches[1]);

		if($linkFolder === NULL) {
			$output = $matches[1];	
		} else {
			$output = '<audio width="100%" <source type="audio/'.$matches[2].'" src="'.$linkFolder.'"></source></audio>';
		}

		return $output;
		
	}, $text);
	
}

function mkdoc_nid_convertVideos($text) {
	
    return preg_replace_callback('/\((.*\.(mp4|mpeg|avi))\)/', function($matches) {
		

		$linkFolder = mkdoc_nid_getNodeFolder($matches[1]);

		if($linkFolder === NULL) {
			$output = $matches[1];	
		} else {
			$output = '<video width="100%" <source type="video/'.$matches[2].'" src="'.$linkFolder.'"></source></video>';
		}

		return $output;
		
	}, $text);
	
}
//using -------  \[(.*)\]\((.*?.(pdf|doc))\)
function mkdoc_nid_convertDocuments($text) {
	
    return preg_replace_callback('/\[(.*)\]\((.*?.(pdf|doc))\)/', function($matches) {

		$linkFolder = mkdoc_nid_getNodeFolder($matches[2]);

		if($linkFolder === NULL) {
			$output = $matches[0];	
		} else {
			$output = '<a href="'.$linkFolder.'" >'.$matches[1].'</a>';
		}

		return $output;
		
	}, $text);
	
}

function mkdoc_nid_convertDocumentsBak($text) {
	
    return preg_replace_callback('/\((.*\.(docx|exls|ppt|pdf))\)/', function($matches) {
		
		$linkFolder = mkdoc_nid_getNodeFolder($matches[1]);

		if($linkFolder === NULL) {
			$output = $matches[1];	
		} else {
			$output = '<object width="100%" type="application/'.$matches[2].'" data="'.$linkFolder.'#zoom=100"><p>'.$matches[1].'</p></object>';
		}

		return $output;
		
	}, $text);
	
}

/**
 * Implementation of hook_filter_tips()
 */
function mkdoc_nid_filter_tips($delta, $format, $long = FALSE) {
  return t('[[md link]] - replace md file link to node id');
}

function mkdoc_nid_init() {
	////dsm('mkdoc_nid_init');	
	//mkdoc_nid_getNodeId();
}

function mkdoc_nid_getCurrentNodeId() {
	return substr($_GET['q'],strrpos($_GET['q'],"/")+1); 	
}

function mkdoc_nid_getCurrentBookId($viewId) {

	if(is_numeric($viewId)) {
		$viewNode = node_load($viewId);

		if($viewNode->book) {
			$bookId = $viewNode->book['bid'];
			return $bookId;
		}
	}

	return NULL;
	
}

function mkdoc_nid_getNodeFolder($mediaName) {
//dsm('-------mkdoc_nid_getNodeId---'.$mediaName);
	
	$baseFolder = '/files/gdc-docs/gitdata/';
	$retFolder = "";
	$viewNid = mkdoc_nid_getCurrentNodeId(); 

	if(is_numeric($viewNid)) {
		$bookId = mkdoc_nid_getCurrentBookId($viewNid);

		if(is_numeric($bookId)) {

			//$bookNode = node_load($bookId);


			$mkdoc = MkDoc::getInstance();
			$datamk = $mkdoc->getMkdocsFromDb($bookId);

			$linkNames = $datamk->pagesByLinkName;
			$nodeIds = $datamk->pagesByNodeId;
			$bookFolder = $datamk->bookFolder;

			$retFolder = $baseFolder.$bookFolder.'/docs/';

			//$GLOBALS['mkdocLinkNames-'.$bookId] = $linkNames;
			//$GLOBALS['mkdocNodeIds-'.$bookId] = $nodeIds;



			$pos = strrpos($mediaName, '/');
			if($pos === false || $mediaName[0] !== '/') {//media file name only or is root folder


				$mdLink = $nodeIds[$viewNid]->mdLink;

				$folder = substr($mdLink, 0, strrpos($mdLink, '/'));

				if($folder != '') {

					$retFolder .= $folder.'/'.$mediaName;

				} else {

					$retFolder .= $mediaName;	
				}

			} else if($mediaName[0] === '/') {
				$mediaName = substr($mediaName, 1);
				$retFolder .= $mediaName;
			}
					

			return $retFolder;
		}
	}

	return $retFolder;
	
	
}


function mkdoc_nid_getNodeId($mdName) {

	$viewNid = mkdoc_nid_getCurrentNodeId(); 

	if(is_numeric($viewNid)) {
		$bookId = mkdoc_nid_getCurrentBookId($viewNid);

		if(is_numeric($bookId)) {

			//$bookNode = node_load($bookId);


			$mkdoc = MkDoc::getInstance();
			$datamk = $mkdoc->getMkdocsFromDb($bookId);

			$linkNames = $datamk->pagesByLinkName;
			$nodeIds = $datamk->pagesByNodeId;

			$node = node_load($viewNid);
            if($node->book) {
                $parentId = $nodeIds[$viewNid]->parentId;

                $nodeParent = node_load($parentId);


                if($nodeParent) {
                    $node->book['plid'] = $nodeParent->book['mlid'];
                    _book_update_outline($node);

                }   
            }   

			//$GLOBALS['mkdocLinkNames-'.$bookId] = $linkNames;
			//$GLOBALS['mkdocNodeIds-'.$bookId] = $nodeIds;


			$pos = strrpos($mdName, '/');
			if($pos === false) {//md file name only


				$mdLink = $nodeIds[$viewNid]->mdLink;

				$folder = substr($mdLink, 0, strrpos($mdLink, '/'));

				if($folder != '') {

					if(array_key_exists($folder.'/'.$mdName, $linkNames)) {
						return $linkNames[$folder.'/'.$mdName]->nodeId;
					}
				} else {
					return $linkNames[$mdName]->nodeId;	
				}

			} else if($mdName[0] === '/') {
				$mdName = substr($mdName, 1);	
			} else {
					
				$mdLink = $nodeIds[$viewNid]->mdLink;

				$folder = substr($mdLink, 0, strrpos($mdLink, '/'));

				if($folder != '') {


					if(array_key_exists($folder.'/'.$mdName, $linkNames)) {
						return $linkNames[$folder.'/'.$mdName]->nodeId;
					}
				} else {
					return $linkNames[$mdName]->nodeId;	
				}
			}

			if(array_key_exists($mdName, $linkNames)) {
				return $linkNames[$mdName]->nodeId;
			}
		}
	}

	return NULL;
	
	
}


function mkdoc_nid_preprocess_node() {

}

