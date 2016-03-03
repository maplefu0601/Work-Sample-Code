
<?php

/**
 * mkdoc_book_module: a module to process markdown book from drupal 
 * 
 * author: Raymond Fu
 * date: Feb 3, 2016
 **/

$GLOBALS['dataFolder'] = "";
$GLOBALS['bookNodeId'] = 'new';
$GLOBALS['mapMkdoc'] = array();

/**
 * mkdoc_book_nodeapi: an event hook when page's content was modified
 * param node: page node
 * param op: operation on the page
 * author: Raymond Fu
 * date: Feb 13, 2016
 **/

function mkdoc_book_nodeapi(&$node, $op, $teaser = NULL, $page = NULL) {
	
	switch($op) {
		case 'presave':
	
			if(!property_exists($node, 'nid')) {
				break;	
			}
			$viewNid = $node->nid;
			$bookId = mkdoc_nid_getCurrentBookId($viewNid);
			if(!$bookId) {
				break;	
			}
			$content = $node->body;
			$bookValue = mkdoc_book_getBookFolder($bookId);
			//get git repository url
			$bookFolder = $bookValue['bookfolder'];
			$gitRepoUrl = $bookValue['repourl'];
			//var_dump($viewNid.'---bookid========'.$bookId);
			$mkdoc = MkDoc::getInstance();
			$datamk = $mkdoc->getMkdocsFromDb($bookId);

			$linkNames = $datamk->pagesByLinkName;
			$nodeIds = $datamk->pagesByNodeId;
			$mdLink = $nodeIds[$viewNid]->mdLink;

			if(is_string($mdLink)) {
				updateMdContent($mdLink, $content, $bookFolder, $gitRepoUrl);
			}
			break;

			case 'update':	//update the content of page
				break;

			case 'delete':	//delete a page
				break;

			case 'insert':	//insert a new page
				break;

			case 'alter':	//$node->content array has been rendered
				break;

			case 'view':	

				$viewNid = $node->nid;
				//$bookId = $node->book['bid'];
				//if(!$bookId) {
				//	break;	
				//}

		//		mkdoc_book_getBookOutline($bookId);

				break;
	}
}

function mkdoc_book_form_node_delete_confirm_alter(&$form, &$form_state) {
	//dsm('=============mkdoc_book_form_node_delete_confirm_alter');
	//dsm($form);
	//dsm($form_state);
	////$form['actions']['submit']['#submit'][] = 'mkdoc_book_deletePage';
	////$form['#submit'][] = 'mkdoc_book_deletePage';
	//dsm('=end============mkdoc_book_form_node_delete_confirm_alter');
}

/**
 * mkdoc_book_deletePage: processing deleting a page
 * param form: form from drupal
 * param for_state:
 * author: Raymond Fu
 * date: Feb 27, 2016
 **/
function mkdoc_book_deletePage(&$form, $form_state) {
	
	if($form_state['submitted']) {
		$nodeId = $form_state['values']['nid'];

		$node = $form['#parameters'][2];
		$nodeId = $node->nid;
		$bookId = $node->book['bid'];

		mkdoc_book_deletePageImp($bookId, $nodeId);
	}

}

function mkdoc_book_deletePageImp($bookId, $nodeId) {
	

	$mkdoc = mkdoc_book_getMkDoc($bookId);

	$bookValue = mkdoc_book_getBookFolder($bookId);
	$bookFolder = $bookValue['bookfolder'];
	$gitRepoUrl = $bookValue['repourl'];

	$nodeIds = $mkdoc->pagesByNodeId;

	if(array_key_exists($nodeId, $nodeIds)) {
		$mdName = $nodeIds[$nodeId]->mdLink;

		$baseFolder = getcwd().'/files/gdc-docs/gitdata/';
		$fileName = $baseFolder.$bookFolder.'/docs/'.$mdName;


		if(file_exists($fileName)) {
			unlink($fileName);	

		}
		//remove nodeid from mkdoc, and re-save it
		unset($nodeIds[$nodeId]);

		$linkNames = $mkdoc->pagesByLinkName;
		if(array_key_exists($mdName, $linkNames)) {
			unset($linkNames[$mdName]);	
		}

		$mkdoc->pagesByNodeId = $nodeIds;
		$mkdoc->pagesByLinkName = $linkNames;

		$mkDoc = MkDoc::getInstance();
		$mkDoc->setMkdocsToDb($bookId, $mkdoc, $bookFolder, $gitRepoUrl);

		mkdoc_book_getBookOutline($bookId);
	}

	
}
/**
 * mkdoc_book_changePageOutline: active the event when user changing the outline of a book
 * param form:
 * param form_state:
 * author: Raymond Fu
 * date: Feb 25, 2016
 **/
function mkdoc_book_changePageOutline(&$form, $form_state) {
	
	if($form_state['submitted']) {
		$nodeBook = $form_state['values']['book'];

		$bookId = $nodeBook['bid'];
		mkdoc_book_getBookOutline($bookId);
	}

}

function mkdoc_book_changeBook(&$form, $form_state) {
	
	if($form_state['submitted']) {
		$nodeBook = $form['#node']->book;

		mkdoc_book_getBookOutline($nodeBook['bid']);
	}

}

function mkdoc_book_form_alter(&$form, $form_state, $form_id) {
	


	switch($form_id) {
		case 'book_outline_form':
			$form['#submit'][] = 'mkdoc_book_changePageOutline';
			break;

		case 'node_delete_confirm':
			$form['#submit'][] = 'mkdoc_book_deletePage';
			break;

		case 'book_admin_edit':
			$form['#submit'][] = 'mkdoc_book_changeBook';
			break;
	}


}
/**
 * mkdoc_book_getBookOutline: the book outline frm a specific book 
 * param bookId: the node id of a book
 * return:
 * author: Raymond Fu
 * date: Feb 25,2016
 **/
