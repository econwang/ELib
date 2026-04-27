use rusqlite::{Connection, Result};
use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref DB_POOL: Mutex<HashMap<String, Connection>> = Mutex::new(HashMap::new());
}

pub fn init_db(db_name: &str, path: &str) -> Result<()> {
    let conn = Connection::open(path)?;
    conn.execute("CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)", [])?;
    conn.execute("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id INTEGER, name TEXT NOT NULL, level INTEGER NOT NULL)", [])?;
    conn.execute("CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER, title TEXT NOT NULL, author TEXT, publisher TEXT, isbn TEXT, edition TEXT, local_path TEXT, cover_image BLOB, notes TEXT, FOREIGN KEY(category_id) REFERENCES categories(id))", [])?;
    
    let mut pool = DB_POOL.lock().unwrap();
    pool.insert(db_name.to_string(), conn);
    Ok(())
}