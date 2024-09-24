mod utils;

use wasm_bindgen::{prelude::*, Clamped};
use web_sys::CanvasRenderingContext2d;
use js_sys::Uint8ClampedArray;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

#[wasm_bindgen]
pub struct ImageManager {
    images: Vec<Image>,
    selected_image: Option<usize>,
}

#[wasm_bindgen]
pub struct Image {
    id: u32,
    width: u32,
    height: u32,
    x: f64,
    y: f64,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ImageManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        ImageManager {
            images: Vec::new(),
            selected_image: None,
        }
    }

    pub fn add_image(&mut self, width: u32, height: u32, data: Vec<u8>) -> u32 {
        let id = self.images.len() as u32;
        log(&format!("Adding image {} with size {}x{} -Rust", id, width, height));
        self.images.push(Image {
            id,
            width,
            height,
            x: 0.0,
            y: 0.0,
            data,
        });
        log("Image added -Rust");
        id
    }

    pub fn move_image(&mut self, id: u32, x: f64, y: f64) {
        if let Some(image) = self.images.iter_mut().find(|img| img.id == id) {
            log(&format!("Moving image {} to ({}, {}) -Rust", id, image.x + x, image.y + y));
            image.x += x;
            image.y += y;
        }
    }

    pub fn select_image(&mut self, x: f64, y: f64) -> Option<u32> {
        self.selected_image = self.images.iter().rev().position(|img| {
            x >= img.x && x < img.x + img.width as f64 &&
            y >= img.y && y < img.y + img.height as f64
        }).map(|index| self.images.len() - 1 - index);

        self.selected_image.map(|index| self.images[index].id)
    }

    pub fn delete_selected_image(&mut self) {
        if let Some(index) = self.selected_image {
            self.images.remove(index);
            self.selected_image = None;
        }
    }

    pub fn render(&self, context: CanvasRenderingContext2d) {
        for (index, image) in self.images.iter().enumerate() {
            let slice_data = Clamped(&image.data[..]);
            let image_data = web_sys::ImageData::new_with_u8_clamped_array_and_sh(
                slice_data,
                image.width,
                image.height
            ).unwrap();
            context.put_image_data(&image_data, image.x, image.y).unwrap();
            if Some(index) == self.selected_image {
                context.set_stroke_style(&JsValue::from_str("blue"));
                context.set_line_width(2.0);
                context.stroke_rect(
                    image.x - 2.0,
                    image.y - 2.0,
                    image.width as f64 + 4.0,
                    image.height as f64 + 4.0
                );
            }
        }
    }
}