function mkdoc_book_getBookOutline($bookId) {
	

	$nodeBook = node_load($bookId);
	$menuName = $nodeBook->book['menu_name'];


	$bookValue = mkdoc_book_getBookFolder($bookId);
	$bookFolder = $bookValue['bookfolder'];
	$gitRepoUrl = $bookValue['repourl'];

	$bookStru = menu_tree_all_data($menuName);
	if($bookStru) {

		$mkdoc = MkDoc::getInstance();
		$datamk = $mkdoc->getMkdocsFromDb($bookId);

		
		$yamlObj = array();
		//add those contents other than pages to yaml object
		$others = $datamk->contentsBesidesPage;
		foreach($others as $name => $value) {
			$yamlObj[$name] = $value;	
		}
		
		$baseFolder = getcwd().'/files/gdc-docs/gitdata/';
		$bookFolder = $baseFolder.$bookFolder.'/docs/';

//		mkdoc_book_removeAllFiles($bookFolder);

		$data = array();
		$newMkdoc = array('pagesByNodeId' => array(), 'pagesByLinkName' => array());
		$chapterMap = array();
		$ret = mkdoc_book_fetchBookObject(0, $bookStru, $data, $datamk->pagesByNodeId, $bookFolder, $bookFolder, '', $newMkdoc, true, $chapterMap);
		
		//dsm($chapterMap);
		$ret = mkdoc_book_againFetchBookObject($ret, $chapterMap, $newMkdoc);


		$datamk->pagesByNodeId = $newMkdoc['pagesByNodeId'];
		$datamk->pagesByLinkName = $newMkdoc['pagesByLinkName'];

		$bookFolder = $bookValue['bookfolder'];

		$mkdoc->setMkdocsToDb($bookId, $datamk, $bookFolder, $gitRepoUrl);



		foreach($ret as $name => $value) {
			$yamlObj[$name] = $value;	
		}
		mkdoc_book_rebuildFile($yamlObj, $bookId, $datamk);
	}

}
/**
 * mkdoc_book_setMkDoc: set data of markdown document
 * param bookId: the node id of book
 * param mkdata: the data need to save
 * author: Raymond Fu
 * date: Feb 15, 2016
 **/
function mkdoc_book_setMkDoc($bookId, $mkdata) {
	$bookValue = mkdoc_book_getBookFolder($bookId);
	$bookFolder = $bookValue['bookfolder'];
	$gitRepoUrl = $bookValue['repourl'];
	
	$mkdoc = MkDoc::getInstance();
	$mkdoc->setMkdocsToDb($bookId, $mkdata, $bookFolder, $gitRepoUrl);
	
}
/**
 * mkdoc_book_getMkDoc: get markdown data
 * param bookId: the node id of a book
 * return: 
 * author: Raymond Fu
 * date: Feb 11,2016
 **/
function mkdoc_book_getMkDoc($bookId) {
	$mkdoc = MkDoc::getInstance();
	$datamk = $mkdoc->getMkdocsFromDb($bookId);
	
	return $datamk;
}

//reconstruct the files based on book outline
//files maybe removed or moved
function mkdoc_book_rebuildFile($yamlObj, $bookId, $mkdoc) {
	
	$bookValue = mkdoc_book_getBookFolder($bookId);
	//get git repository url
	$bookFolder = $bookValue['bookfolder'];
	$gitRepoUrl = $bookValue['repourl'];
	
	mkdoc_book_rebuildFileImp($yamlObj, $mkdoc);

	$yamlContent = json_encode($yamlObj);

	mkdoc_book_updateBook($yamlContent, $bookFolder, $gitRepoUrl);
}

function mkdoc_book_rebuildFileImp($yamlObj, $mkdoc) {
	
	foreach($yamlObj as $name => $obj) {
		
	}
}
/**
 * mkdoc_book_removeAllFiles: to remove all files and sub-folders under a folder
 * param folder: the folder need to remove
 * return:
 * author: Raymond Fu
 * date: Feb 8, 2016
 **/
function mkdoc_book_removeAllFiles($folder) {

	//dsm('remove all files...'.$folder);
	if(is_dir($folder)) {
		array_map(function($value) {
			mkdoc_book_removeAllFiles($value);
			rmdir($value);
		}, glob($folder.'/*', GLOB_ONLYDIR));	
	}
	array_map('unlink', glob($folder."/*"));

}

//just in case some chapter names are not changed for the first time
function mkdoc_book_againFetchBookObject(&$dataRet, $chapterMap, &$mkdoc) {

	foreach($dataRet as $name => $value) {
		
		if(is_array($value)) {
			$dataRet[$name] = mkdoc_book_againFetchBookObject($value, $chapterMap, $mkdoc);	
		} else {
			if(isMdLink($value)) {
				if(strpos($value, '/')) {
					$chapterFromMdLink = substr($value, 0, strpos($value, '/'));
					if(array_key_exists($chapterFromMdLink, $chapterMap)) {
						$oldLink = $value;



						$oldLinkNameObj = $mkdoc['pagesByLinkName'][$oldLink];
						$oldNodeObj = $mkdoc['pagesByNodeId'][$oldLinkNameObj->nodeId];
						$newLink = $chapterMap[$chapterFromMdLink].substr($value, strpos($value, '/'));
						$dataRet[$name] = $newLink;



						$oldLinkNameObj->mdLink = $newLink;
						$oldNodeObj->mdLink = $newLink;
						unset($mkdoc['pagesByLinkName'][$oldLink]);
						//unset($mkdoc['pagesByNodeId'][$oldLinkNameObj->nodeId]);

						$mkdoc['pagesByLinkName'][$newLink] = $oldLinkNameObj;
						$mkdoc['pagesByNodeId'][$oldLinkNameObj->nodeId] = $oldLinkNameObj;
					}
				}
			}
		}
	}
	return $dataRet;
}
/**
 * mkdoc_book_fetchBookObject: to get all information about a book
 * param parentId: node id of parent
 * param dataRet: the data to store
 * param nodeIds: the array stored all node ids
 * param bookFolder: the folder the store the book
 * author: Raymond Fu
 * date: Feb 26, 2016
 **/
