use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontEntry {
    pub id: Uuid,
    pub filename: String,
    pub original_name: String,
    pub family_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FontIndex {
    pub fonts: HashMap<Uuid, FontEntry>,
}

pub struct FontLibrary {
    base_dir: PathBuf,
    index: FontIndex,
}

impl FontLibrary {
    pub fn new() -> Self {
        let base_dir = Self::app_data_dir().join("fonts");
        fs::create_dir_all(&base_dir).ok();

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

    fn load_index(base_dir: &Path) -> FontIndex {
        let path = Self::index_path(base_dir);
        if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            FontIndex::default()
        }
    }

    fn save_index(&self) {
        let path = Self::index_path(&self.base_dir);
        if let Ok(json) = serde_json::to_string_pretty(&self.index) {
            fs::write(path, json).ok();
        }
    }

    /// Extract the font family name from a TTF/OTF file by parsing the name table.
    /// Falls back to the filename stem if parsing fails.
    fn extract_family_name(source_path: &Path) -> String {
        if let Ok(data) = fs::read(source_path) {
            if let Some(name) = Self::parse_ttf_family_name(&data) {
                return name;
            }
        }
        // Fallback: use filename stem
        source_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown Font")
            .to_string()
    }

    /// Parse the TTF/OTF name table to extract the font family name (nameID=1).
    fn parse_ttf_family_name(data: &[u8]) -> Option<String> {
        if data.len() < 12 {
            return None;
        }

        // For OTF collections (TTC), just use first font
        let offset_table_start = if &data[0..4] == b"ttcf" {
            if data.len() < 16 {
                return None;
            }
            u32::from_be_bytes([data[12], data[13], data[14], data[15]]) as usize
        } else {
            0
        };

        let base = offset_table_start;
        if data.len() < base + 12 {
            return None;
        }

        let num_tables = u16::from_be_bytes([data[base + 4], data[base + 5]]) as usize;

        // Find 'name' table
        let mut name_offset = 0u32;
        for i in 0..num_tables {
            let record_start = base + 12 + i * 16;
            if data.len() < record_start + 16 {
                return None;
            }
            let tag = &data[record_start..record_start + 4];
            if tag == b"name" {
                name_offset =
                    u32::from_be_bytes([
                        data[record_start + 8],
                        data[record_start + 9],
                        data[record_start + 10],
                        data[record_start + 11],
                    ]);
                break;
            }
        }

        if name_offset == 0 {
            return None;
        }

        let no = name_offset as usize;
        if data.len() < no + 6 {
            return None;
        }

        let count = u16::from_be_bytes([data[no + 2], data[no + 3]]) as usize;
        let string_offset = u16::from_be_bytes([data[no + 4], data[no + 5]]) as usize;
        let strings_start = no + string_offset;

        // Look for nameID=1 (Font Family), prefer platformID=3 (Windows) for Unicode
        let mut best: Option<String> = None;

        for i in 0..count {
            let rec = no + 6 + i * 12;
            if data.len() < rec + 12 {
                break;
            }

            let platform_id = u16::from_be_bytes([data[rec], data[rec + 1]]);
            let name_id = u16::from_be_bytes([data[rec + 6], data[rec + 7]]);
            let length = u16::from_be_bytes([data[rec + 8], data[rec + 9]]) as usize;
            let offset = u16::from_be_bytes([data[rec + 10], data[rec + 11]]) as usize;

            if name_id != 1 {
                continue;
            }

            let start = strings_start + offset;
            let end = start + length;
            if end > data.len() {
                continue;
            }

            let raw = &data[start..end];

            if platform_id == 3 || platform_id == 0 {
                // UTF-16 BE
                let chars: Vec<u16> = raw
                    .chunks_exact(2)
                    .map(|c| u16::from_be_bytes([c[0], c[1]]))
                    .collect();
                if let Ok(s) = String::from_utf16(&chars) {
                    let s = s.trim().to_string();
                    if !s.is_empty() {
                        return Some(s);
                    }
                }
            } else if platform_id == 1 {
                // Mac Roman (ASCII-ish)
                let s = String::from_utf8_lossy(raw).trim().to_string();
                if !s.is_empty() && best.is_none() {
                    best = Some(s);
                }
            }
        }

        best
    }

    pub fn import_font(&mut self, source_path: &Path) -> Result<Uuid, String> {
        let id = Uuid::new_v4();
        let ext = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("ttf");
        let filename = format!("{id}.{ext}");
        let dest = self.base_dir.join(&filename);

        fs::copy(source_path, &dest).map_err(|e| format!("Failed to copy font: {e}"))?;

        let original_name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let family_name = Self::extract_family_name(source_path);

        self.index.fonts.insert(
            id,
            FontEntry {
                id,
                filename,
                original_name,
                family_name,
            },
        );

        self.save_index();
        Ok(id)
    }

    pub fn import_font_with_id(&mut self, id: Uuid, source_path: &Path) -> Result<(), String> {
        if self.index.fonts.contains_key(&id) {
            return Ok(());
        }

        let ext = source_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("ttf");
        let filename = format!("{id}.{ext}");
        let dest = self.base_dir.join(&filename);

        fs::copy(source_path, &dest).map_err(|e| format!("Failed to copy font: {e}"))?;

        let original_name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let family_name = Self::extract_family_name(source_path);

        self.index.fonts.insert(
            id,
            FontEntry {
                id,
                filename,
                original_name,
                family_name,
            },
        );

        self.save_index();
        Ok(())
    }

    pub fn delete_font(&mut self, id: &Uuid) -> Result<(), String> {
        if let Some(entry) = self.index.fonts.remove(id) {
            let path = self.base_dir.join(&entry.filename);
            fs::remove_file(&path).ok();
            self.save_index();
            Ok(())
        } else {
            Err("Font not found".to_string())
        }
    }

    pub fn get_font_path(&self, id: &Uuid) -> Option<PathBuf> {
        self.index
            .fonts
            .get(id)
            .map(|entry| self.base_dir.join(&entry.filename))
    }

    /// Find a font entry by its family name.
    pub fn find_by_family_name(&self, family_name: &str) -> Option<&FontEntry> {
        self.index.fonts.values().find(|e| e.family_name == family_name)
    }

    pub fn list_fonts(&self) -> Vec<&FontEntry> {
        let mut fonts: Vec<_> = self.index.fonts.values().collect();
        fonts.sort_by(|a, b| a.family_name.cmp(&b.family_name));
        fonts
    }

    /// Read font file bytes for a given entry.
    pub fn read_font_bytes(&self, id: &Uuid) -> Option<Vec<u8>> {
        let path = self.get_font_path(id)?;
        fs::read(&path).ok()
    }
}
