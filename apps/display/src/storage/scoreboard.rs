use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use zip::write::SimpleFileOptions;

use crate::components::{ComponentData, ScoreboardComponent};
use crate::serde_helpers::serde_color32;
use crate::storage::assets::AssetLibrary;
use crate::storage::error::StorageError;
use crate::storage::fonts::FontLibrary;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreboardFile {
    pub version: u32,
    pub name: String,
    pub dimensions: (u32, u32),
    #[serde(with = "serde_color32")]
    pub background_color: egui::Color32,
    pub components: Vec<ScoreboardComponent>,
    pub bindings: HashMap<Uuid, String>,
}

pub fn save_scoreboard(file: &ScoreboardFile, path: &Path) -> Result<(), StorageError> {
    let json = serde_json::to_string_pretty(file)?;
    fs::write(path, json)?;
    Ok(())
}

pub fn load_scoreboard(path: &Path) -> Result<ScoreboardFile, StorageError> {
    let json = fs::read_to_string(path)?;
    let file: ScoreboardFile = serde_json::from_str(&json)?;
    if file.version != 1 {
        return Err(StorageError::UnsupportedVersion(file.version));
    }
    Ok(file)
}

fn collect_asset_ids(components: &[ScoreboardComponent]) -> HashSet<Uuid> {
    components
        .iter()
        .filter_map(|c| match &c.data {
            ComponentData::Image { asset_id } => asset_id.as_ref().copied(),
            ComponentData::Background { asset_id, .. } => asset_id.as_ref().copied(),
            _ => None,
        })
        .collect()
}

fn collect_font_families(components: &[ScoreboardComponent]) -> HashSet<String> {
    components
        .iter()
        .filter_map(|c| c.style.font_family.clone())
        .collect()
}

pub fn export_sfbz(
    file: &ScoreboardFile,
    asset_library: &AssetLibrary,
    font_library: &FontLibrary,
    path: &Path,
) -> Result<(), StorageError> {
    let out_file = fs::File::create(path)?;
    let mut zip = zip::ZipWriter::new(out_file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // Write scoreboard.json
    let json = serde_json::to_string_pretty(file)?;
    zip.start_file("scoreboard.json", options)?;
    zip.write_all(json.as_bytes())?;

    // Write referenced assets
    let asset_ids = collect_asset_ids(&file.components);
    for asset_id in &asset_ids {
        if let Some(asset_path) = asset_library.get_asset_path(asset_id) {
            if let Some(filename) = asset_path.file_name().and_then(|n| n.to_str()) {
                let data = fs::read(&asset_path)?;
                zip.start_file(format!("assets/{filename}"), options)?;
                zip.write_all(&data)?;
            }
        }
    }

    // Write referenced fonts
    let font_families = collect_font_families(&file.components);
    for family in &font_families {
        if let Some(entry) = font_library.find_by_family_name(family) {
            if let Some(font_path) = font_library.get_font_path(&entry.id) {
                if let Some(filename) = font_path.file_name().and_then(|n| n.to_str()) {
                    let data = fs::read(&font_path)?;
                    zip.start_file(format!("fonts/{filename}"), options)?;
                    zip.write_all(&data)?;
                }
            }
        }
    }

    zip.finish()?;
    Ok(())
}

pub fn import_sfbz(
    path: &Path,
    asset_library: &mut AssetLibrary,
    font_library: &mut FontLibrary,
) -> Result<ScoreboardFile, StorageError> {
    let zip_file = fs::File::open(path)?;
    let mut archive = zip::ZipArchive::new(zip_file)?;

    // Read scoreboard.json
    let file: ScoreboardFile = {
        let mut entry = archive.by_name("scoreboard.json")?;
        let mut json = String::new();
        entry.read_to_string(&mut json)?;
        let f: ScoreboardFile = serde_json::from_str(&json)?;
        if f.version != 1 {
            return Err(StorageError::UnsupportedVersion(f.version));
        }
        f
    };

    // Import assets and fonts
    let temp_dir = std::env::temp_dir().join(format!("sfbz-import-{}", Uuid::new_v4()));
    fs::create_dir_all(&temp_dir)?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let name = entry.name().to_string();

        if let Some(filename) = name.strip_prefix("assets/") {
            if filename.is_empty() {
                continue;
            }
            // Extract UUID from filename (e.g. "uuid.png")
            let stem = Path::new(filename)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            let Ok(asset_id) = Uuid::parse_str(stem) else {
                continue;
            };

            let temp_path = temp_dir.join(filename);
            let mut data = Vec::new();
            entry.read_to_end(&mut data)?;
            fs::write(&temp_path, &data)?;

            asset_library.import_image_with_id(asset_id, &temp_path)?;
        } else if let Some(filename) = name.strip_prefix("fonts/") {
            if filename.is_empty() {
                continue;
            }
            // Extract UUID from filename (e.g. "uuid.ttf")
            let stem = Path::new(filename)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            let Ok(font_id) = Uuid::parse_str(stem) else {
                continue;
            };

            let temp_path = temp_dir.join(filename);
            let mut data = Vec::new();
            entry.read_to_end(&mut data)?;
            fs::write(&temp_path, &data)?;

            font_library.import_font_with_id(font_id, &temp_path)?;
        }
    }

    // Cleanup temp dir
    if let Err(e) = fs::remove_dir_all(&temp_dir) {
        tracing::warn!("Failed to remove temp dir {}: {e}", temp_dir.display());
    }

    Ok(file)
}