function mkdoc_book_fetchBookObject($parentId, $bookStructure, &$dataRet, $nodeIds, $baseFolder, $bookFolder, $currentFolder, &$newDoc, $sameChapter, &$chapterMap) {


	$originalFolder = $currentFolder;
	foreach($bookStructure as $name => $obj) {
	
		//dsm('========='.$name);
		//dsm($obj['below']);
		if($obj['below']) {
			//dsm($obj['link']);
			if($obj['link']['plid'] == 0) {
				$nodeId = substr($obj['link']['link_path'], strpos($obj['link']['link_path'], '/') + 1);
				$dataRet['site_name'] = $obj['link']['title'];
				$dataRet['pages'] = array(mkdoc_book_fetchBookObject($nodeId, $obj['below'], $dataRet['pages'], $nodeIds, $baseFolder, $bookFolder, $currentFolder, $newDoc, $sameChapter, $chapterMap));	
			} else {
				//dsm($obj['link']['title']);
				$chapter = $obj['link']['title'];
				if(!is_dir($bookFolder.$chapter)) {
					//dsm($bookFolder.$chapter);
					//mkdir($bookFolder.$chapter, 0755, true);	
				}

				$currentFolder = $chapter.'/';
				$title = $obj['link']['title'];
				$dataRet[$title] = array();
				$nodeId = substr($obj['link']['link_path'], strpos($obj['link']['link_path'], '/') + 1);
				if(array_key_exists($nodeId, $nodeIds)) {
					$nodeObj = $nodeIds[$nodeId];
					$oldChapter = $nodeObj->title;//substr($nodeObj->mdLink, 0, strrpos($nodeObj->mdLink, '/'));
					$sameChapter = $oldChapter === $chapter;
					if(!$sameChapter) {
						$chapterMap[$oldChapter] = $chapter;
						if(file_exists($bookFolder.$oldChapter)) {
							rename($bookFolder.$oldChapter, $bookFolder.$chapter);
						}
					}
					//dsm('renamed folder from '.$oldChapter.' to  '.$chapter);
				} else {
					mkdir($bookFolder.$chapter, 0755, true);
					//dsm('created new folder '.$bookFolder.$chapter);
				}
				$newData = new stdClass();
				$newData->nodeId = $nodeId;
				$newData->parentId = $nodeIds[$nodeId]->parentId;
				$newData->title = $title;
				$newData->mdLink = $nodeIds[$nodeId]->mdLink;
				$newDoc['pagesByNodeId'][$nodeId] = $newData;
				$newDoc['pagesByLinkName'][$title] = $newData;
				$dataRet[$title] = array(mkdoc_book_fetchBookObject($nodeId, $obj['below'], $dataRet[$title], $nodeIds, $baseFolder, $bookFolder.$chapter, $currentFolder, $newDoc, $sameChapter, $chapterMap));	
			}
		} else {
			
			if($obj['link']) {
				
				$nodeId = substr($obj['link']['link_path'], strpos($obj['link']['link_path'], '/') + 1);
				$title = $obj['link']['title'];
				//dsm($nodeId);
				//dsm($nodeIds);
				if($nodeId) {
					
					$node = node_load($nodeId);
					if(array_key_exists($nodeId, $nodeIds)) {
						$nodeObj = $nodeIds[$nodeId];
						$linkName = $nodeObj->mdLink;

						//if md link exists already, just replace with the new title
						$name = $nodeObj->mdLink;
						$dataRet[$title] = $name;

						if(strpos($name, '/')) {//make sure has parent chapter
							
							$chapterFromMdLink = substr($name, 0, strpos($name, '/'));
							if(array_key_exists($chapterFromMdLink, $chapterMap)) {//chapter changed
								$name = substr($name, strpos($name, '/'));
								$linkName = $chapterMap[$chapterFromMdLink].$name;
								$dataRet[$title] = $linkName;
								
							}
						}
						
					} else {
						$linkName = strtolower(str_replace(' ', '-', $title)).'.md';
						$newFile = $bookFolder.'/'.$linkName;
						$linkName = $currentFolder.$linkName;
						//dsm('creating new file '.$newFile);
						file_put_contents($newFile, $node->body);
						$dataRet[$title] = $linkName;
					}
					$newData = new stdClass();
					$newData->nodeId = $nodeId;
					$newData->parentId = $parentId;//$nodeIds[$nodeId]->parentId;
					$newData->title = $title;
					$newData->mdLink = $linkName; 
					$newDoc['pagesByNodeId'][$nodeId] = $newData;
					$newDoc['pagesByLinkName'][$linkName] = $newData;

					continue;	
				}
			}	
		}
	}
	$currentFolder = $originalFolder;
	
	return $dataRet;
}

/**
 * mkdoc_book_updateBook: to update book's content
 * param folder: the folder that stores the book
 * param gitRepoUrl: url of git repository
 * author: Raymond Fu
 * date: Feb 10, 2016
 **/
function mkdoc_book_updateBook($yamlContent, $folder, $gitRepoUrl) {
	$url = 'http://54.69.251.157:6600/updateBook';
	$data = array('name' => 'mkdocs.yml', 'content' => $yamlContent, 'folder' => $folder, 'repourl' => $gitRepoUrl);
	$fieldsData = json_encode($data);
	$header = "Content-type: application/x-www-form-urlencoded\r\n" . "Content-Length: " . strlen($fieldsData) . "\r\n";
	$response = drupal_http_request($url, $header,'POST', $fieldsData);



}
/**
 * updateMdContent: to update the content of a page
 * param name: the name of page
 * param folder: the folder to store file
 * param gitRepoUrl: the url of git repository
 * author: Raymond Fu
 * date: Feb 6, 2016
 **/
function updateMdContent($name, $content, $folder, $gitRepoUrl) {
	if(empty($name)) {
		return;	
	}
	$url = 'http://54.69.251.157:6600/updateMdContent';
	$data = array('name' => $name, 'content' => $content, 'folder' => $folder, 'repourl' => $gitRepoUrl);
	$fieldsData = json_encode($data);
	$header = "Content-type: application/x-www-form-urlencoded\r\n" . "Content-Length: " . strlen($fieldsData) . "\r\n";
	$response = drupal_http_request($url, $header,'POST', $fieldsData);
	////dsm($response);


}
/**
 * mkdoc_book_menu: event hook for http request
 * param null
 * author: Raymond Fu
 * date: Jan 28, 2016
 **/
function mkdoc_book_menu()
{
	$items = array();
	
	$items['mkdoc_book/new'] = array(
		     'title' => 'gdc book',
			 'page callback' => 'mkdoc_book_new',
			 'access arguments' => array(true),
			 'access callback' => TRUE,
			 'type' => MENU_CALLBACK
			 );
	

	return $items;

}
/**
 * mkdoc_book_new: the callback function for http request
 * author: Raymond Fu
 * date: Jan 28, 2016
 **/
function mkdoc_book_new() {
	//pass the location of the json file, $_POST will have the value
	var_dump($_POST);
	$GLOBALS["dataFolder"] = $_POST["datafolder"]."/docs/";

	$name = $_POST['name'];
	$bookFolder = $_POST['bookfolder'];	//github folder name
	$dataFolder = $_POST['datafolder']."/docs/";
	$bookId = mkdoc_book_exists($bookFolder);
	
	if($bookId) {
		//update current book
		mkdoc_book_refreshBookContent($bookId, $dataFolder, $name);	
//		mkdoc_book_updateBookContent($bookId, $dataFolder);	
	} else {
		//create a book node
		mkdoc_book_createNewBook($name, $bookFolder);
	}
	
    //foreach page
		//create a page node
	return "Im here----".$_POST['name'];	

}

