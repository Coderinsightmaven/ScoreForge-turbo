use std::sync::{Arc, Mutex};

use crate::components::{ComponentData, TextureCache};
use crate::data::convex::ConvexManager;
use crate::data::live_data::{ConnectionStep, LiveDataCommand};
use crate::designer::{canvas, component_library, property_panel, toolbar};
use crate::display::renderer::{DisplayState, show_display_viewport};
use crate::state::{AppState, ProjectState, Scoreboard};

pub struct ScoreForgeApp {
    state: AppState,
    display_state: Arc<Mutex<DisplayState>>,
}

impl ScoreForgeApp {
    pub fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        let state = AppState::new();
        let display_state = Arc::new(Mutex::new(DisplayState {
            scoreboard: Scoreboard::default(),
            components: Vec::new(),
            live_data: None,
            texture_cache: TextureCache::new(),
            should_close: false,
            fullscreen: false,
            offset_x: 0,
            offset_y: 0,
        }));

        Self {
            state,
            display_state,
        }
    }

    fn show_dialogs(&mut self, ctx: &egui::Context) {
        self.show_new_dialog(ctx);
        self.show_connect_dialog(ctx);
    }

    fn show_new_dialog(&mut self, ctx: &egui::Context) {
        if !self.state.show_new_dialog {
            return;
        }

        egui::Window::new("New Scoreboard")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label("Name:");
                    ui.text_edit_singleline(&mut self.state.new_name);
                });
                ui.horizontal(|ui| {
                    ui.label("Width:");
                    ui.text_edit_singleline(&mut self.state.new_width);
                });
                ui.horizontal(|ui| {
                    ui.label("Height:");
                    ui.text_edit_singleline(&mut self.state.new_height);
                });
                ui.horizontal(|ui| {
                    if ui.button("Create").clicked() {
                        let width: u32 = self.state.new_width.parse().unwrap_or(1920);
                        let height: u32 = self.state.new_height.parse().unwrap_or(1080);
                        let project =
                            ProjectState::new(self.state.new_name.clone(), width, height);
                        self.state.projects.push(project);
                        self.state.active_index = self.state.projects.len() - 1;
                        self.state.show_new_dialog = false;
                    }
                    if ui.button("Cancel").clicked() {
                        self.state.show_new_dialog = false;
                    }
                });
            });
    }

    fn show_connect_dialog(&mut self, ctx: &egui::Context) {
        if !self.state.show_connect_dialog {
            return;
        }

        egui::Window::new("Connect to ScoreForge")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .show(ctx, |ui| match &self.state.connection_step {
                ConnectionStep::Disconnected | ConnectionStep::Connecting => {
                    ui.label("Enter your Convex deployment URL and API key:");
                    ui.horizontal(|ui| {
                        ui.label("URL:");
                        ui.text_edit_singleline(&mut self.state.connect_url);
                    });
                    ui.horizontal(|ui| {
                        ui.label("API Key:");
                        ui.text_edit_singleline(&mut self.state.connect_api_key);
                    });
                    ui.horizontal(|ui| {
                        if ui.button("Connect").clicked() {
                            let manager = ConvexManager::new();
                            manager.send_command(LiveDataCommand::Connect {
                                url: self.state.connect_url.clone(),
                                api_key: self.state.connect_api_key.clone(),
                            });
                            self.state.convex_manager = Some(manager);
                            self.state.connection_step = ConnectionStep::Connecting;
                            self.state.config.last_convex_url =
                                Some(self.state.connect_url.clone());
                            self.state.config.save();
                        }
                        if ui.button("Cancel").clicked() {
                            self.state.show_connect_dialog = false;
                        }
                    });
                }
                ConnectionStep::SelectTournament => {
                    ui.label("Select a tournament:");
                    if self.state.tournament_list.is_empty() {
                        ui.spinner();
                        ui.label("Loading tournaments...");
                    }
                    for t in self.state.tournament_list.clone() {
                        if ui.button(format!("{} ({})", t.name, t.status)).clicked() {
                            if let Some(manager) = &self.state.convex_manager {
                                manager
                                    .send_command(LiveDataCommand::SelectTournament(t.id.clone()));
                            }
                            if self.state.has_projects() {
                                self.state.active_project_mut().selected_tournament_id =
                                    Some(t.id);
                            }
                        }
                    }
                    if ui.button("Back").clicked() {
                        self.state.connection_step = ConnectionStep::Disconnected;
                    }
                }
                ConnectionStep::SelectMatch => {
                    ui.label("Select a match:");
                    if self.state.match_list.is_empty() {
                        ui.spinner();
                        ui.label("Loading matches...");
                    }
                    for m in self.state.match_list.clone() {
                        let court_str = m
                            .court
                            .as_deref()
                            .map(|c| format!(" - Court {c}"))
                            .unwrap_or_default();
                        let label = format!(
                            "{} vs {} ({}){}",
                            m.player1_name, m.player2_name, m.status, court_str
                        );
                        if ui.button(&label).clicked() {
                            if let Some(manager) = &self.state.convex_manager {
                                manager.send_command(LiveDataCommand::SelectMatch(m.id.clone()));
                            }
                            if self.state.has_projects() {
                                self.state.active_project_mut().selected_match_id = Some(m.id);
                            }
                            self.state.show_connect_dialog = false;
                        }
                    }
                    if ui.button("Back").clicked() {
                        self.state.connection_step = ConnectionStep::SelectTournament;
                    }
                }
                ConnectionStep::Live => {
                    ui.colored_label(egui::Color32::GREEN, "Connected - receiving live data");
                    if ui.button("Disconnect").clicked() {
                        if let Some(manager) = &self.state.convex_manager {
                            manager.send_command(LiveDataCommand::Disconnect);
                        }
                        self.state.connection_step = ConnectionStep::Disconnected;
                        self.state.show_connect_dialog = false;
                    }
                }
            });
    }

    fn show_toasts(&mut self, ctx: &egui::Context) {
        // Remove expired toasts (older than 3 seconds)
        self.state
            .toasts
            .retain(|t| t.created_at.elapsed().as_secs() < 3);

        if self.state.toasts.is_empty() {
            return;
        }

        egui::Area::new(egui::Id::new("toasts"))
            .anchor(egui::Align2::RIGHT_BOTTOM, [-10.0, -10.0])
            .show(ctx, |ui| {
                for toast in &self.state.toasts {
                    let color = if toast.is_error {
                        egui::Color32::from_rgb(220, 50, 50)
                    } else {
                        egui::Color32::from_rgb(50, 180, 50)
                    };
                    egui::Frame::NONE
                        .fill(egui::Color32::from_gray(30))
                        .stroke(egui::Stroke::new(1.0, color))
                        .inner_margin(8.0)
                        .corner_radius(4.0)
                        .show(ui, |ui| {
                            ui.colored_label(color, &toast.message);
                        });
                }
            });
    }

    fn ensure_textures_loaded(&mut self, ctx: &egui::Context) {
        // Load textures for all projects (so switching tabs is instant)
        for project in &self.state.projects {
            for comp in &project.components {
                let asset_id = match &comp.data {
                    ComponentData::Image { asset_id } => asset_id.as_ref(),
                    ComponentData::Background { asset_id, .. } => asset_id.as_ref(),
                    _ => None,
                };
                if let Some(id) = asset_id
                    && !self.state.texture_cache.contains(id)
                    && let Some(path) = self.state.asset_library.get_asset_path(id)
                {
                    self.state.texture_cache.ensure_loaded(ctx, *id, &path);
                }
            }
        }
    }

    fn sync_display_state(&mut self) {
        if self.state.display_active
            && self.state.has_projects()
            && let Ok(mut ds) = self.display_state.lock()
        {
            let project = self.state.active_project();
            ds.scoreboard = project.scoreboard.clone();
            ds.components = project.components.clone();
            ds.live_data = project.live_match_data.clone();
            ds.texture_cache.sync_from(&self.state.texture_cache);
            ds.should_close = false;
            ds.fullscreen = self.state.display_fullscreen;
            ds.offset_x = self.state.display_offset_x.parse().unwrap_or(0);
            ds.offset_y = self.state.display_offset_y.parse().unwrap_or(0);
        }
    }

    fn show_start_screen(&mut self, ctx: &egui::Context) {
        egui::CentralPanel::default()
            .frame(egui::Frame::NONE.fill(egui::Color32::from_gray(20)))
            .show(ctx, |ui| {
                ui.vertical_centered(|ui| {
                    ui.add_space(ui.available_height() * 0.15);

                    ui.heading("ScoreForge Display");
                    ui.add_space(20.0);

                    // --- Create New ---
                    egui::Frame::NONE
                        .fill(egui::Color32::from_gray(30))
                        .inner_margin(16.0)
                        .corner_radius(6.0)
                        .show(ui, |ui| {
                            ui.set_width(340.0);
                            ui.label(
                                egui::RichText::new("New Scoreboard")
                                    .strong()
                                    .size(14.0),
                            );
                            ui.add_space(8.0);
                            ui.horizontal(|ui| {
                                ui.label("Name:");
                                ui.text_edit_singleline(&mut self.state.new_name);
                            });
                            ui.horizontal(|ui| {
                                ui.label("Width:");
                                ui.add(
                                    egui::TextEdit::singleline(&mut self.state.new_width)
                                        .desired_width(80.0),
                                );
                                ui.label("Height:");
                                ui.add(
                                    egui::TextEdit::singleline(&mut self.state.new_height)
                                        .desired_width(80.0),
                                );
                            });
                            ui.add_space(4.0);
                            if ui.button("Create").clicked() {
                                let width: u32 =
                                    self.state.new_width.parse().unwrap_or(1920);
                                let height: u32 =
                                    self.state.new_height.parse().unwrap_or(1080);
                                let project = ProjectState::new(
                                    self.state.new_name.clone(),
                                    width,
                                    height,
                                );
                                self.state.projects.push(project);
                                self.state.active_index = self.state.projects.len() - 1;
                            }
                        });

                    ui.add_space(12.0);

                    // --- Open Existing ---
                    if ui.button("Open Existing Scoreboard...").clicked() {
                        let path = rfd::FileDialog::new()
                            .set_title("Open Scoreboard")
                            .add_filter("ScoreForge Board", &["sfb"])
                            .pick_file();
                        if let Some(path) = path {
                            match crate::storage::scoreboard::load_scoreboard(&path) {
                                Ok(file) => {
                                    let mut project = ProjectState::from_file(file);
                                    project.current_file = Some(path.clone());
                                    self.state.projects.push(project);
                                    self.state.active_index = self.state.projects.len() - 1;
                                    self.state.config.add_recent_file(path);
                                }
                                Err(e) => {
                                    self.state.push_toast(format!("Load failed: {e}"), true);
                                }
                            }
                        }
                    }

                    // --- Recent Files ---
                    let recent: Vec<_> = self
                        .state
                        .config
                        .recent_files
                        .iter()
                        .filter(|p| p.exists())
                        .cloned()
                        .collect();

                    if !recent.is_empty() {
                        ui.add_space(16.0);
                        ui.label(
                            egui::RichText::new("Recent")
                                .strong()
                                .color(egui::Color32::from_gray(160)),
                        );
                        ui.add_space(4.0);
                        for path in &recent {
                            let label = path
                                .file_stem()
                                .map(|s| s.to_string_lossy().to_string())
                                .unwrap_or_else(|| path.display().to_string());
                            if ui
                                .button(&label)
                                .on_hover_text(path.display().to_string())
                                .clicked()
                            {
                                match crate::storage::scoreboard::load_scoreboard(path) {
                                    Ok(file) => {
                                        let mut project = ProjectState::from_file(file);
                                        project.current_file = Some(path.clone());
                                        self.state.projects.push(project);
                                        self.state.active_index =
                                            self.state.projects.len() - 1;
                                        self.state.config.add_recent_file(path.clone());
                                    }
                                    Err(e) => {
                                        self.state
                                            .push_toast(format!("Load failed: {e}"), true);
                                    }
                                }
                            }
                        }
                    }
                });
            });
    }

    fn show_tab_bar(&mut self, ctx: &egui::Context) {
        egui::TopBottomPanel::top("tab_bar")
            .frame(
                egui::Frame::NONE
                    .fill(egui::Color32::from_gray(25))
                    .inner_margin(egui::Margin::symmetric(4, 2)),
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    let mut switch_to: Option<usize> = None;
                    let mut close_idx: Option<usize> = None;

                    for (i, project) in self.state.projects.iter().enumerate() {
                        let is_active = i == self.state.active_index;
                        let dirty = if project.is_dirty { "*" } else { "" };
                        let label = format!("{}{}", project.scoreboard.name, dirty);

                        let bg = if is_active {
                            egui::Color32::from_gray(45)
                        } else {
                            egui::Color32::from_gray(30)
                        };

                        egui::Frame::NONE
                            .fill(bg)
                            .inner_margin(egui::Margin::symmetric(8, 4))
                            .corner_radius(egui::CornerRadius {
                                nw: 4,
                                ne: 4,
                                sw: 0,
                                se: 0,
                            })
                            .show(ui, |ui| {
                                ui.horizontal(|ui| {
                                    if ui
                                        .selectable_label(is_active, &label)
                                        .clicked()
                                        && !is_active
                                    {
                                        switch_to = Some(i);
                                    }
                                    if ui.small_button("x").clicked() {
                                        close_idx = Some(i);
                                    }
                                });
                            });
                    }

                    if let Some(idx) = switch_to {
                        self.state.active_index = idx;
                    }

                    if let Some(idx) = close_idx {
                        self.state.projects.remove(idx);
                        if self.state.projects.is_empty() {
                            self.state.active_index = 0;
                        } else if self.state.active_index >= self.state.projects.len() {
                            self.state.active_index = self.state.projects.len() - 1;
                        }
                    }
                });
            });
    }
}

