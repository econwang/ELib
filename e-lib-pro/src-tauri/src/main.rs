#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db;
mod commands;

fn main() {
    // 强制使用 db 模块以消除未使用的警告（在真实场景中可在启动时调用）
    let _ = db::init_db("default", "default.db");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::add_book,
            commands::import_bibtex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}