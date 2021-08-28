<?php
/*
Last-Update: 2021/8/28

テンポラリzipファイルを作成するtmpディレクトリと
ファイルが置いてあるdownloadディレクトリが必要
前提：zipモジュールが必要
(php -mをしてZipモジュールがなければインストールする)
*/
	set_time_limit(0);

	// 定数
	$DOCUMENT_ROOT = "/var/www/html/mb";
	$ERROR_PATH    = $DOCUMENT_ROOT . "/error.zip";
	$ROOT_DIR      = $DOCUMENT_ROOT . "/download";
	$TMP_DIR       = $DOCUMENT_ROOT . "/tmp";
	$RANDOM_LENGTH = 10;
	$BASE_NAME     = "metabobank-files";
	$TRIAL_COUNT   = 10;

	$tmpdir = createTmpDirectory( $TMP_DIR, $TRIAL_COUNT, $RANDOM_LENGTH );
	if( 0 < strlen( $tmpdir ) ){
		$zipname = $BASE_NAME . "_" . date( "YmdHis" ) . ".zip";
		$zippath = $tmpdir . "/" . $zipname;

//		$files = filter_input( INPUT_POST, 'files', FILTER_SANITIZE_EMAIL, FILTER_REQUIRE_ARRAY );
		$zip = new ZipArchive();
		$res = $zip->open( $zippath, ZipArchive::CREATE );
		$files = $_POST['files'];
		if( 0 < strlen( $files ) && $res === true ){
// データの受け取り方を考える
// そもそもこのままだと色々問題があるので
			$file = explode(",", $files);
			for($i = 0; $i < count( $file ); $i ++){
				// サニタイズ(具体的には英数字と「_.」以外の文字は削除する)
				$file[$i] = preg_replace("/[^-0-9a-z\._]/i", "", $file[$i]);

				// ファイル名からハッシュ値を求め、2/4/fileへのパスとする
				$hash = hash("md5", $file[$i]);
				$prefix1 = substr($hash, 0, 1);
				$prefix2 = substr($hash, 1, 2);
// テストファイルを作成する（今はダウンロードするファイル自体が手元にないため）
createFile($ROOT_DIR, $prefix1, $prefix2, $file[$i]);
				$zip->addFile($ROOT_DIR . "/" . $prefix1 . "/" . $prefix2 . "/" . $file[$i], $file[$i]);
				//$zip->addFile( $ROOT_DIR . "/" . $file[$i], $file[$i] );
			}
		}
		$zip->close();

		// 出力
		output( $zipname, $zippath );

		unlink( $zippath );
		rmdir( $tmpdir );
	} else {
		// failed to create tmp directory.
		output( "error.zip", $ERROR_PATH );
	}

	exit;

	function output( $filename, $filepath )
	{
		mb_http_output( "pass" );
		header( "Content-Type: application/zip" );
		header( "Content-Transfer-Encoding: Binary" );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Expires: 0' );
		header( 'Cache-Control: must-revalidate' );
		header( 'Pragma: public' );
		header( "Content-Length: " . filesize( $filepath ) );
		ob_end_clean();
		readfile( $filepath );
	}

	function createTmpDirectory( $dir, $count, $length )
	{
		for( $i = 0; $i < $count; $i ++ ){
			$tmpdir  = $dir . "/" . bin2hex( random_bytes( $length ) );
			if( !is_dir( $tmpdir ) ){
				mkdir( $tmpdir );
				return $tmpdir;
			}
		}
		return "";
	}

function createFile($root, $p1, $p2, $file)
{
	$dir = $root . "/" . $p1;
	if(!file_exists($dir))
		mkdir($dir);
	$dir .= "/" . $p2;
	if(!file_exists($dir))
		mkdir($dir);
	$path = $dir . "/" . $file;
	file_put_contents($path, $file);
}
?>
