use crate::db::{init_db, DB_POOL};
use tauri::command;
use image::ImageOutputFormat;
use std::io::Cursor;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use base64::{Engine as _, engine::general_purpose::STANDARD};

#[derive(Serialize, Deserialize)]
pub struct Category {
    id: i32,
    parent_id: Option<i32>,
    name: String,
    level: i32,
}

#[derive(Serialize, Deserialize)]
pub struct Book {
    id: i32,
    category_id: Option<i32>,
    title: String,
    author: String,
    publisher: String,
    isbn: String,
    edition: String,
    local_path: String,
    notes: String,
}

#[command]
pub fn create_db(db_name: String, path: String, description: String) -> Result<String, String> {
    init_db(&db_name, &path).map_err(|e| e.to_string())?;
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    conn.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('description', ?1)", params![description]).map_err(|e| e.to_string())?;
    Ok("Database created successfully".to_string())
}

#[command]
pub fn open_db(db_name: String, path: String) -> Result<String, String> {
    init_db(&db_name, &path).map_err(|e| e.to_string())?;
    Ok("Database opened successfully".to_string())
}

#[command]
pub fn get_categories(db_name: String) -> Result<Vec<Category>, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    let mut stmt = conn.prepare("SELECT id, parent_id, name, level FROM categories").map_err(|e| e.to_string())?;
    let cats = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            parent_id: row.get(1)?,
            name: row.get(2)?,
            level: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for c in cats {
        result.push(c.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[command]
pub fn add_category(db_name: String, parent_id: Option<i32>, name: String, level: i32) -> Result<i32, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    conn.execute("INSERT INTO categories (parent_id, name, level) VALUES (?1, ?2, ?3)", params![parent_id, name, level]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid() as i32)
}

#[command]
pub fn get_books(db_name: String, category_id: Option<i32>) -> Result<Vec<Book>, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    
    let mut sql = "SELECT id, category_id, title, author, publisher, isbn, edition, local_path, notes FROM books".to_string();
    if category_id.is_some() {
        sql.push_str(" WHERE category_id = ?1");
    }
    
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    
    if let Some(cid) = category_id {
        let rows = stmt.query_map([cid], |row| {
            Ok(Book {
                id: row.get(0)?,
                category_id: row.get(1)?,
                title: row.get(2)?,
                author: row.get(3).unwrap_or_default(),
                publisher: row.get(4).unwrap_or_default(),
                isbn: row.get(5).unwrap_or_default(),
                edition: row.get(6).unwrap_or_default(),
                local_path: row.get(7).unwrap_or_default(),
                notes: row.get(8).unwrap_or_default(),
            })
        }).map_err(|e| e.to_string())?;
        for r in rows {
            result.push(r.map_err(|e| e.to_string())?);
        }
    } else {
        let rows = stmt.query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                category_id: row.get(1)?,
                title: row.get(2)?,
                author: row.get(3).unwrap_or_default(),
                publisher: row.get(4).unwrap_or_default(),
                isbn: row.get(5).unwrap_or_default(),
                edition: row.get(6).unwrap_or_default(),
                local_path: row.get(7).unwrap_or_default(),
                notes: row.get(8).unwrap_or_default(),
            })
        }).map_err(|e| e.to_string())?;
        for r in rows {
            result.push(r.map_err(|e| e.to_string())?);
        }
    };
    
    Ok(result)
}

#[command]
pub fn get_book_cover(db_name: String, book_id: i32) -> Result<Option<String>, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    let mut stmt = conn.prepare("SELECT cover_image FROM books WHERE id = ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([book_id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let cover: Option<Vec<u8>> = row.get(0).map_err(|e| e.to_string())?;
        if let Some(bytes) = cover {
            let b64 = STANDARD.encode(&bytes);
            return Ok(Some(format!("data:image/jpeg;base64,{}", b64)));
        }
    }
    Ok(None)
}

#[command]
pub fn add_book(db_name: String, category_id: Option<i32>, title: String, author: String, publisher: String, isbn: String, edition: String, local_path: String, cover_bytes: Vec<u8>, notes: String) -> Result<String, String> {
    let compressed_bytes = if !cover_bytes.is_empty() {
        let img = image::load_from_memory(&cover_bytes).map_err(|e| e.to_string())?;
        let resized = img.resize_to_fill(800, 800, image::imageops::FilterType::Lanczos3);
        let mut cb = Vec::new();
        resized.write_to(&mut Cursor::new(&mut cb), ImageOutputFormat::Jpeg(80)).map_err(|e| e.to_string())?;
        Some(cb)
    } else {
        None
    };

    let pool = DB_POOL.lock().unwrap();
    if let Some(conn) = pool.get(&db_name) {
        conn.execute(
            "INSERT INTO books (category_id, title, author, publisher, isbn, edition, local_path, cover_image, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![category_id, title, author, publisher, isbn, edition, local_path, compressed_bytes, notes],
        ).map_err(|e| e.to_string())?;
        Ok("Book added successfully".to_string())
    } else {
        Err("Database not found".to_string())
    }
}

