use egui::Vec2;

use crate::components::{ComponentData, ComponentType, ScoreboardComponent};
use crate::state::AppState;

pub fn show_component_library(ui: &mut egui::Ui, state: &mut AppState) {
    ui.heading("Components");
    ui.separator();

    ui.label("Static");
    for ct in &[
        ComponentType::Text,
        ComponentType::Image,
        ComponentType::Background,
    ] {
        if ui.button(ct.label()).clicked() {
            add_component(state, *ct);
        }
    }

    ui.separator();
    ui.label("Tennis");
    for ct in &[
        ComponentType::TennisGameScore,
        ComponentType::TennisSetScore,
        ComponentType::TennisMatchScore,
        ComponentType::TennisPlayerName,
        ComponentType::TennisDoublesName,
        ComponentType::TennisServingIndicator,
        ComponentType::TennisMatchTime,
        ComponentType::TennisPlayerFlag,
    ] {
        if ui.button(ct.label()).clicked() {
            add_component(state, *ct);
        }
    }
}

fn add_component(state: &mut AppState, component_type: ComponentType) {
    // Snapshot default font before mutable project borrow
    let default_font = state
        .font_library
        .list_fonts()
        .first()
        .map(|e| e.family_name.clone());

    let project = state.active_project_mut();
    project.push_undo();

    let default_size = match component_type {
        ComponentType::Background => Vec2::new(
            project.scoreboard.width as f32,
            project.scoreboard.height as f32,
        ),
        ComponentType::Text => Vec2::new(200.0, 50.0),
        ComponentType::Image => Vec2::new(200.0, 200.0),
        ComponentType::TennisServingIndicator => Vec2::new(30.0, 30.0),
        ComponentType::TennisPlayerFlag => Vec2::new(60.0, 40.0),
        _ => Vec2::new(120.0, 60.0),
    };

    let center = Vec2::new(
        project.scoreboard.width as f32 / 2.0 - default_size.x / 2.0,
        project.scoreboard.height as f32 / 2.0 - default_size.y / 2.0,
    );

    let max_z = project
        .components
        .iter()
        .map(|c| c.z_index)
        .max()
        .unwrap_or(0);

    let mut component = ScoreboardComponent::new(component_type, center, default_size);
    component.z_index = max_z + 1;

    // Apply default font from library to text-eligible components
    if let Some(font) = default_font {
        let has_text_style = matches!(
            component.data,
            ComponentData::Text { .. }
                | ComponentData::TennisScore { .. }
                | ComponentData::TennisName { .. }
                | ComponentData::TennisDoubles { .. }
                | ComponentData::TennisMatchTime
        );
        if has_text_style {
            component.style.font_family = Some(font);
        }
    }

    project.selected_ids.clear();
    project.selected_ids.insert(component.id);
    project.components.push(component);
    project.is_dirty = true;
}
