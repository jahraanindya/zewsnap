-- Zewsnap! — skema database (MySQL / MariaDB)
-- Pilih dulu database kosongmu di phpMyAdmin, lalu Import file ini.
SET NAMES utf8mb4;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE frames (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  name       VARCHAR(80)  NOT NULL,
  file       VARCHAR(255) NOT NULL,
  width      INT NOT NULL,
  height     INT NOT NULL,
  slots      TEXT NOT NULL,              -- JSON: [{x,y,w,h}, ...] posisi lubang foto
  is_global  TINYINT(1) NOT NULL DEFAULT 0, -- 1 = frame dari admin, tampil untuk semua user
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE photos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  frame_id   INT NULL,
  file       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (frame_id) REFERENCES frames(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scores (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  game    VARCHAR(30) NOT NULL,
  score   INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_user_game (user_id, game),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE stickers (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  emoji VARCHAR(16) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data awal. Akun admin: username admin, password admin123 (SEGERA GANTI setelah hosting!)
INSERT INTO users (username, password_hash, role) VALUES ('admin', '$2y$10$xPSsOwfv.ZdqfvoHOlV9qOKbRKaTlavGjtS5aJZNuTK7CEymJy9Ty', 'admin');
INSERT INTO stickers (emoji) VALUES ('🍎'),('⭐'),('🎀'),('🍰'),('💙'),('✨');
