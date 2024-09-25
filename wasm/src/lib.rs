mod utils;

use wasm_bindgen::{prelude::*, Clamped};
use web_sys::{CanvasRenderingContext2d, ImageData};
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
    original_width: u32,
    original_height: u32,
    width: u32,
    height: u32,
    x: f64,
    y: f64,
    data: Vec<u8>
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
            original_width: width,
            original_height: height,
            width,
            height,
            x: 0.0,
            y: 0.0,
            data
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
        
        if self.selected_image.is_none() {
            self.selected_image = None;
        }
        self.selected_image.map(|index| self.images[index].id)
    }

    pub fn delete_selected_image(&mut self) {
        if let Some(index) = self.selected_image {
            self.images.remove(index);
            self.selected_image = None;
        }
    }

   
    pub fn get_image_size(&self, id: u32) -> Vec<u32> {
        self.images.iter().find(|img| img.id == id)
            .map(|img| vec![img.width, img.height])
            .unwrap_or_else(|| vec![])
    }

    pub fn get_image_pos(&self, id: u32) -> Vec<f64> {
        self.images.iter().find(|img| img.id == id)
            .map(|img| vec![img.x, img.y])
            .unwrap_or_else(|| vec![])
    }

    pub fn update_image(&mut self, id: u32, new_width: u32, new_height: u32, x: f64, y: f64) {
        if let Some(image) = self.images.iter_mut().find(|img| img.id == id) {
            log(&format!("Updating image {} to size {}x{} and position ({}, {}) -Rust", id, new_width, new_height, x, y));
            image.x = x;
            image.y = y;
            image.width = new_width;
            image.height = new_height;
        }
    }

    fn resize_image(&self, original_data: &[u8], original_width: u32, original_height: u32, new_width: u32, new_height: u32) -> Vec<u8> {
        let mut resized_data = vec![0u8; (new_width * new_height * 4) as usize];
        
        for y in 0..new_height {
            for x in 0..new_width {
                let orig_x = (x as f64 * original_width as f64 / new_width as f64) as u32;
                let orig_y = (y as f64 * original_height as f64 / new_height as f64) as u32;
                
                let orig_index = ((orig_y * original_width + orig_x) * 4) as usize;
                let new_index = ((y * new_width + x) * 4) as usize;
                
                resized_data[new_index..new_index + 4].copy_from_slice(&original_data[orig_index..orig_index + 4]);
            }
        }
        
        resized_data
    }

    pub fn render(&self, context: &CanvasRenderingContext2d) {
        for (index, image) in self.images.iter().enumerate() {
            let resized_data = self.resize_image(&image.data, image.original_width, image.original_height, image.width, image.height);
            let image_data = ImageData::new_with_u8_clamped_array_and_sh(
                Clamped(&resized_data),
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
