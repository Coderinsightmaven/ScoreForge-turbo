use crate::components::ComponentData;
use crate::data::convex::ConvexManager;
use crate::data::live_data::{ConnectionStep, LiveDataCommand};
use crate::state::AppState;
use crate::storage::fonts::FontEntry;

pub fn show_display_panel(ui: &mut egui::Ui, state: &mut AppState) {
    ui.heading("Display");
    ui.separator();

    // --- All Scoreboards overview (only when 2+ projects open) ---
    if state.projects.len() >= 2 {
        let header = format!("All Scoreboards ({} open)", state.projects.len());
        let id = ui.make_persistent_id("all_scoreboards_overview");
        egui::collapsing_header::CollapsingState::load_with_default_open(ui.ctx(), id, true)
            .show_header(ui, |ui| {
                ui.label(egui::RichText::new(header).strong());
            })
            .body(|ui| {
                let mut switch_to: Option<usize> = None;
                for (i, project) in state.projects.iter().enumerate() {
                    let status_color = match &project.connection_step {
                        ConnectionStep::Live => egui::Color32::GREEN,
                        ConnectionStep::Disconnected => egui::Color32::from_gray(100),
                        _ => egui::Color32::YELLOW,
                    };
                    let status_label = match &project.connection_step {
                        ConnectionStep::Disconnected => "Disconnected",
                        ConnectionStep::Pairing => "Pairing",
                        ConnectionStep::Connecting => "Connecting",
                        ConnectionStep::SelectTournament | ConnectionStep::SelectCourt => {
                            "Selecting"
                        }
                        ConnectionStep::Live => "Live",
                    };
                    let is_active = i == state.active_index;

                    ui.horizontal(|ui| {
                        ui.colored_label(status_color, "\u{25cf}");
                        let name_text = egui::RichText::new(&project.scoreboard.name)
                            .underline();
                        let name_text = if is_active {
                            name_text.strong()
                        } else {
                            name_text
                        };
                        if ui.link(name_text).clicked() && !is_active {
                            switch_to = Some(i);
                        }
                        ui.label(
                            egui::RichText::new(format!("[{status_label}]"))
                                .small()
                                .color(status_color),
                        );
                        if project.display_active {
                            ui.label(
                                egui::RichText::new("\u{25b6}")
                                    .small()
                                    .color(egui::Color32::from_rgb(100, 200, 100)),
                            );
                        }
                    });
                }
                if let Some(idx) = switch_to {
                    state.active_index = idx;
                }
            });
        ui.separator();
    }

    // --- Connection section ---
    ui.label(egui::RichText::new("Connection").strong());

    let connection_step = state.active_project().connection_step;

    let has_url = !state.connect_url.is_empty();

    match &connection_step {
        ConnectionStep::Disconnected => {
            ui.horizontal(|ui| {
                ui.colored_label(egui::Color32::from_rgb(150, 150, 150), "\u{25cf}");
                ui.label("Disconnected");
            });
            if has_url {
                if ui.button("Connect").clicked() {
                    // Open the per-tab match selection dialog, which auto-connects
                    state.active_project_mut().show_connect_dialog = true;
                }
            } else {
                ui.label("No credentials configured.");
                if ui.button("Set Credentials").clicked() {
                    state.show_connect_dialog = true;
                }
            }
        }
        ConnectionStep::Connecting => {
            ui.horizontal(|ui| {
                ui.colored_label(egui::Color32::YELLOW, "\u{25cf}");
                ui.label("Connecting...");
            });
        }
        ConnectionStep::Pairing => {
            ui.horizontal(|ui| {
                ui.colored_label(egui::Color32::YELLOW, "\u{25cf}");
                ui.label("Pairing...");
            });
            if ui.button("Open Pairing").clicked() {
                state.active_project_mut().show_connect_dialog = true;
            }
            if ui.button("Disconnect").clicked() {
                if let Some(manager) = &state.active_project().convex_manager {
                    manager.send_command(LiveDataCommand::Disconnect);
                }
            }
        }
        ConnectionStep::SelectTournament | ConnectionStep::SelectCourt => {
            ui.horizontal(|ui| {
                ui.colored_label(egui::Color32::YELLOW, "\u{25cf}");
                ui.label("Selecting...");
            });
            if ui.button("Open Selection").clicked() {
                state.active_project_mut().show_connect_dialog = true;
            }
            if ui.button("Disconnect").clicked() {
                if let Some(manager) = &state.active_project().convex_manager {
                    manager.send_command(LiveDataCommand::Disconnect);
                }
            }
        }
        ConnectionStep::Live => {
            ui.horizontal(|ui| {
                ui.colored_label(egui::Color32::GREEN, "\u{25cf}");
                ui.label("Connected");
            });
            if ui.button("Disconnect").clicked() {
                if let Some(manager) = &state.active_project().convex_manager {
                    manager.send_command(LiveDataCommand::Disconnect);
                }
            }
        }
    }

    if ui.button("Settings").clicked() {
        state.show_connect_dialog = true;
    }

    ui.separator();

    // --- Court feed section (visible when connected) ---
    if connection_step == ConnectionStep::Live {
        ui.label(egui::RichText::new("Court Feed").strong());

        let project = state.active_project();
        if let Some(court) = &project.selected_court {
            ui.label(format!("Court: {court}"));
        }
        if let Some(data) = &project.live_match_data {
            ui.label(format!("{} vs {}", data.player1_name, data.player2_name));
        } else {
            ui.label("Waiting for an active match on this court...");
        }

        if ui.button("Change Court").clicked() {
            // Go back to tournament selection, reconnect using global credentials
            let url = state.connect_url.clone();
            let api_key = state.connect_api_key.clone();
            let project = state.active_project_mut();
            project.connection_step = ConnectionStep::SelectTournament;
            project.show_connect_dialog = true;
            // Re-connect to refresh tournament list
            let manager = ConvexManager::new();
            manager.send_command(LiveDataCommand::Connect { url, api_key });
            project.convex_manager = Some(manager);
        }

        ui.separator();
    }

    // --- Scoreboard swap ---
    ui.label(egui::RichText::new("Scoreboard").strong());

    {
        let project = state.active_project();
        if let Some(path) = &project.current_file {
            ui.label(
                path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| "Untitled".to_string()),
            );
        } else {
            ui.label(&project.scoreboard.name);
        }
    }

    if ui.button("Swap Scoreboard").clicked() {
        if let Some(path) = rfd::FileDialog::new()
            .set_title("Swap Scoreboard")
            .add_filter("ScoreForge Board", &["sfb"])
            .pick_file()
        {
            match crate::storage::scoreboard::load_scoreboard(&path) {
                Ok(file) => {
                    let project = state.active_project_mut();
                    project.scoreboard.name = file.name;
                    project.scoreboard.width = file.dimensions.0;
                    project.scoreboard.height = file.dimensions.1;
                    project.scoreboard.background_color = file.background_color;
                    project.components = file.components;
                    project.component_bindings = file.bindings;
                    project.selected_ids.clear();
                    project.undo_stack.clear();
                    project.current_file = Some(path.clone());
                    project.is_dirty = false;
                    project.needs_fit_to_view = true;
                    project.display_needs_sync = true;
                    if let Ok(mut ds) = project.display_state.lock() {
                        ds.needs_resize = true;
                    }
                    state.config.add_recent_file(path);
                    state.push_toast("Scoreboard swapped".to_string(), false);
                }
                Err(e) => {
                    state.push_toast(format!("Swap failed: {e}"), true);
                }
            }
        }
    }

    ui.separator();

    // --- Display section ---
    ui.label(egui::RichText::new("Display Window").strong());

    let display_active = state.active_project().display_active;

    if display_active {
        if ui.button("Close Display").clicked() {
            let project = state.active_project_mut();
            project.display_active = false;
            if let Ok(mut ds) = project.display_state.lock() {
                ds.should_close = true;
            }
        }
    } else if ui.button("Launch Display").clicked() {
        let project = state.active_project_mut();
        project.display_active = true;
        project.display_needs_sync = true;
    }

    let project = state.active_project_mut();

    ui.checkbox(&mut project.display_fullscreen, "Fullscreen");

    // Monitor selector
    let monitors = state.monitors.clone();
    let project = state.active_project_mut();

    if monitors.is_empty() {
        ui.label("No monitors detected");
    } else {
        let current_label = match project.selected_monitor {
            Some(idx) if idx < monitors.len() => {
                let m = &monitors[idx];
                format!("{} ({}x{}) @{}x", m.name, m.width, m.height, m.scale_factor)
            }
            _ => "Select monitor...".to_string(),
        };

        egui::ComboBox::from_label("Monitor")
            .selected_text(current_label)
            .show_ui(ui, |ui| {
                for (i, monitor) in monitors.iter().enumerate() {
                    let label = format!(
                        "{} ({}x{}) @{}x",
                        monitor.name, monitor.width, monitor.height, monitor.scale_factor,
                    );
                    if ui
                        .selectable_value(&mut project.selected_monitor, Some(i), label)
                        .clicked()
                    {
                        project.display_offset_x = monitor.x.to_string();
                        project.display_offset_y = monitor.y.to_string();
                        if let Ok(mut ds) = project.display_state.lock() {
                            ds.target_scale_factor = monitor.scale_factor;
                            ds.needs_resize = true;
                        }
                    }
                }
            });
    }

    if ui.small_button("Refresh monitors").clicked() {
        state.monitors = AppState::detect_monitors();
    }

    if !state.active_project().display_fullscreen {
        let project = state.active_project_mut();
        ui.horizontal(|ui| {
            ui.label("X:");
            let offset_x_response = ui
                .add(egui::TextEdit::singleline(&mut project.display_offset_x).desired_width(50.0));
            if offset_x_response.changed() {
                project.display_offset_x = sanitize_int_input(&project.display_offset_x);
            }
        });
        ui.horizontal(|ui| {
            ui.label("Y:");
            let offset_y_response = ui
                .add(egui::TextEdit::singleline(&mut project.display_offset_y).desired_width(50.0));
            if offset_y_response.changed() {
                project.display_offset_y = sanitize_int_input(&project.display_offset_y);
            }
        });
    }

    ui.separator();

    // --- Fonts section (global) ---
    ui.label(egui::RichText::new("Fonts").strong());

    let font_action = show_font_list(ui, &state.font_library.list_fonts());

    match font_action {
        FontListAction::None => {}
        FontListAction::Import => {
            if let Some(path) = rfd::FileDialog::new()
                .add_filter("Fonts", &["ttf", "otf"])
                .pick_file()
            {
                match state.font_library.import_font(&path) {
                    Ok(_id) => {
                        // Look up the family name of the font we just imported
                        let family_name = state
                            .font_library
                            .list_fonts()
                            .iter()
                            .find(|e| e.id == _id)
                            .map(|e| e.family_name.clone());

                        // Apply to all eligible components in all open projects
                        if let Some(family) = &family_name {
                            for project in &mut state.projects {
                                for comp in &mut project.components {
                                    let eligible = matches!(
                                        comp.data,
                                        ComponentData::Text { .. }
                                            | ComponentData::TennisScore { .. }
                                            | ComponentData::TennisName { .. }
                                            | ComponentData::TennisDoubles { .. }
                                            | ComponentData::TennisMatchTime
                                    );
                                    if eligible {
                                        comp.style.font_family = Some(family.clone());
                                    }
                                }
                                project.is_dirty = true;
                            }
                        }

                        // Register with egui immediately so the font is available
                        // for rendering in this same frame
                        state.register_fonts(ui.ctx());
                        state.fonts_changed = false;
                        state.push_toast("Font imported and applied".to_string(), false);
                    }
                    Err(e) => {
                        state.push_toast(format!("Font import failed: {e}"), true);
                    }
                }
            }
        }
        FontListAction::Delete(id) => {
            if let Some(entry) = state.font_library.list_fonts().iter().find(|e| e.id == id) {
                let family = entry.family_name.clone();
                for project in &mut state.projects {
                    for comp in &mut project.components {
                        if comp.style.font_family.as_deref() == Some(&family) {
                            comp.style.font_family = None;
                        }
                    }
                }
            }
            state.font_library.delete_font(&id).ok();
            // Re-register immediately so stale font families are cleared
            // before the canvas renders this frame
            state.register_fonts(ui.ctx());
            state.fonts_changed = false;
            state.push_toast("Font deleted".to_string(), false);
        }
    }
}

enum FontListAction {
    None,
    Import,
    Delete(uuid::Uuid),
}

fn show_font_list(ui: &mut egui::Ui, font_list: &[&FontEntry]) -> FontListAction {
    let mut action = FontListAction::None;

    if font_list.is_empty() {
        ui.label(
            egui::RichText::new("No custom fonts imported")
                .color(egui::Color32::from_gray(120)),
        );
    } else {
        for (i, entry) in font_list.iter().enumerate() {
            ui.horizontal(|ui| {
                if i == 0 {
                    ui.label(format!("{} (default)", entry.family_name));
                } else {
                    ui.label(&entry.family_name);
                }
                if ui.small_button("X").on_hover_text("Delete font").clicked() {
                    action = FontListAction::Delete(entry.id);
                }
            });
        }
    }

    if ui.button("Import Font (.ttf, .otf)").clicked() {
        action = FontListAction::Import;
    }

    action
}

fn sanitize_int_input(input: &str) -> String {
    let mut result = String::new();
    for (i, c) in input.chars().enumerate() {
        if c == '-' && i == 0 {
            result.push(c);
        } else if c.is_ascii_digit() {
            result.push(c);
        }
    }
    result
}