#[command]
pub fn update_book(db_name: String, id: i32, title: String, author: String, publisher: String, isbn: String, edition: String, local_path: String, notes: String) -> Result<String, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    conn.execute(
        "UPDATE books SET title=?1, author=?2, publisher=?3, isbn=?4, edition=?5, local_path=?6, notes=?7 WHERE id=?8",
        params![title, author, publisher, isbn, edition, local_path, notes, id],
    ).map_err(|e| e.to_string())?;
    Ok("Book updated".to_string())
}

#[command]
pub fn delete_book(db_name: String, id: i32) -> Result<String, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    conn.execute("DELETE FROM books WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok("Book deleted".to_string())
}

#[command]
pub fn import_bibtex(db_name: String, category_id: Option<i32>, bibtex_content: String) -> Result<String, String> {
    let bibliography = biblatex::Bibliography::parse(&bibtex_content)
        .map_err(|e| format!("{:?}", e))?;
    
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;

    for entry in bibliography.iter() {
        let title = entry.get_as::<String>("title").unwrap_or_default();
        let author = match entry.author() {
            Ok(persons) => {
                let mut names = Vec::new();
                for person in persons {
                    let first = person.given_name;
                    let last = person.name;
                    let mut full = String::new();
                    if !first.is_empty() {
                        full.push_str(&first);
                        full.push(' ');
                    }
                    full.push_str(&last);
                    names.push(full.trim().to_string());
                }
                names.join(";")
            },
            _ => String::new(),
        };
        let publisher = entry.get_as::<String>("publisher").unwrap_or_default();
        let isbn = entry.get_as::<String>("isbn").unwrap_or_default();
        let edition = entry.get_as::<String>("edition").unwrap_or_default();
        let note = entry.get_as::<String>("note").unwrap_or_default();

        conn.execute("INSERT INTO books (category_id, title, author, publisher, isbn, edition, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", params![category_id, title, author, publisher, isbn, edition, note]).map_err(|e| e.to_string())?;
    }
    Ok("BibTeX imported successfully".to_string())
}

#[command]
pub fn export_bibtex(db_name: String, category_id: Option<i32>) -> Result<String, String> {
    let books = get_books(db_name, category_id)?;
    let mut bib = String::new();
    for book in books {
        bib.push_str(&format!("@book{{book{},\n", book.id));
        bib.push_str(&format!("  title = {{{}}},\n", book.title));
        if !book.author.is_empty() {
            bib.push_str(&format!("  author = {{{}}},\n", book.author));
        }
        if !book.publisher.is_empty() {
            bib.push_str(&format!("  publisher = {{{}}},\n", book.publisher));
        }
        if !book.isbn.is_empty() {
            bib.push_str(&format!("  isbn = {{{}}},\n", book.isbn));
        }
        if !book.edition.is_empty() {
            bib.push_str(&format!("  edition = {{{}}},\n", book.edition));
        }
        bib.push_str("}\n\n");
    }
    Ok(bib)
}

#[command]
pub fn read_config() -> Result<String, String> {
    let config_path = Path::new("config.json");
    if config_path.exists() {
        fs::read_to_string(config_path).map_err(|e| e.to_string())
    } else {
        Ok("{}".to_string())
    }
}

#[command]
pub fn save_config(config: String) -> Result<String, String> {
    fs::write("config.json", config).map_err(|e| e.to_string())?;
    Ok("Config saved".to_string())
}

#[command]
pub fn get_db_description(db_name: String) -> Result<String, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    let mut stmt = conn.prepare("SELECT value FROM metadata WHERE key = 'description'").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let desc: String = row.get(0).map_err(|e| e.to_string())?;
        return Ok(desc);
    }
    Ok("Unknown Database".to_string())
}

#[command]
pub fn close_db(db_name: String) -> Result<String, String> {
    let mut pool = DB_POOL.lock().unwrap();
    pool.remove(&db_name);
    Ok("Database closed".to_string())
}

#[command]
pub fn count_books_in_category(db_name: String, category_id: i32) -> Result<i32, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    
    let sql = "
        WITH RECURSIVE subcategories AS (
            SELECT id FROM categories WHERE id = ?1
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN subcategories s ON c.parent_id = s.id
        )
        SELECT COUNT(*) FROM books WHERE category_id IN subcategories
    ";
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let mut rows = stmt.query([category_id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let count: i32 = row.get(0).map_err(|e| e.to_string())?;
        return Ok(count);
    }
    Ok(0)
}

#[command]
pub fn delete_category(db_name: String, category_id: i32) -> Result<String, String> {
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    
    let sql_books = "
        WITH RECURSIVE subcategories AS (
            SELECT id FROM categories WHERE id = ?1
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN subcategories s ON c.parent_id = s.id
        )
        DELETE FROM books WHERE category_id IN subcategories
    ";
    conn.execute(sql_books, params![category_id]).map_err(|e| e.to_string())?;

    let sql_cats = "
        WITH RECURSIVE subcategories AS (
            SELECT id FROM categories WHERE id = ?1
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN subcategories s ON c.parent_id = s.id
        )
        DELETE FROM categories WHERE id IN subcategories
    ";
    conn.execute(sql_cats, params![category_id]).map_err(|e| e.to_string())?;

    Ok("Category deleted".to_string())
}
