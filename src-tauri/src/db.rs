use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{ConnectOptions, SqlitePool};
use std::path::PathBuf;
use std::sync::Arc;

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
}

impl Default for DbState {
    fn default() -> Self {
        Self {
            pool: Arc::new(tokio::sync::Mutex::new(None)),
            db_path: resolve_db_path(),
        }
    }
}

impl DbState {
    pub async fn init(&self) -> Result<(), Box<dyn std::error::Error>> {
        let db_url = format!("sqlite:{}", self.db_path.to_string_lossy());
        
        // Explicitly use connect options to ensure file creation and better error reporting
        let options = db_url.parse::<SqliteConnectOptions>()?
            .create_if_missing(true)
            .disable_statement_logging();
        
        let pool = SqlitePool::connect_with(options).await?;

        // Ensure foreign key enforcement is on
        sqlx::query("PRAGMA foreign_keys = ON;")
            .execute(&pool)
            .await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        let mut guard = self.pool.lock().await;
        *guard = Some(pool);

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
        }
    }

    pub async fn get_pool(&self) -> SqlitePool {
        let guard = self.pool.lock().await;
        guard.clone().expect("Database not initialized")
    }

    pub fn db_path(&self) -> &std::path::Path {
        &self.db_path
    }
}
