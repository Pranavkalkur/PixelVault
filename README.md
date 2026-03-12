# PixelVault

**PixelVault** is a secure, client-side steganography tool built with React and TypeScript. It allows users to hide and reveal secret data seamlessly within images using advanced steganography and cryptography. Featuring a modern, glassmorphism-inspired user interface, PixelVault ensures that data manipulation happens entirely within the browser for maximum privacy and security.

## Features
- **Encode Data**: Safely hide text or data inside image files using secure steganography.
- **Decode Data**: Extract hidden information from encoded images.
- **Steganalysis Panel**: Visually inspect images for LSB (Least Significant Bit) manipulation.
- **Password Protection**: Secure encoded data with password encryption (with an easy toggle for password visibility).
- **Client-Side Processing**: All encoding and decoding happen locally in the browser, ensuring your data never leaves your device.
- **Modern UI**: A responsive, sleek interface built with Tailwind CSS and glassmorphism elements.

## Tech Stack
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
- [React Dropzone](https://react-dropzone.js.org/)

## Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pixelvault.git
   ```
2. Navigate to the project directory:
   ```bash
   cd pixelvault
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server, run:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to view the application.

### Building for Production

To create an optimized production build, run:
```bash
npm run build
```
This will generate a `dist/` folder containing the compiled assets ready for deployment.

## Contributing
Contributions are welcome! If you have ideas for new features or find a bug, please feel free to open an issue or submit a pull request.

## License
This project is open-source and available under the MIT License.