function mkdoc_book_getBookFolder($bookId) {

	$tableName = 'mkdocids';
	if(db_table_exists($tableName)) {
		$query = "select bookfolder,repourl from {$tableName} where bookid=%d";
		$ret = db_query($query, $bookId);

		if(count($ret) > 0) {
			$data = db_fetch_array($ret);

			if($data != FALSE) {
				return array('bookfolder' => $data['bookfolder'], 'repourl' => $data['repourl']);	
			}
		}
	}
	return false;	
}

/**
 * mkdoc_book_exists: to check drupal book is exist or not
 * param bookFolder: the folder to store books
 * author: Raymond Fu
 * date: Feb 3, 2016
 **/
function mkdoc_book_exists($bookFolder) {


	$tableName = 'mkdocids';
	if(db_table_exists($tableName)) {
		$query = "select bookid from {$tableName} where bookfolder='%s'";
		$ret = db_query($query, $bookFolder);

		if(count($ret) > 0) {
			$data = db_fetch_array($ret);

			if($data) {

				$bookId = $data['bookid'];
				$nodeBook = node_load($bookId);
				if($nodeBook) {
					return $bookId;	
				} else {
					$query = "delete from {$tableName} where bookid=%d";
					$ret = db_query($query, $bookId);
				}
			}
		}
	}
	return false;	
}

class MkDoc
{
	public $siteName;
	public $bookId;
	public $bookFolder;
	public $gitRepoUrl;
	public $pagesByNodeId = array();
	public $pagesByLinkName = array();
	public $contentsBesidesPage = array();

	private static $instance = NULL;

	public static function getInstance() {
		if(is_null(self::$instance)) {
			self::$instance = new self();	
		}

		return self::$instance;
	}

	public function getNodeIds() {
		return $this->pagesByNodeId;	
	}

	public function getLinkNames() {
		return $this->pagesByLinkName;	
	}

	public function savePageByNodeId($nodeId, $value) {
		
		$this->pagesByNodeId[$nodeId] = $value;
	}

	public function getPageByNodeId($nodeId) {
		return $this->pagesByNodeId[$nodeId];	
	}

	public function savePageByLinkName($name, $value) {
	
		$this->pagesByLinkName[$name] = $value;
	}

	public function getPageByLinkName($name) {
		return $this->pagesByLinkName[$name];	
	}

	public function getMkdocsFromDb($bookId) {
		$tableName = 'mkdocids';
		if(db_table_exists($tableName)) {
			$query = "select doc from {$tableName} where bookid=%d";
			$ret = db_query($query, $bookId);

			if(count($ret) > 0) {
				$data = db_fetch_array($ret);

				if($data != FALSE) {
					return unserialize($data['doc']);	
				}
			}
		}
	}

	public function setMkdocsToDb($bookId, $value, $bookFolder, $repoUrl) {
		$tableName = 'mkdocids';
		if(!db_table_exists($tableName)) {
			$this->createMkdocTable($tableName);
		}

		$data = serialize(array($bookId => ($value)));


		$query = "insert into {$tableName} values(%d, '%s', '%s', '%s') on duplicate key update doc=values(doc),bookfolder=values(bookfolder),repourl=values(repourl)";
		$ret = db_query($query, $bookId, serialize($value), $bookFolder, $repoUrl);



	}

	public function getNodeIdsFromDb($bookId) {
		
	}

	public function setNodeIdsToDb($bookId, $value) {
		
	}

	private function createMkdocTable($tableName) {


		$schema[$table] = array(
			'fields' => array(
				'bookid' => array('type' => 'int', 'not null' => TRUE),
				'doc' => array('type' => 'text'),
				'bookfolder' => array('type' => 'text'),
				'repourl' => array('type' => 'text'),
			),
//			'primary key' => array('bookid'),
		);
$statements = db_create_table_sql($tableName, $schema[$table]);
foreach($statements as $statement) {
	//var_dump($statement);	
}
//var_dump( $statements);
//echo '<==========>';
$ret = array();
db_create_table($ret, $tableName, $schema[$table]);	
//var_dump($ret);

	}
}

function mkdoc_book_updateBookContent($bookId, $dataFolder) {

	$tableName = 'mkdocids';
	$query = "select doc from {$tableName} where bookid=%d";
	$ret = db_query($query, $bookId);

	if(count($ret) > 0) {
		$data = db_fetch_array($ret);

		if($data != FALSE) {
			$mkdoc = unserialize($data['doc']);

			$linkNames = $mkdoc->pagesByLinkName;

			foreach($linkNames as $name => $val) {
				//get md file content
				//overwrite page content with node id

				$file = file_get_contents($dataFolder.$name);
				$node = node_load($val->nodeId);
				$node->body = $file;

				node_save($node);
			}
		}
	}
	
}

/**
 * mkdoc_book_refreshBookContent: to refresh or update the content of book
 * param bookId: the node id of book
 * param dataFolder: the folder to store the books
 * author: Raymond Fu
 * date: Feb 18, 2016
 **/
function mkdoc_book_refreshBookContent($bookId, $dataFolder, $yamlName) {
	
	
	//travel yaml file all the time, even if the file structure was not changed	
	$tableName = 'mkdocids';
	$query = "select doc from {$tableName} where bookid=%d";
	$ret = db_query($query, $bookId);

	if(count($ret) > 0) {
		$data = db_fetch_array($ret);

		if($data != FALSE) {
			$mkdoc = unserialize($data['doc']);

			$linkNames = $mkdoc->pagesByLinkName;

			$yamlData = mkdoc_book_getYaml($yamlName);

			$bookName = $yamlData['site_name'];
			mkdoc_book_changeBookTitle($bookId, $bookName);
			$mkdoc->siteName = $bookName;
			$yamlPageContent = json_encode($yamlData['pages']);
			$yamlData = json_decode($yamlPageContent, true);

			mkdoc_book_removeMkdocObjPages($mkdoc, $yamlData);

			mkdoc_book_parseYaml($bookId, $yamlData, NULL, $mkdoc);
			
			$bookFolder = $_POST['bookfolder'];
			$repoUrl = $_POST['gitrepourl'];

			$mkdoc->setMkdocsToDb($bookId,$mkdoc, $bookFolder, $repoUrl);

		}
	}
	
}

