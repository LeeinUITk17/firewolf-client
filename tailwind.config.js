/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}", // Quét các file component
    "./layouts/**/*.vue",           // Quét các file layout
    "./pages/**/*.vue",             // Quét các file page
    "./plugins/**/*.{js,ts}",       // Quét các file plugin
    "./app.vue",                    // Quét file app.vue chính
    "./nuxt.config.{js,ts}",        // Quét file cấu hình Nuxt (nếu có class)
    "./error.vue",                  // Quét file error.vue (nếu có)
  ],
  theme: {
    extend: {}, // Nơi bạn có thể mở rộng theme mặc định (màu sắc, font chữ...)
  },
  plugins: [], // Nơi bạn có thể thêm các plugin Tailwind
}