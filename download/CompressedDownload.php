<?php
/*
Last-Update: 2021/8/23

テンポラリzipファイルを作成するtmpディレクトリと
ファイルが置いてあるdownloadディレクトリが必要
前提：zipモジュールが必要
(php -mをしてZipモジュールがなければインストールする)
*/
	set_time_limit(0);

	// 定数
	$DOCUMENT_ROOT = "/var/www/html/mb";
	$ROOT_DIR      = $DOCUMENT_ROOT . "/download";
	$TMP_DIR       = $DOCUMENT_ROOT . "/tmp";
	$RANDOM_LENGTH = 10;
	$BASE_NAME     = "metabobank-files";

	$tmpdir  = $TMP_DIR . "/" . bin2hex( random_bytes( $RANDOM_LENGTH ) );
	mkdir( $tmpdir );
	$zipname = $BASE_NAME . "_" . date( "YmdHis" ) . ".zip";
	$zippath = $tmpdir . "/" . $zipname;

//	$files = filter_input( INPUT_POST, 'files', FILTER_SANITIZE_EMAIL, FILTER_REQUIRE_ARRAY );
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
	mb_http_output( "pass" );
	header( "Content-Type: application/zip" );
	header( "Content-Transfer-Encoding: Binary" );
	header( 'Content-Disposition: attachment; filename="' . $zipname . '"' );
	header( 'Expires: 0' );
	header( 'Cache-Control: must-revalidate' );
	header( 'Pragma: public' );
	header( "Content-Length: " . filesize( $zippath ) );
	ob_end_clean();
	readfile( $zippath );

	unlink( $zippath );
	rmdir( $tmpdir );

	exit;

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
