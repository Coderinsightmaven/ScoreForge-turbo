/// Typed error for all storage operations (save, load, import, export).
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Image error: {0}")]
    Image(#[from] image::ImageError),
    #[error("Zip error: {0}")]
    Zip(#[from] zip::result::ZipError),
    #[error("Unsupported file version: {0}")]
    UnsupportedVersion(u32),
    #[error("{0}")]
    NotFound(String),
}