function mkdoc_book_changeBookTitle($bookId, $title) {
	
	$node = node_load($bookId);
	if($node) {
		$node->title = $title;

		node_save($node);
	}
}

function mkdoc_book_getYaml($name) {

	$file = file_get_contents($name);
	$data = json_decode(($file), true);

	return $data;
}

function mkdoc_book_removeMkdocObjPages(&$mkdoc, $yamlPages) {
	
	$linkNames = $mkdoc->pagesByLinkName;
	$nodeIds = $mkdoc->pagesByNodeId;
	$yamlStr = json_encode($yamlPages, JSON_UNESCAPED_SLASHES);



	foreach($linkNames as $name => $node) {
		

		$nodeId = $node->nodeId;

		if(strpos($yamlStr, $name) === false) {//not found, remove it
			unset($linkNames[$name]);
			unset($nodeIds[$nodeId]);
			mkdoc_book_deleteNode($nodeId);


		}
	}

	$mkdoc->pagesByLinkName = $linkNames;
	$mkdoc->pagesByNodeId = $nodeIds;

}

function mkdoc_book_deleteNode($nodeId) {
	
	global $user;
	$currentUser = $user;
	$user = user_load(1);

	node_delete($nodeId);

	$user = $currentUser;

}

function mkdoc_book_parseYaml($bookNodeId, $obj, $parentId, &$mkdoc) {


	foreach($obj as $chapter => $chapterValue) {


		if(!is_array($chapterValue)) {

			if(is_string($chapterValue)) {
				$saveObj = new stdClass();
				$saveObj->parentId = $parentId;

				if(isMdLink($chapterValue)) {
					$folder = $GLOBALS["dataFolder"].$chapterValue;

					$linkNames = $mkdoc->pagesByLinkName;


					if(array_key_exists($chapterValue, $linkNames)) {
						$nodeId = $linkNames[$chapterValue]->nodeId;
						$parentId1 = $linkNames[$chapterValue]->parentId;
						if(strrpos($chapterValue, '/') == FALSE) {
							$parentId1 = $bookNodeId;	
						}
					

						refreshPageNode($nodeId, $parentId1, $chapter, $chapterValue, $folder);	
						
						$nodeObj = $linkNames[$chapterValue];
						$nodeObj->title = $chapter;
						$nodeObj->parentId = $parentId1;

						$mkdoc->savePageByNodeId($nodeId, $nodeObj);
						$mkdoc->savePageByLinkName($chapter, $nodeObj);
					} else {
						if(strrpos($chapterValue, '/') == FALSE) {
							$parentId1 = $bookNodeId;	
						} else {
							$parentId1 = $parentId;	
						}
						$nodeId = createPageNode($bookNodeId, $parentId1, $chapter, $chapterValue, $folder);
						$newObj = new stdClass();
						$newObj->nodeId = $nodeId;
						$newObj->parentId = $parentId1;
						$newObj->title = $chapter;
						$newObj->mdLink = $chapterValue;
						$mkdoc->savePageByNodeId($nodeId, $newObj);
						$mkdoc->savePageByLinkName($chapter, $newObj);
						
					}

				} else {

					$linkNames = $mkdoc->pagesByLinkName;

					if(array_key_exists($chapterValue, $linkNames)) {
						$nodeObj = $linkNames[$chapterValue];
						$nodeObj->title = $chapter;
						$nodeId = $nodeObj->nodeId;
						$nodeObj->parentId = $parentId;

						refreshPageNodeEx($nodeId, $parentId, $chapter, $chapter);
						
						$mkdoc->savePageByNodeId($nodeId, $nodeObj);
						$mkdoc->savePageByLinkName($chapter, $nodeObj);

					} else {
						$nodeId = createPageNodeEx($bookNodeId, $parentId, $chapter, $chapter);	

						$newObj = new stdClass();
						$newObj->nodeId = $nodeId;
						$newObj->parentId = $parentId1;
						$newObj->title = $chapter;
						$newObj->mdLink = $chapterValue;
						
						$mkdoc->savePageByNodeId($nodeId, $newObj);
						$mkdoc->savePageByLinkName($chapter, $newObj);
					}
				}

					
			} else {
				
				$attr = is_object($chapterValue) ? get_object_vars($chapterValue) : $chapterValue;

				foreach($attr as $key => $val) {
				
					
					if(is_array($val)) {
						$saveObj = new stdClass();
						$saveObj->parentId = $parentId;
						
						if(array_key_exists($key, $mkdoc->pagesByLinkName)) {
							
							$linkNames = $mkdoc->pagesByLinkName;
							$parentId = $linkNames[$key]->nodeId;
							mkdoc_book_parseYaml($bookNodeId, $val, $parentId, $mkdoc);
							
						} else {
							$parentId = createPageNodeEx($bookNodeId,$parentId, $key, $key);
							$saveObj->nodeId = $parentId;
							$saveObj->mdLink = $val;
							$saveObj->title = $key;
							$mkdoc->savePageByNodeId($parentId, $saveObj);
							$mkdoc->savePageByLinkName($val, $saveObj);

							mkdoc_book_parseYaml($bookNodeId, $val, $parentId, $mkdoc);	
						}
					} else {

					
						$saveObj = new stdClass();
						$saveObj->parentId = $parentId;

						if(isMdLink($val)) {
							$folder = $GLOBALS["dataFolder"].$val;
			
							$linkNames = $mkdoc->pagesByLinkName;
		

							if(array_key_exists($val, $linkNames)) {
								$nodeId = $linkNames[$val]->nodeId;
								$nodeObj = $linkNames[$val];
								$nodeObj->parentId = $parentId;
								$nodeObj->title = $key;
								$nodeObj->mdLink = $val;

								refreshPageNode($nodeId, $parentId, $key, $val, $folder);

								$mkdoc->savePageByNodeId($nodeId, $nodeObj);
								$mkdoc->savePageByLinkName($key, $nodeObj);
									
							} else {
								$nodeId = createPageNode($bookNodeId, $parentId, $key, $val, $folder);	
								
								$newObj = new stdClass();
								$newObj->nodeId = $nodeId;
								$newObj->parentId = $parentId1;
								$newObj->title = $key;
								$newObj->mdLink = $val;
								
								$mkdoc->savePageByNodeId($nodeId, $newObj);
								$mkdoc->savePageByLinkName($chapter, $newObj);
							}

						} else {

							$linkNames = $mkdoc->pagesByLinkName;

							if(array_key_exists($val, $linkNames)) {
								$nodeId = $linkNames[$val]->nodeId;
								refreshPageNodeEx($nodeId, $parentId, $key, $key);
								
								$nodeObj = $linkNames[$val];
								$nodeObj->parentId = $parentId;
								$nodeObj->title = $key;
								$nodeObj->mdLink = $val;

								$mkdoc->savePageByNodeId($nodeId, $nodeObj);
								$mkdoc->savePageByLinkName($key, $nodeObj);
									
							} else {
								$nodeId = createPageNodeEx($bookNodeId, $parentId, $key, $key);	
								
								$newObj = new stdClass();
								$newObj->nodeId = $nodeId;
								$newObj->parentId = $parentId1;
								$newObj->title = $chapter;
								$newObj->mdLink = $chapterValue;
								
								$mkdoc->savePageByNodeId($nodeId, $newObj);
								$mkdoc->savePageByLinkName($chapter, $newObj);
							}
						}

						//$saveObj->nodeId = $nodeId;
						//$saveObj->title = $key;
						//$saveObj->mdLink = $val;
						//$mkdoc->savePageByNodeId($nodeId, $saveObj);
						//$mkdoc->savePageByLinkName($val, $saveObj);
					}
				}
			}


		} else {
			$saveObj = new stdClass();
			$saveObj->parentId = $parentId;
			
			if(array_key_exists($chapter, $mkdoc->pagesByLinkName)) {
				
				$linkNames = $mkdoc->pagesByLinkName;
				$parentId = $linkNames[$chapter]->nodeId;
				mkdoc_book_parseYaml($bookNodeId, $chapterValue, $parentId, $mkdoc);
				
			} else {
		
				if(!is_int($chapter)) {//ignore the array numbers
					$newNodeId = createPageNodeEx($bookNodeId,$parentId, $chapter, $chapter);
	
					$saveObj->nodeId = $newNodeId;
					$saveObj->title = $chapter;
					$mkdoc->savePageByNodeId($newNodeId, $saveObj);
					
					mkdoc_book_parseYaml($bookNodeId, $chapterValue, $newNodeId, $mkdoc);
				} else {
					mkdoc_book_parseYaml($bookNodeId, $chapterValue, $parentId, $mkdoc);
				}
			}

			
		}
		

			
	}
	
}

