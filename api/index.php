<?php
// Zewsnap! API: satu pintu, dipanggil sebagai api/index.php?r=<aksi>
$cfg = require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();

function out($d, $c = 200) { http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function fail($m, $c = 400) { out(['error' => $m], $c); }

try {
  $db = new PDO("mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4", $cfg['user'], $cfg['pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
} catch (Throwable $e) { fail('Koneksi database gagal. Cek api/config.php', 500); }

$r = $_GET['r'] ?? '';
$in = [];
$isPost = $_SERVER['REQUEST_METHOD'] === 'POST';
if ($isPost) {
  // Wajib JSON: selain praktis, ini ikut menahan serangan CSRF dari situs lain
  if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) fail('Content-Type harus application/json', 415);
  $in = json_decode(file_get_contents('php://input'), true) ?: [];
}

function q($sql, $p = []) { global $db; $s = $db->prepare($sql); $s->execute($p); return $s; }
function me() { $id = $_SESSION['uid'] ?? null; return $id ? (q('SELECT id,username,role FROM users WHERE id=?', [$id])->fetch() ?: null) : null; }
function need() { $u = me(); if (!$u) fail('Silakan masuk dulu', 401); return $u; }
function adm() { $u = need(); if ($u['role'] !== 'admin') fail('Khusus admin', 403); return $u; }
function cut($s, $n) { return function_exists('mb_substr') ? mb_substr($s, 0, $n) : substr($s, 0, $n); }
function post() { global $isPost; if (!$isPost) fail('Gunakan metode POST', 405); }

// Simpan gambar PNG (data URL) ke uploads/<dir>/, hasilnya [namaFile, lebar, tinggi]
function pngSave($data, $dir) {
  if (!is_string($data) || strncmp($data, 'data:image/png;base64,', 22) !== 0) fail('Gambar harus berformat PNG');
  $bin = base64_decode(substr($data, 22), true);
  if ($bin === false || strlen($bin) > 8 * 1024 * 1024) fail('Gambar tidak valid atau lebih dari 8 MB');
  $i = @getimagesizefromstring($bin);
  if (!$i || $i[2] !== IMAGETYPE_PNG || $i[0] > 4000 || $i[1] > 4000) fail('File bukan PNG yang valid');
  $d = dirname(__DIR__) . "/uploads/$dir";
  if (!is_dir($d)) mkdir($d, 0755, true);
  $f = bin2hex(random_bytes(8)) . '.png';
  if (file_put_contents("$d/$f", $bin) === false) fail('Gagal menyimpan file. Cek izin folder uploads', 500);
  return [$f, $i[0], $i[1]];
}
function delFile($dir, $file) { $p = dirname(__DIR__) . "/uploads/$dir/" . basename($file); if (is_file($p)) @unlink($p); }
// Kunci pendek (n, d, w, h, holes) dipakai langsung oleh frontend
function frameRow($f, $uid) {
  return ['id' => (int)$f['id'], 'n' => $f['name'], 'd' => 'uploads/frames/' . $f['file'], 'w' => (int)$f['width'], 'h' => (int)$f['height'],
          'holes' => json_decode($f['slots'], true) ?: [], 'g' => (bool)$f['is_global'], 'own' => (int)$f['user_id'] === (int)$uid];
}

try { switch ($r) {

  case 'me': out(me());

  case 'register': post();
    $u = trim((string)($in['u'] ?? '')); $p = (string)($in['p'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_.-]{3,30}$/', $u)) fail('Username 3-30 karakter (huruf, angka, _ . -)');
    if (strlen($p) < 6) fail('Password minimal 6 karakter');
    if (q('SELECT 1 FROM users WHERE username=?', [$u])->fetch()) fail('Username sudah dipakai', 409);
    q('INSERT INTO users(username,password_hash) VALUES(?,?)', [$u, password_hash($p, PASSWORD_DEFAULT)]);
    session_regenerate_id(true); $_SESSION['uid'] = (int)$db->lastInsertId();
    out(me());

  case 'login': post();
    $row = q('SELECT id,password_hash FROM users WHERE username=?', [trim((string)($in['u'] ?? ''))])->fetch();
    if (!$row || !password_verify((string)($in['p'] ?? ''), $row['password_hash'])) fail('Username atau password salah', 401);
    session_regenerate_id(true); $_SESSION['uid'] = (int)$row['id'];
    out(me());

  case 'logout': post(); $_SESSION = []; session_destroy(); out(['ok' => true]);

  case 'frames': $u = need();
    out(array_map(fn($f) => frameRow($f, $u['id']), q('SELECT * FROM frames WHERE user_id=? OR is_global=1 ORDER BY id', [$u['id']])->fetchAll()));

  case 'frame_add': post(); $u = need();
    $name = cut(trim((string)($in['name'] ?? '')), 80) ?: 'Frame';
    [$file, $w, $h] = pngSave($in['data'] ?? '', 'frames');
    $slots = [];
    foreach (array_slice((array)($in['slots'] ?? []), 0, 12) as $s) {
      $x = max(0, min($w - 1, (int)($s['x'] ?? 0))); $y = max(0, min($h - 1, (int)($s['y'] ?? 0)));
      $slots[] = ['x' => $x, 'y' => $y, 'w' => max(1, min($w - $x, (int)($s['w'] ?? 1))), 'h' => max(1, min($h - $y, (int)($s['h'] ?? 1)))];
    }
    q('INSERT INTO frames(user_id,name,file,width,height,slots,is_global) VALUES(?,?,?,?,?,?,?)',
      [$u['id'], $name, $file, $w, $h, json_encode($slots), $u['role'] === 'admin' ? 1 : 0]);
    out(frameRow(q('SELECT * FROM frames WHERE id=?', [$db->lastInsertId()])->fetch(), $u['id']));

  case 'frame_del': post(); $u = need();
    $f = q('SELECT * FROM frames WHERE id=?', [(int)($in['id'] ?? 0)])->fetch();
    if (!$f) fail('Frame tidak ditemukan', 404);
    if ((int)$f['user_id'] !== (int)$u['id'] && $u['role'] !== 'admin') fail('Bukan frame milikmu', 403);
    q('DELETE FROM frames WHERE id=?', [$f['id']]); delFile('frames', $f['file']);
    out(['ok' => true]);

  case 'photos': $u = need();
    out(array_map(fn($p) => ['id' => (int)$p['id'], 'd' => 'uploads/photos/' . $p['file'], 't' => $p['created_at']],
      q('SELECT id,file,created_at FROM photos WHERE user_id=? ORDER BY id DESC', [$u['id']])->fetchAll()));

  case 'photo_add': post(); $u = need();
    [$file] = pngSave($in['data'] ?? '', 'photos');
    $fid = (int)($in['frame_id'] ?? 0);
    if (!$fid || !q('SELECT 1 FROM frames WHERE id=?', [$fid])->fetch()) $fid = null;
    q('INSERT INTO photos(user_id,frame_id,file) VALUES(?,?,?)', [$u['id'], $fid, $file]);
    out(['id' => (int)$db->lastInsertId()]);

  case 'photo_del': post(); $u = need();
    $p = q('SELECT * FROM photos WHERE id=? AND user_id=?', [(int)($in['id'] ?? 0), $u['id']])->fetch();
    if (!$p) fail('Foto tidak ditemukan', 404);
    q('DELETE FROM photos WHERE id=?', [$p['id']]); delFile('photos', $p['file']);
    out(['ok' => true]);

  case 'scores': need();
    $rows = q('SELECT u.username u, s.game g, s.score s FROM scores s JOIN users u ON u.id=s.user_id ORDER BY s.score DESC LIMIT 200')->fetchAll();
    $cnt = []; $res = [];
    foreach ($rows as $x) { $cnt[$x['g']] = ($cnt[$x['g']] ?? 0) + 1; if ($cnt[$x['g']] <= 5) $res[] = ['u' => $x['u'], 'g' => $x['g'], 's' => (int)$x['s']]; }
    out($res);

  case 'score_add': post(); $u = need();
    $g = (string)($in['game'] ?? '');
    if (!in_array($g, ['Apple Catch', 'Memory Match'], true)) fail('Game tidak dikenal');
    $s = max(0, min(1000, (int)($in['score'] ?? 0)));
    q('INSERT INTO scores(user_id,game,score) VALUES(?,?,?) ON DUPLICATE KEY UPDATE score=GREATEST(score,VALUES(score))', [$u['id'], $g, $s]);
    out(['ok' => true]);

  case 'stickers': need();
    out(array_map(fn($s) => ['id' => (int)$s['id'], 'e' => $s['emoji']], q('SELECT id,emoji FROM stickers ORDER BY id')->fetchAll()));

  case 'sticker_add': post(); adm();
    $e = trim((string)($in['e'] ?? ''));
    if ($e === '' || strlen($e) > 32) fail('Isi satu emoji saja');
    q('INSERT INTO stickers(emoji) VALUES(?)', [$e]); out(['ok' => true]);

  case 'sticker_del': post(); adm();
    q('DELETE FROM stickers WHERE id=?', [(int)($in['id'] ?? 0)]); out(['ok' => true]);

  case 'admin_stats': adm();
    out([
      'users' => q("SELECT u.username u, u.role, (SELECT COUNT(*) FROM photos p WHERE p.user_id=u.id) photos,
                    (SELECT GROUP_CONCAT(CONCAT(game,': ',score) SEPARATOR ', ') FROM scores s WHERE s.user_id=u.id) best
                    FROM users u ORDER BY u.id")->fetchAll(),
      'photos' => (int)q('SELECT COUNT(*) FROM photos')->fetchColumn(),
      'frames' => (int)q('SELECT COUNT(*) FROM frames')->fetchColumn(),
      'stickers' => array_map(fn($s) => ['id' => (int)$s['id'], 'e' => $s['emoji']], q('SELECT id,emoji FROM stickers ORDER BY id')->fetchAll()),
    ]);

  default: fail('Aksi tidak dikenal', 404);
} } catch (PDOException $e) { fail('Kesalahan database', 500); }