impl eframe::App for ScoreForgeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Process Convex messages
        self.state.process_convex_messages();

        if !self.state.has_projects() {
            self.show_start_screen(ctx);
            self.show_toasts(ctx);
            return;
        }

        // Load textures for any components that reference assets
        self.ensure_textures_loaded(ctx);

        // Sync display state
        self.sync_display_state();

        // Show display viewport if active
        if self.state.display_active {
            show_display_viewport(ctx, &self.display_state);
        }

        // Top toolbar
        egui::TopBottomPanel::top("toolbar").show(ctx, |ui| {
            toolbar::show_toolbar(ui, &mut self.state);
        });

        // Tab bar (shown when there are projects open)
        self.show_tab_bar(ctx);

        // Left sidebar - component library
        egui::SidePanel::left("component_library")
            .default_width(160.0)
            .show(ctx, |ui| {
                component_library::show_component_library(ui, &mut self.state);
            });

        // Right sidebar - property panel
        egui::SidePanel::right("property_panel")
            .default_width(250.0)
            .show(ctx, |ui| {
                egui::ScrollArea::vertical().show(ui, |ui| {
                    property_panel::show_property_panel(ui, &mut self.state);
                });
            });

        // Center - canvas
        egui::CentralPanel::default()
            .frame(egui::Frame::NONE.fill(egui::Color32::from_gray(20)))
            .show(ctx, |ui| {
                canvas::show_canvas(ui, &mut self.state);
            });

        // Dialogs
        self.show_dialogs(ctx);

        // Toasts
        self.show_toasts(ctx);

        // Request continuous repaint when live data is active
        if self.state.connection_step == ConnectionStep::Live || self.state.display_active {
            ctx.request_repaint();
        }
    }
}