//old version
function mkdoc_book_parseYamlEx($bookNodeId, $obj, $parentId, &$mkdoc) {

	foreach($obj as $chapter => $chapterValue) {

		if(!is_array($chapterValue)) {

			if(is_string($chapterValue)) {
				$saveObj = new stdClass();
				$saveObj->parentId = $parentId;

				if(isMdLink($chapterValue)) {
					$folder = $GLOBALS["dataFolder"].$chapterValue;
		
					$linkNames = $mkdoc->pagesByLinkName;
	

					if(array_key_exists($chapterValue, $linkNames)) {
						$nodeId = $linkNames[$chapterValue]->nodeId;
						$parentId1 = $linkNames[$chapterValue]->parentId;
						if(strrpos($chapterValue, '/') == FALSE) {
							$parentId1 = $bookNodeId;	
						}
					

						refreshPageNode($nodeId, $parentId1, $chapter, $chapterValue, $folder);	
					} else {
						if(strrpos($chapterValue, '/') == FALSE) {
							$parentId1 = $bookNodeId;	
						} else {
							$parentId1 = $parentId;	
						}
						$nodeId = createPageNode($bookNodeId, $parentId1, $chapter, $chapterValue, $folder);
					}

				} else {

					$linkNames = $mkdoc->pagesByLinkName;

					if(array_key_exists($chapterValue, $linkNames)) {
						$nodeId = $linkNames[$chapterValue]->nodeId;
						refreshPageNodeEx($nodeId, $parentId, $chapter, $chapter);
					} else {
						$nodeId = createPageNodeEx($bookNodeId, $parentId, $chapter, $chapter);	
					}
				}

				$saveObj->nodeId = $nodeId;
				$saveObj->title = $chapter;
				$saveObj->mdLink = $chapterValue;
				$mkdoc->savePageByNodeId($nodeId, $saveObj);
				$mkdoc->savePageByLinkName($chapterValue, $saveObj);
					
			} else {
				
				$attr = is_object($chapterValue) ? get_object_vars($chapterValue) : $chapterValue;

				foreach($attr as $key => $val) {

					
					if(is_array($val)) {
						$saveObj = new stdClass();
						$saveObj->parentId = $parentId;
						
						if(array_key_exists($key, $mkdoc->pagesByLinkName)) {
							
							$linkNames = $mkdoc->pagesByLinkName;
							$parentId = $linkNames[$key]->nodeId;
							mkdoc_book_parseYaml($bookNodeId, $val, $parentId, $mkdoc);
							
						} else {
							$parentId = createPageNodeEx($bookNodeId,$parentId, $key, $key);
							$saveObj->nodeId = $parentId;
							$saveObj->mdLink = $val;
							$saveObj->title = $key;
							$mkdoc->savePageByNodeId($parentId, $saveObj);

							mkdoc_book_parseYaml($bookNodeId, $val, $parentId, $mkdoc);	
						}
					} else {

					
						$saveObj = new stdClass();
						$saveObj->parentId = $parentId;

						if(isMdLink($val)) {
							$folder = $GLOBALS["dataFolder"].$val;

							$linkNames = $mkdoc->pagesByLinkName;


							if(array_key_exists($val, $linkNames)) {
								$nodeId = $linkNames[$val]->nodeId;
								refreshPageNode($nodeId, $parentId, $key, $val, $folder);	
							} else {
								$nodeId = createPageNode($bookNodeId, $parentId, $key, $val, $folder);	
							}

						} else {

							$linkNames = $mkdoc->pagesByLinkName;

							if(array_key_exists($val, $linkNames)) {
								$nodeId = $linkNames[$val]->nodeId;
								refreshPageNodeEx($nodeId, $parentId, $key, $key);
							} else {
								$nodeId = createPageNodeEx($bookNodeId, $parentId, $key, $key);	
							}
						}

						$saveObj->nodeId = $nodeId;
						$saveObj->title = $key;
						$saveObj->mdLink = $val;
						$mkdoc->savePageByNodeId($nodeId, $saveObj);
						$mkdoc->savePageByLinkName($val, $saveObj);
					}
				}
			}


		} else {
			$saveObj = new stdClass();
			$saveObj->parentId = $parentId;
			
			if(array_key_exists($chapter, $mkdoc->pagesByLinkName)) {
				
				$linkNames = $mkdoc->pagesByLinkName;
				$parentId = $linkNames[$chapter]->nodeId;
				mkdoc_book_parseYaml($bookNodeId, $chapterValue, $parentId, $mkdoc);
				
			} else {
		
				if(!is_int($chapter)) {//ignore the array numbers
					$newNodeId = createPageNodeEx($bookNodeId,$parentId, $chapter, $chapter);

					$saveObj->nodeId = $newNodeId;
					$saveObj->title = $chapter;
					$mkdoc->savePageByNodeId($newNodeId, $saveObj);
					
					mkdoc_book_parseYaml($bookNodeId, $chapterValue, $newNodeId, $mkdoc);
				} else {
					mkdoc_book_parseYaml($bookNodeId, $chapterValue, $parentId, $mkdoc);
				}
			}

			
		}
		

			
	}
	
}

