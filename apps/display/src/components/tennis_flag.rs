use egui::{epaint::Mesh, Color32, Pos2, Rect, Shape, TextureId};

use crate::components::FlagShape;
use crate::data::live_data::TennisLiveData;
use crate::flags::FlagCache;

pub fn render_tennis_flag(
    painter: &egui::Painter,
    rect: Rect,
    player_number: u8,
    flag_shape: FlagShape,
    border_color: Color32,
    border_width: f32,
    opacity: f32,
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
            let tint = Color32::from_rgba_unmultiplied(255, 255, 255, (opacity * 255.0) as u8);
            match flag_shape {
                FlagShape::Circle => {
                    paint_circular_flag(painter, rect, texture.id(), tint, border_color, border_width);
                }
                FlagShape::Rectangle => {
                    paint_rect_flag(painter, rect, texture.id(), tint, border_color, border_width);
                }
            }
        }
    }
}

/// Draw a flag texture as a simple rectangle.
fn paint_rect_flag(
    painter: &egui::Painter,
    rect: Rect,
    texture_id: TextureId,
    tint: Color32,
    border_color: Color32,
    border_width: f32,
) {
    let uv = Rect::from_min_max(Pos2::new(0.0, 0.0), Pos2::new(1.0, 1.0));
    painter.image(texture_id, rect, uv, tint);

    if border_width > 0.0 {
        painter.rect_stroke(
            rect,
            0.0,
            egui::Stroke::new(border_width, border_color),
            egui::epaint::StrokeKind::Outside,
        );
    }
}

/// Draw a flag texture clipped to a circle inscribed in `rect`.
fn paint_circular_flag(
    painter: &egui::Painter,
    rect: Rect,
    texture_id: TextureId,
    tint: Color32,
    border_color: Color32,
    border_width: f32,
) {
    let center = rect.center();
    let radius = rect.width().min(rect.height()) * 0.5;

    // Number of segments for the circle — 64 gives a smooth edge
    const SEGMENTS: usize = 64;

    let mut mesh = Mesh::with_texture(texture_id);

    // Center vertex
    let center_uv = Pos2::new(0.5, 0.5);
    mesh.vertices.push(egui::epaint::Vertex {
        pos: center,
        uv: center_uv,
        color: tint,
    });

    // Perimeter vertices
    for i in 0..=SEGMENTS {
        let angle = (i as f32 / SEGMENTS as f32) * std::f32::consts::TAU;
        let dx = angle.cos();
        let dy = angle.sin();

        let pos = Pos2::new(center.x + radius * dx, center.y + radius * dy);

        // Map position to UV: center is (0.5, 0.5), edges go from 0 to 1
        let uv = Pos2::new(0.5 + 0.5 * dx, 0.5 + 0.5 * dy);

        mesh.vertices.push(egui::epaint::Vertex {
            pos,
            uv,
            color: tint,
        });
    }

    // Triangles: center (0) to each pair of adjacent perimeter vertices
    for i in 0..SEGMENTS {
        mesh.indices.push(0);
        mesh.indices.push((i + 1) as u32);
        mesh.indices.push((i + 2) as u32);
    }

    painter.add(Shape::mesh(mesh));

    // Border stroke around the circle
    if border_width > 0.0 {
        painter.circle_stroke(center, radius, egui::Stroke::new(border_width, border_color));
    }
}
