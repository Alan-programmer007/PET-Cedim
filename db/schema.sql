-- Schema SQL para criação das tabelas do projeto ANAMNESES_CEDIM
-- Compatível com MySQL / MariaDB

-- Cria o banco (caso necessário) e seleciona
-- CREATE DATABASE IF NOT EXISTS anamneses_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE anamneses_db;

-- Tabela de usuários (autenticação)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de anamnese (opcional) para guardar registros no servidor
CREATE TABLE IF NOT EXISTS anamneses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  paciente_nome VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data JSON NULL,
  imagem TEXT NULL,        -- imagem JPEG/base64 gerada do relatório (opcional)
  imagem_mama_a TEXT NULL, -- imagem do canvas A (base64)
  imagem_mama_b TEXT NULL, -- imagem do canvas B (base64)
  PRIMARY KEY (id),
  KEY fk_user (user_id),
  CONSTRAINT fk_anamneses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices e otimizações adicionais podem ser criados conforme necessidade