/**
 * mkdoc_book_createNewBook: to create a new book
 * paran name: the name of the book
 * author: Raymond Fu
 * date: Feb 1, 2016
 **/
function mkdoc_book_createNewBook($name) {
	$file = file_get_contents($name);


	$data = json_decode(($file), true);
	
	$bookFolder = $_POST['bookfolder'];
	$repoUrl = $_POST['gitrepourl'];

	createBookNode($bookFolder, $repoUrl, $data);
}

/**
 * createBookNode: to create a new node
 * param bookFolder: the folder to store books
 * param repoUrl: the url of git repository
 * author: Raymond Fu
 * date: Feb 5, 2016
 **/
function createBookNode($bookFolder, $repoUrl, $data) {
	
	$node = new stdClass();
	$node->book = array('bid'=>'new');
	
	$node->name = $data['site_name']; 
	$node->title = $node->name; 
	//$node->body = json_encode($data['pages']); 
	$node->type = 'book';
	$node->created = time(); 
	$node->changed = $node->created; 
	$node->promote = 0; 
	$node->sticky = 0; 
	$node->format = 2;
	$node->status = 1;
	$node->language = 'en';

	node_save($node);
	$bookNodeId = $node->nid;

	mkdoc_book_saveBookFolderToDb($bookFolder, $repoUrl, $bookNodeId);

	$mkdoc = MkDoc::getInstance();
	$mkdoc->siteName = $node->name;
	$mkdoc->bookId = $bookNodeId;
	$mkdoc->gitRepoUrl = $repoUrl;
	$mkdoc->bookFolder = $bookFolder;

	$GLOBALS['bookNodeId'] = $bookNodeId;

	foreach($data as $name => $value) {
		if($name != 'pages') {
			$mkdoc->contentsBesidesPage[$name] = $value;	
		}
	}
	$yamlPageContent = json_encode($data['pages']);
	//createNewPage($bookNodeId, $yamlPageContent);
	createNewPageEx($bookNodeId, $bookFolder, $repoUrl, $yamlPageContent);
}

function mkdoc_book_saveBookFolderToDb($bookFolder, $repoUrl, $bookNodeId) {
	
}

/**
 * createBookNode: to create a new node
 * param bookFolder: the folder to store books
 * param repoUrl: the url of git repository
 * author: Raymond Fu
 * date: Feb 5, 2016
 **/
function createNewPageEx($bookNodeId, $bookFolder, $repoUrl, $yamlPageContent) {
	$yamlObj = json_decode($yamlPageContent);

	parseObject($bookNodeId, $yamlObj, NULL);

	$mkdoc = MkDoc::getInstance();
	$mkdoc->setMkdocsToDb($bookNodeId,$mkdoc, $bookFolder, $repoUrl);


	$datamk = $mkdoc->getMkdocsFromDb($bookNodeId);
	
	
}

function parseObject($bookNodeId, $obj, $parentId) {


	$mkdoc = MkDoc::getInstance();
	foreach($obj as $chapter => $chapterValue) {


		if(is_array($chapterValue)) {
			$saveObj = new stdClass();
			$saveObj->parentId = $parentId;
			
			$newNodeId = createPageNodeEx($bookNodeId,$parentId, $chapter, $chapter);
			$saveObj->nodeId = $newNodeId;
			$saveObj->title = $chapter;
			$mkdoc->savePageByNodeId($newNodeId, $saveObj);
			//$mkdoc->savePageByLinkName($chapter, $saveObj);
			
			//parseObject($bookNodeId, $chapterValue, $newNodeId);	
			parseObject($bookNodeId, $chapterValue, $parentId);	
		} else {
			if(is_string($chapterValue)) {

				if(strpos($chapterValue, '/') == FALSE) {

					$nodeParent = node_load($parentId);
					if($nodeParent) {
						$parentId = $nodeParent['book']->bid;	

					}
				}
				$saveObj = new stdClass();
				$saveObj->parentId = $parentId;

				if(isMdLink($chapterValue)) {
					$folder = $GLOBALS["dataFolder"].$chapterValue;


					$nodeId = createPageNode($bookNodeId, $parentId, $chapter, $chapterValue, $folder);	

				}
			
			} else {

				$attr = is_object($chapterValue) ? get_object_vars($chapterValue) : $chapterValue;

				foreach($attr as $key => $val) {
					
					if(is_array($val)) {
						$saveObj = new stdClass();
						$saveObj->parentId = $parentId;
						
						$parentId = createPageNodeEx($bookNodeId,$parentId, $key, $key);
						$saveObj->nodeId = $parentId;
						$saveObj->mdLink = $val;
						$saveObj->title = $key;
						$mkdoc->savePageByNodeId($parentId, $saveObj);
						$mkdoc->savePageByLinkName($key, $saveObj);

						parseObject($bookNodeId, $val, $parentId);	
					} else {

					
						$saveObj = new stdClass();
						$saveObj->parentId = $parentId;

						if(isMdLink($val)) {
				
							$folder = $GLOBALS["dataFolder"].$val;
	//		
							
							if(strpos($val, '/') == FALSE) {
	
								$nodeParent = node_load($parentId);
								if($nodeParent) {
									$parentId = $nodeParent->book['bid'];	

								}
							}


							$nodeId = createPageNode($bookNodeId, $parentId, $key, $val, $folder);	

						} else {

							$nodeId = createPageNodeEx($bookNodeId, $parentId, $key, $key);
						}

						$saveObj->nodeId = $nodeId;
						$saveObj->title = $key;
						$saveObj->mdLink = $val;
						$mkdoc->savePageByNodeId($nodeId, $saveObj);
						$mkdoc->savePageByLinkName($val, $saveObj);
					}
				}
			}
		}	
	}
	
}