// --- App Config ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub recent_files: Vec<PathBuf>,
    pub last_convex_url: Option<String>,
    pub last_api_key: Option<String>,
    pub grid_size: f32,
    pub grid_enabled: bool,
    pub snap_to_grid: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            recent_files: Vec::new(),
            last_convex_url: None,
            last_api_key: None,
            grid_size: 20.0,
            grid_enabled: true,
            snap_to_grid: true,
        }
    }
}

impl AppConfig {
    fn config_path() -> PathBuf {
        directories::ProjectDirs::from("com", "tempuz", "scoreforge-display")
            .map(|dirs| dirs.data_dir().join("config.json"))
            .unwrap_or_else(|| PathBuf::from("config.json"))
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            Self::default()
        }
    }

    pub fn save(&self) {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                tracing::warn!("Failed to create config directory {}: {e}", parent.display());
                return;
            }
        }
        match serde_json::to_string_pretty(self) {
            Ok(json) => {
                if let Err(e) = fs::write(&path, json) {
                    tracing::warn!("Failed to write config {}: {e}", path.display());
                }
            }
            Err(e) => {
                tracing::warn!("Failed to serialize config: {e}");
            }
        }
    }

    pub fn add_recent_file(&mut self, path: PathBuf) {
        self.recent_files.retain(|p| p != &path);
        self.recent_files.insert(0, path);
        self.recent_files.truncate(10);
        self.save();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::components::{ComponentData, ComponentType, ScoreboardComponent};
    use egui::{Color32, Vec2};

    fn make_test_file() -> ScoreboardFile {
        ScoreboardFile {
            version: 1,
            name: "Test Board".to_string(),
            dimensions: (1920, 1080),
            background_color: Color32::BLACK,
            components: vec![],
            bindings: HashMap::new(),
        }
    }

    #[test]
    fn collect_asset_ids_empty() {
        let ids = collect_asset_ids(&[]);
        assert!(ids.is_empty());
    }

    #[test]
    fn collect_asset_ids_with_image_assets() {
        let id1 = Uuid::new_v4();
        let id2 = Uuid::new_v4();
        let mut comp1 = ScoreboardComponent::new(
            ComponentType::Image,
            Vec2::new(0.0, 0.0),
            Vec2::new(100.0, 100.0),
        );
        comp1.data = ComponentData::Image {
            asset_id: Some(id1),
        };

        let mut comp2 = ScoreboardComponent::new(
            ComponentType::Background,
            Vec2::new(0.0, 0.0),
            Vec2::new(100.0, 100.0),
        );
        comp2.data = ComponentData::Background {
            asset_id: Some(id2),
            color: Color32::GREEN,
        };

        let ids = collect_asset_ids(&[comp1, comp2]);
        assert_eq!(ids.len(), 2);
        assert!(ids.contains(&id1));
        assert!(ids.contains(&id2));
    }

    #[test]
    fn collect_asset_ids_skips_non_asset_components() {
        let comp = ScoreboardComponent::new(
            ComponentType::Text,
            Vec2::new(0.0, 0.0),
            Vec2::new(100.0, 100.0),
        );
        let ids = collect_asset_ids(&[comp]);
        assert!(ids.is_empty());
    }

    #[test]
    fn collect_asset_ids_skips_none_assets() {
        let comp = ScoreboardComponent::new(
            ComponentType::Image,
            Vec2::new(0.0, 0.0),
            Vec2::new(100.0, 100.0),
        );
        // Default Image has asset_id: None
        let ids = collect_asset_ids(&[comp]);
        assert!(ids.is_empty());
    }

    #[test]
    fn save_and_load_round_trip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.json");

        let file = make_test_file();
        save_scoreboard(&file, &path).unwrap();
        let loaded = load_scoreboard(&path).unwrap();

        assert_eq!(loaded.version, 1);
        assert_eq!(loaded.name, "Test Board");
        assert_eq!(loaded.dimensions, (1920, 1080));
        assert!(loaded.components.is_empty());
    }

    #[test]
    fn load_rejects_unsupported_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("test.json");

        let mut file = make_test_file();
        file.version = 99;
        let json = serde_json::to_string_pretty(&file).unwrap();
        fs::write(&path, json).unwrap();

        let result = load_scoreboard(&path);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Unsupported file version"));
    }

    #[test]
    fn app_config_add_recent_file_deduplicates() {
        let mut config = AppConfig::default();
        let path1 = PathBuf::from("/tmp/a.json");
        let path2 = PathBuf::from("/tmp/b.json");

        // We don't call add_recent_file because it calls save() which writes to disk.
        // Instead test the logic directly.
        config.recent_files.push(path1.clone());
        config.recent_files.push(path2.clone());

        // Simulate add_recent_file logic without save()
        config.recent_files.retain(|p| p != &path1);
        config.recent_files.insert(0, path1.clone());
        config.recent_files.truncate(10);

        assert_eq!(config.recent_files.len(), 2);
        assert_eq!(config.recent_files[0], path1);
        assert_eq!(config.recent_files[1], path2);
    }
}
