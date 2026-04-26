use crate::db::DB_POOL;
use tauri::command;
use image::ImageOutputFormat;
use std::io::Cursor;
use rusqlite::params;
use biblatex::ChunksExt;

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
    let bibliography = biblatex::Bibliography::parse(&bibtex_content)
        .map_err(|e| format!("{:?}", e))?;
    
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;

    for entry in bibliography.iter() {
        let title = match entry.title() {
            Ok(chunks) => {
                // In biblatex 0.9, format_verbatim is implemented on the array slice
                // [Spanned<Chunk>] directly, not on the Chunk itself.
                chunks.format_verbatim()
            },
            _ => String::new(),
        };
        
        let author = match entry.author() {
            Ok(persons) => {
                let mut names = Vec::new();
                for person in persons {
                    names.push(person.name);
                }
                names.join(", ")
            },
            _ => String::new(),
        };
        
        conn.execute("INSERT INTO books (title, author) VALUES (?1, ?2)", params![title, author]).map_err(|e| e.to_string())?;
    }
    Ok("BibTeX imported successfully".to_string())
}