/**
 * isMdLink: to check if is a qualified md file
 * author: Raymond Fu
 * date: Feb 2, 2016
 **/
function isMdLink($link) {
	return preg_match('/([^"]*\.md)/', $link) > 0;	
}

function getNodeId($matches) {

   $matches[0] = str_replace('\\', '', $matches[0]);
   $matches[1] = str_replace('\\', '', $matches[1]);

	$folder = $GLOBALS["dataFolder"].$matches[1];


	$nid = createPageNode($GLOBALS['bookNodeId'], $matches[1], $folder);
	$matches[0] = "node/".$nid;
	$hrefa = "<a href=".$matches[0].">".$matches[1]."</a>";
	return $hrefa;
}

function createNewPage($bookId, $file) {
	

    $ret = preg_replace_callback('/"([^"]*\.md)"/', function($matches) {
		
		$matches[0] = str_replace('\\', '', $matches[0]);
		$matches[1] = str_replace('\\', '', $matches[1]);

		$folder = $GLOBALS["dataFolder"].$matches[1];


		$nid = createPageNode($bookId, $matches[1], $folder);
	
		savePageInfo($bookId, $nid, $name);

		$matches[0] = "node/".$nid;
		$hrefa = "<a href=".$matches[0].">".$matches[1]."</a>";
		return $hrefa;
	

	}, $file);
	

	
	//updateBookNode($bookId, $ret);

}

/**
 * savePageInfo: to save the information from a page
 * param bookId: the node id of the book
 * param nid: the node id of that page
 * author: Raymond Fu
 * date: Mar 1, 2016
 **/
function savePageInfo($bookId, $nid, $name) {
	
}

function createPageNodeEx($bookId, $parentId, $title, $content) {

	if($bookId === NULL) {
		$bookId = 'new';	
	}
	$node = new stdClass();
	$node->book = array('bid'=>$bookId);
	$node->name = $title; 
	$node->title = $node->name; 
	$node->body = $content; 
	$node->type = 'page'; 
	if($parentId !== NULL) {
		//$nodeParent = node_load($parentId);
		//$node->book['plid'] = $nodeParent->book['mlid'];
		//$node->parent = $parentId;
		//$node->book['plid'] = $parentId;
	}
	$node->created = time(); 
	$node->changed = $node->created; 
	$node->promote = 0; 
	$node->sticky = 0; 
	$node->format = 2;
	$node->status = 1;
	$node->language = 'en'; 
/*
	$plid = _nodehierarchy_get_node_mlid($parentId,true);
	$nodehierarchy_menu_links = _nodehierarchy_default_menu_link($parentId, $plid);
	$nodehierarchy_menu_links['pnid']=$parentId;
	$nodehierarchy_menu_links['hidden'] = FALSE;
	$nodehierarchy_menu_links['enabled'] = TRUE;
	$node->nodehierarchy_menu_links[] = $nodehierarchy_menu_links;
*/

	node_save($node);
	
	if($parentId !== NULL) {
		//$node->parent = $parentId;
		//$nodeParent = node_load($parentId);
		//$node->book['plid'] = $nodeParent->book['mlid'];
		//$node->book['mlid'] = $parentId;
		//node_save($node);
		//_book_update_outline($node);
	}


	return $node->nid;

}

function refreshPageNodeEx($nodeId, $parentId, $title, $content) {


	$node->name = $title; 
	$node->title = $node->name; 
	$node->body = $content; 
	
	node_save($node);
}

function refreshPageNode($nodeId, $parentId, $title, $fileName, $fileNameWithFolder) {

	if(!$nodeId) {
		return;	
	}
	$node = node_load($nodeId);
	$filemd = file_get_contents($fileNameWithFolder);

	$node->name = $title; 
	$node->title = $node->name; 
	$node->body = $filemd; 

	if($parentId !== NULL) {
		$nodeParent = node_load($parentId);
		$node->book['plid'] = $nodeParent->book['mlid'];


		$node->book['bid'] = $nodeParent->book['bid'];
		$node->book['plid'] = $nodeParent->book['mlid'];
		$node->book['menu_name'] = $nodeParent->book['menu_name'];
	}

	node_save($node);
}

function createPageNode($bookId, $parentId, $title, $fileName, $fileNameWithFolder) {


	$filemd = file_get_contents($fileNameWithFolder);

	if($bookId === NULL) {
		$bookId = 'new';	
	}
	$node = new stdClass();
	$node->book = array('bid'=>$bookId);
	$node->name = $title; 
	$node->title = $node->name; 
	$node->body = $filemd; 
	$node->type = 'page'; //or ‘page’
	if($parentId !== NULL) {
		$nodeParent = node_load($parentId);

		$node->book['bid'] = $nodeParent->book['bid'];
		$node->book['plid'] = $nodeParent->book['mlid'];
		$node->book['menu_name'] = $nodeParent->book['menu_name'];
	}
	$node->created = time(); 
	$node->changed = $node->created; 
	$node->promote = 0; 
	$node->sticky = 0; 
	$node->format = 2;
	$node->status = 1;
	$node->language = 'en'; 

	node_save($node);
	
/*	if($parentId !== NULL) {
		$node->parent = $parentId;
		$nodeParent = node_load($parentId);
		$node->book['plid'] = $nodeParent->book['mlid'];
		//$node->book['mlid'] = $parentId;

		$node->book['bid'] = $nodeParent->book['bid'];
		$node->book['plid'] = $nodeParent->book['mlid'];
		$node->book['menu_name'] = $nodeParent->book['menu_name'];
		node_save($node);
		_book_update_outline($node);
	}
*/
	return $node->nid;

}

/**
 * updateBookNode: to update the book content
 * param bookId: the node id of the book
 * param content: the book data
 * author: Raymond Fu
 * date: Feb 1, 2016
 **/
function updateBookNode($bookId, $content) {

	$node = node_load($bookId);

	
	$node->body = $content; 
	$node->changed = $node->created; 

	node_save($node);
	
}



