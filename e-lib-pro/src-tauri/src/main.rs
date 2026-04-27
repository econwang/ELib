#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db;
mod commands;

fn main() {
    // 强制使用 db 模块以消除未使用的警告（在真实场景中可在启动时调用）
    let _ = db::init_db("default", "default.db");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::create_db,
            commands::open_db,
            commands::get_db_description,
            commands::close_db,
            commands::count_books_in_category,
            commands::delete_category,
            commands::get_categories,
            commands::add_category,
            commands::get_books,
            commands::get_book_cover,
            commands::add_book,
            commands::update_book,
            commands::delete_book,
            commands::import_bibtex,
            commands::export_bibtex,
            commands::read_config,
            commands::save_config,
            commands::open_local_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}