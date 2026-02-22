pub mod serde_color32 {
    use egui::Color32;
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    #[derive(Serialize, Deserialize)]
    struct Color32Serde(u8, u8, u8, u8);

    pub fn serialize<S: Serializer>(color: &Color32, s: S) -> Result<S::Ok, S::Error> {
        Color32Serde(color.r(), color.g(), color.b(), color.a()).serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Color32, D::Error> {
        let Color32Serde(r, g, b, a) = Color32Serde::deserialize(d)?;
        Ok(Color32::from_rgba_unmultiplied(r, g, b, a))
    }
}

pub mod serde_color32_option {
    use egui::Color32;
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    #[derive(Serialize, Deserialize)]
    struct Color32Serde(u8, u8, u8, u8);

    pub fn serialize<S: Serializer>(color: &Option<Color32>, s: S) -> Result<S::Ok, S::Error> {
        match color {
            Some(c) => Some(Color32Serde(c.r(), c.g(), c.b(), c.a())).serialize(s),
            None => None::<Color32Serde>.serialize(s),
        }
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Option<Color32>, D::Error> {
        let opt = Option::<Color32Serde>::deserialize(d)?;
        Ok(opt.map(|Color32Serde(r, g, b, a)| Color32::from_rgba_unmultiplied(r, g, b, a)))
    }
}

pub mod serde_vec2 {
    use egui::Vec2;
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    #[derive(Serialize, Deserialize)]
    struct Vec2Serde(f32, f32);

    pub fn serialize<S: Serializer>(v: &Vec2, s: S) -> Result<S::Ok, S::Error> {
        Vec2Serde(v.x, v.y).serialize(s)
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec2, D::Error> {
        let Vec2Serde(x, y) = Vec2Serde::deserialize(d)?;
        Ok(Vec2::new(x, y))
    }
}
