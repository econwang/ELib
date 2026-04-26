const fs = require('fs');
const path = require('path');

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim());
};

write('/workspace/e-lib-pro/src-tauri/Cargo.toml', `
[package]
name = "e-lib-pro"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0-beta", features = [] }

[dependencies]
tauri = { version = "2.0.0-beta", features = ["tray-icon"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.29", features = ["bundled", "blob"] }
image = "0.24"
biblatex = "0.2"
lazy_static = "1.4"
`);

write('/workspace/e-lib-pro/src-tauri/src/main.rs', `
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db;
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::add_book,
            commands::import_bibtex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`);

write('/workspace/e-lib-pro/src-tauri/src/db.rs', `
use rusqlite::{Connection, Result};
use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref DB_POOL: Mutex<HashMap<String, Connection>> = Mutex::new(HashMap::new());
}

pub fn init_db(db_name: &str, path: &str) -> Result<()> {
    let conn = Connection::open(path)?;
    conn.execute("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER, name TEXT NOT NULL, level INTEGER NOT NULL)", [])?;
    conn.execute("CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER, title TEXT NOT NULL, author TEXT, publisher TEXT, isbn TEXT, edition TEXT, local_path TEXT, cover_image BLOB, notes TEXT, FOREIGN KEY(category_id) REFERENCES categories(id))", [])?;
    
    let mut pool = DB_POOL.lock().unwrap();
    pool.insert(db_name.to_string(), conn);
    Ok(())
}
`);

write('/workspace/e-lib-pro/src-tauri/src/commands.rs', `
use crate::db::DB_POOL;
use tauri::command;
use image::ImageOutputFormat;
use std::io::Cursor;
use rusqlite::params;

#[command]
pub fn add_book(db_name: String, category_id: i32, title: String, author: String, publisher: String, isbn: String, edition: String, local_path: String, cover_bytes: Vec<u8>) -> Result<String, String> {
    let img = image::load_from_memory(&cover_bytes).map_err(|e| e.to_string())?;
    let resized = img.resize_to_fill(800, 800, image::imageops::FilterType::Lanczos3);
    
    let mut compressed_bytes: Vec<u8> = Vec::new();
    resized.write_to(&mut Cursor::new(&mut compressed_bytes), ImageOutputFormat::Jpeg(80)).map_err(|e| e.to_string())?;

    let pool = DB_POOL.lock().unwrap();
    if let Some(conn) = pool.get(&db_name) {
        conn.execute(
            "INSERT INTO books (category_id, title, author, publisher, isbn, edition, local_path, cover_image) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![category_id, title, author, publisher, isbn, edition, local_path, compressed_bytes],
        ).map_err(|e| e.to_string())?;
        Ok("Book added successfully".to_string())
    } else {
        Err("Database not found".to_string())
    }
}

#[command]
pub fn import_bibtex(db_name: String, bibtex_content: String) -> Result<String, String> {
    let bibliography = biblatex::Bibliography::parse(&bibtex_content).map_err(|e| e.to_string())?;
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;

    for entry in bibliography.iter() {
        let title = entry.title().unwrap_or_default();
        let author = entry.author().unwrap_or_default().to_string();
        conn.execute("INSERT INTO books (title, author) VALUES (?1, ?2)", params![title, author]).map_err(|e| e.to_string())?;
    }
    Ok("BibTeX imported successfully".to_string())
}
`);

write('/workspace/e-lib-pro/build.ps1', `
# Windows Build & Deployment Strategy Script
Write-Host "Starting build process for eLibPro..."

# 1. Clean previous builds
Write-Host "Cleaning previous builds..."
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "src-tauri/target") { Remove-Item -Recurse -Force "src-tauri/target" }

# 2. Install npm dependencies
Write-Host "Installing npm dependencies..."
npm install

# 3. Build frontend
Write-Host "Building frontend..."
npm run build

# 4. Tauri release build
Write-Host "Executing Tauri release build..."
npm run tauri build

Write-Host "Build complete! Check src-tauri/target/release/bundle for output."
`);

console.log('Files written successfully');
