mod utils;

use wasm_bindgen::{prelude::*, Clamped};
use wasm_bindgen_futures::JsFuture;
use web_sys::{CanvasRenderingContext2d, ImageData, ImageBitmap};


extern crate console_error_panic_hook;

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
    rotation: f64,
    x: f64,
    y: f64,
    data: Vec<u8>
}

#[wasm_bindgen]
impl ImageManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
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
            rotation: 0.0,
            x: 0.0,
            y: 0.0,
            data
        });
        log("Image added -Rust");
        id
    }

    pub fn move_image_relative(&mut self, id: u32, x: f64, y: f64) {
        if let Some(image) = self.images.iter_mut().find(|img| img.id == id) {
            image.x += x;
            image.y += y;
        }
    }

    pub fn move_image_absolute(&mut self, id: u32, x: f64, y: f64){
        if let Some(image) = self.images.iter_mut().find(|img| img.id == id) {
            image.x = x;
            image.y = y;
        }
    }

    pub fn select_image(&mut self, x: f64, y: f64) -> Option<u32> {
        self.selected_image = self.images.iter().rev().position(|img| {
            x >= img.x && x < img.x + img.width as f64 &&
            y >= img.y && y < img.y + img.height as f64
        }).map(|index| self.images.len() - 1 - index);
        
        log(&format!("Selected image: {:?}", self.selected_image));
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
            .map(|img| vec![img.width, img.height, img.original_width, img.original_height])
            .unwrap_or_else(|| vec![])
    }

    pub fn get_image_pos(&self, id: u32) -> Vec<f64> {
        self.images.iter().find(|img| img.id == id)
            .map(|img| vec![img.x, img.y])
            .unwrap_or_else(|| vec![])
    }

    pub fn get_image_rotation(&self, id: u32) -> f64 {
        self.images.iter().find(|img| img.id == id)
            .map(|img| img.rotation)
            .unwrap_or(0.0)
    }

    pub fn update_image_size(&mut self, id: u32, new_width: u32, new_height: u32) {
        if let Some(image) = self.images.iter_mut().find(|img| img.id == id) {
            //log(&format!("Updating image {} to size {}x{} and position ({}, {}) -Rust", id, new_width, new_height, x, y));
            // image.x = x;
            // image.y = y;
            image.width = new_width;
            image.height = new_height;
        }
    }

    pub fn update_image_rotation(&mut self, id: u32, angle: f64) {
        if let Some(image) = self.images.iter_mut().find(|img| img.id == id) {
            log(&format!("Updating image {} rotation to {} -Rust", id, angle));
            image.rotation = angle;
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

    fn rotate(&self, data: &[u8], width: u32, height: u32, degangle: f64) -> (Vec<u8>, u32, u32) {
        let angle = degangle.to_radians();
        let (sin_theta, cos_theta) = (angle.sin(), angle.cos());
        
        // Calculate the new dimensions of the bounding box
        let new_width = (width as f64 * cos_theta.abs() + height as f64 * sin_theta.abs()).ceil() as u32;
        let new_height = (width as f64 * sin_theta.abs() + height as f64 * cos_theta.abs()).ceil() as u32;
        
        let mut rotated = vec![0; (new_width * new_height * 4) as usize];
    
        // Calculate the center of the new and old images
        let center_x = width as f64 / 2.0;
        let center_y = height as f64 / 2.0;
        let new_center_x = new_width as f64 / 2.0;
        let new_center_y = new_height as f64 / 2.0;
    
        for new_y in 0..new_height {
            for new_x in 0..new_width {
                let dx = new_x as f64 - new_center_x;
                let dy = new_y as f64 - new_center_y;
    
                // Compute the corresponding source coordinates
                let src_x = (dx * cos_theta + dy * sin_theta + center_x).round();
                let src_y = (-dx * sin_theta + dy * cos_theta + center_y).round();
    
                // Ensure source coordinates are within bounds
                if src_x >= 0.0 && src_x < width as f64 && src_y >= 0.0 && src_y < height as f64 {
                    let src_x = src_x as u32;
                    let src_y = src_y as u32;
    
                    let old_idx = ((src_y * width + src_x) * 4) as usize;
                    let new_idx = ((new_y * new_width + new_x) * 4) as usize;
    
                    // Copy pixel data from the source to the destination
                    rotated[new_idx..new_idx + 4].copy_from_slice(&data[old_idx..old_idx + 4]);
                }
            }
        }
    
        // Return the rotated image data and new dimensions
        (rotated, new_width, new_height)
    }

    pub async fn render(&self, context: &CanvasRenderingContext2d) {
        for image in &self.images {
            let resized_data = self.resize_image(
                &image.data,
                image.original_width,
                image.original_height,
                image.width,
                image.height,
            );

            let (rotated_data, new_width, new_height) = self.rotate(
                &resized_data,
                image.width,
                image.height,
                image.rotation,
            );

            let clamped_data = Clamped(&rotated_data[..]);
            let image_data = ImageData::new_with_u8_clamped_array_and_sh(
                clamped_data,
                new_width,
                new_height,
            ).unwrap();    

            let bmp_promise = web_sys::window()
                .unwrap()
                .create_image_bitmap_with_image_data(&image_data)
                .unwrap();
        
            let bmp = JsFuture::from(bmp_promise).await.unwrap();
            let bmp: ImageBitmap = bmp.dyn_into().unwrap();

            // Calculate the position to center the rotated image
            let x_offset = (new_width as f64 - image.width as f64) / 2.0;
            let y_offset = (new_height as f64 - image.height as f64) / 2.0;
            let draw_x = image.x - x_offset;
            let draw_y = image.y - y_offset;

            context.draw_image_with_image_bitmap(&bmp, draw_x, draw_y).unwrap();
        }
    }
}
