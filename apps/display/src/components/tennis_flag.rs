use egui::Rect;

use crate::data::live_data::TennisLiveData;
use crate::flags::FlagCache;

pub fn render_tennis_flag(
    painter: &egui::Painter,
    rect: Rect,
    player_number: u8,
    live_data: Option<&TennisLiveData>,
    flag_cache: &FlagCache,
) {
    let nationality = if let Some(data) = live_data {
        match player_number {
            1 => data.player1_nationality.as_deref(),
            2 => data.player2_nationality.as_deref(),
            _ => None,
        }
    } else {
        // Designer preview — show a placeholder flag
        Some("us")
    };

    if let Some(code) = nationality {
        let code_lower = code.to_lowercase();
        if let Some(texture) = flag_cache.get(&code_lower) {
            let uv = Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0));
            painter.image(texture.id(), rect, uv, egui::Color32::WHITE);
        }
        // If no texture found, render nothing (graceful fallback)
    }
}
