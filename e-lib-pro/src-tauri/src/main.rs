#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod db;
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::create_db,
            commands::open_db,
            commands::get_categories,
            commands::add_category,
            commands::get_books,
            commands::get_book_cover,
            commands::add_book,
            commands::update_book,
            commands::delete_book,
            commands::import_bibtex,
            commands::read_config,
            commands::save_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}