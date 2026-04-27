const fs = require('fs');

// 1. UPDATE DB.RS
let dbRs = fs.readFileSync('/workspace/e-lib-pro/src-tauri/src/db.rs', 'utf-8');
dbRs = dbRs.replace(
  /conn\.execute\("CREATE TABLE IF NOT EXISTS categories/g,
  'conn.execute("CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)", [])?;\n    conn.execute("CREATE TABLE IF NOT EXISTS categories'
);
fs.writeFileSync('/workspace/e-lib-pro/src-tauri/src/db.rs', dbRs);


// 2. UPDATE COMMANDS.RS
let commandsRs = fs.readFileSync('/workspace/e-lib-pro/src-tauri/src/commands.rs', 'utf-8');
commandsRs = commandsRs.replace(
  /pub fn create_db[\s\S]*?Ok\("Database created successfully"\.to_string\(\)\)\n\}/,
  `pub fn create_db(db_name: String, path: String, description: String) -> Result<String, String> {
    init_db(&db_name, &path).map_err(|e| e.to_string())?;
    let pool = DB_POOL.lock().unwrap();
    let conn = pool.get(&db_name).ok_or("Database not found")?;
    conn.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES ('description', ?1)", params![description]).map_err(|e| e.to_string())?;
    Ok("Database created successfully".to_string())
}`
);

const newCommands = `
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
`;
fs.writeFileSync('/workspace/e-lib-pro/src-tauri/src/commands.rs', commandsRs + '\n' + newCommands);


// 3. UPDATE MAIN.RS
let mainRs = fs.readFileSync('/workspace/e-lib-pro/src-tauri/src/main.rs', 'utf-8');
mainRs = mainRs.replace(
  /commands::open_db,/g,
  `commands::open_db,
            commands::get_db_description,
            commands::close_db,
            commands::count_books_in_category,
            commands::delete_category,`
);
fs.writeFileSync('/workspace/e-lib-pro/src-tauri/src/main.rs', mainRs);

