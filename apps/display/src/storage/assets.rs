use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::storage::error::StorageError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetEntry {
    pub id: Uuid,
    pub filename: String,
    pub original_name: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AssetIndex {
    pub assets: HashMap<Uuid, AssetEntry>,
}

/// Manages imported image assets on disk with an index for lookup by UUID.
pub struct AssetLibrary {
    base_dir: PathBuf,
    index: AssetIndex,
}

impl AssetLibrary {
    pub fn new() -> Self {
        let base_dir = Self::app_data_dir().join("assets");
        if let Err(e) = fs::create_dir_all(&base_dir) {
            tracing::warn!("Failed to create assets directory {}: {e}", base_dir.display());
        }

        let index = Self::load_index(&base_dir);

        Self { base_dir, index }
    }

    fn app_data_dir() -> PathBuf {
        directories::ProjectDirs::from("com", "tempuz", "scoreforge-display")
            .map(|dirs| dirs.data_dir().to_path_buf())
            .unwrap_or_else(|| PathBuf::from("."))
    }

    fn index_path(base_dir: &Path) -> PathBuf {
        base_dir.join("index.json")
    }

    fn load_index(base_dir: &Path) -> AssetIndex {
        let path = Self::index_path(base_dir);
        if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            AssetIndex::default()
        }
    }

    fn save_index(&self) {
        let path = Self::index_path(&self.base_dir);
        match serde_json::to_string_pretty(&self.index) {
            Ok(json) => {
                if let Err(e) = fs::write(&path, json) {
                    tracing::warn!("Failed to write asset index {}: {e}", path.display());
                }
            }
            Err(e) => {
                tracing::warn!("Failed to serialize asset index: {e}");
            }
        }
    }

    pub fn import_image(&mut self, source_path: &Path) -> Result<Uuid, StorageError> {
        let img = image::open(source_path)?;
        let (width, height) = (img.width(), img.height());

        let id = Uuid::new_v4();
        let ext = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("png");
        let filename = format!("{id}.{ext}");
        let dest = self.base_dir.join(&filename);

        fs::copy(source_path, &dest)?;

        let original_name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        self.index.assets.insert(
            id,
            AssetEntry {
                id,
                filename,
                original_name,
                width,
                height,
            },
        );

        self.save_index();
        Ok(id)
    }

    pub fn delete_asset(&mut self, id: &Uuid) -> Result<(), StorageError> {
        if let Some(entry) = self.index.assets.remove(id) {
            let path = self.base_dir.join(&entry.filename);
            if let Err(e) = fs::remove_file(&path) {
                tracing::warn!("Failed to remove asset file {}: {e}", path.display());
            }
            self.save_index();
            Ok(())
        } else {
            Err(StorageError::NotFound("Asset not found".to_string()))
        }
    }

    pub fn get_asset_path(&self, id: &Uuid) -> Option<PathBuf> {
        self.index
            .assets
            .get(id)
            .map(|entry| self.base_dir.join(&entry.filename))
    }

    pub fn import_image_with_id(&mut self, id: Uuid, source_path: &Path) -> Result<(), StorageError> {
        if self.index.assets.contains_key(&id) {
            return Ok(());
        }

        let img = image::open(source_path)?;
        let (width, height) = (img.width(), img.height());

        let ext = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("png");
        let filename = format!("{id}.{ext}");
        let dest = self.base_dir.join(&filename);

        fs::copy(source_path, &dest)?;

        let original_name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        self.index.assets.insert(
            id,
            AssetEntry {
                id,
                filename,
                original_name,
                width,
                height,
            },
        );

        self.save_index();
        Ok(())
    }

    pub fn list_assets(&self) -> Vec<&AssetEntry> {
        self.index.assets.values().collect()
    }

}
