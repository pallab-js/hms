use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::{ConnectOptions, SqlitePool};
use std::path::PathBuf;
use std::sync::Arc;

const KEYRING_SERVICE: &str = "com.hms.app";
const KEYRING_ACCOUNT: &str = "database-key";

pub fn resolve_db_encryption_key() -> Result<String, Box<dyn std::error::Error>> {
    if let Ok(key) = std::env::var("HMS_DB_KEY") {
        if key.len() >= 32 {
            return Ok(key);
        } else {
            return Err("HMS_DB_KEY must be at least 32 characters".into());
        }
    }

    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)?;
    if let Ok(key) = entry.get_password() {
        if key.len() >= 32 {
            return Ok(key);
        }
    }

    let generated_key = generate_random_key(32);
    let _ = entry.set_password(&generated_key);
    Ok(generated_key)
}

fn generate_random_key(length: usize) -> String {
    use std::collections::hash_map::RandomState;
    use std::hash::{BuildHasher, Hasher};
    let mut hasher = RandomState::new().build_hasher();
    let mut key = String::with_capacity(length);
    for i in 0..length {
        hasher.write_usize(i);
        let hash = hasher.finish();
        let idx = (hash % 62) as u8;
        let chr = if idx < 26 {
            (b'a' + idx) as char
        } else if idx < 52 {
            (b'A' + idx - 26) as char
        } else {
            (b'0' + idx - 52) as char
        };
        key.push(chr);
    }
    key
}

/// Resolve a stable, platform-appropriate path for the database file.
/// Prioritizes the DATABASE_URL environment variable if set.
/// Falls back to the app data directory or current working directory.
pub fn resolve_db_path() -> PathBuf {
    // 1. Check if DATABASE_URL is set (useful for development)
    if let Ok(url) = std::env::var("DATABASE_URL") {
        let path_str = url.strip_prefix("sqlite:").unwrap_or(&url);
        return PathBuf::from(path_str);
    }

    // 2. Try the Tauri app data directory (~/Library/Application Support on macOS)
    if let Some(app_data) = dirs::data_dir() {
        let db_dir = app_data.join("com.hms.app");
        let _ = std::fs::create_dir_all(&db_dir);
        return db_dir.join("hms.db");
    }

    // 3. Fallback: current working directory
    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("hms.db")
}

pub struct DbState {
    pub pool: Arc<tokio::sync::Mutex<Option<SqlitePool>>>,
    pub db_path: PathBuf,
    encryption_key: Arc<tokio::sync::Mutex<Option<String>>>,
}

impl Default for DbState {
    fn default() -> Self {
        Self {
            pool: Arc::new(tokio::sync::Mutex::new(None)),
            db_path: resolve_db_path(),
            encryption_key: Arc::new(tokio::sync::Mutex::new(None)),
        }
    }
}

impl DbState {
    pub async fn init(&self) -> Result<(), Box<dyn std::error::Error>> {
        let _key = resolve_db_encryption_key()?;
        let db_url = format!(
            "sqlite:{}?mode=rwc",
            self.db_path.to_string_lossy()
        );
        
        let options = db_url.parse::<SqliteConnectOptions>()?
            .create_if_missing(true)
            .disable_statement_logging()
            .busy_timeout(std::time::Duration::from_secs(30));
        
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .min_connections(1)
            .acquire_timeout(std::time::Duration::from_secs(10))
            .connect_with(options)
            .await?;

        sqlx::query("PRAGMA foreign_keys = ON;")
            .execute(&pool)
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        let mut guard = self.pool.lock().await;
        *guard = Some(pool);

        let mut key_guard = self.encryption_key.lock().await;
        *key_guard = Some(_key);

        Ok(())
    }

    /// Initialize an in-memory database for testing.
    #[cfg(test)]
    pub async fn init_test() -> Self {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        
        // Ensure foreign key enforcement is on
        sqlx::query("PRAGMA foreign_keys = ON;")
            .execute(&pool)
            .await
            .unwrap();

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();

        Self {
            pool: Arc::new(tokio::sync::Mutex::new(Some(pool))),
            db_path: PathBuf::from(":memory:"),
            encryption_key: Arc::new(tokio::sync::Mutex::new(Some("test-key-for-in-memory-db!".to_string()))),
        }
    }

    pub async fn get_pool(&self) -> SqlitePool {
        let guard = self.pool.lock().await;
        guard.clone().expect("Database not initialized")
    }

    pub fn db_path(&self) -> &std::path::Path {
        &self.db_path
    }

    #[allow(dead_code)]
    pub async fn get_encryption_key(&self) -> String {
        let guard = self.encryption_key.lock().await;
        guard.clone().expect("Database not initialized")
    }
}
