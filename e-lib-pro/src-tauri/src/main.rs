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