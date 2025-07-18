# AI Image Reframing Comparison Tool

A React application that compares image reframing capabilities between two AI models:
- **FAL.AI Image Editing** - Preserves subject position with smart cropping
- **Ideogram V3** - Creative expansion and reframing

## Features

- 🖼️ **Drag & Drop Upload** - Easy image upload with preview
- 📐 **Multiple Presets** - Square, landscape, portrait, and wide formats
- 🎛️ **Custom Dimensions** - Set your own width and height
- 🔄 **Side-by-Side Comparison** - See both AI results simultaneously
- 📊 **Generation History** - Track and review past generations
- 💾 **Persistent Storage** - History saved locally via JSON file

## Local Development

### Prerequisites

- Node.js 18+ 
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Topsort/reframe-comparison.git
   cd reframe-comparison
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

   This starts both the React frontend (http://localhost:5173) and Express backend (http://localhost:3001) concurrently.

### Available Scripts

- `npm run dev` - Start both frontend and backend servers
- `npm run client` - Start only the React frontend
- `npm run server` - Start only the Express backend  
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## How It Works

1. **Upload an image** using the drag-and-drop interface
2. **Choose dimensions** from presets or set custom values
3. **Click "Compare Reframing"** to process with both AI models
4. **View results** side-by-side with the original image
5. **Browse history** of all previous generations

## API Integration

The app uses [FAL.AI](https://fal.ai/) APIs:
- `fal-ai/image-editing/reframe` - Smart cropping that preserves subjects
- `fal-ai/ideogram/v3/reframe` - Creative expansion and reframing

Custom dimensions are automatically mapped to the closest supported format for each API.

## Architecture

- **Frontend**: React + Vite with drag-and-drop file handling
- **Backend**: Express server for history persistence
- **Storage**: Local JSON file (`public/history.json`)
- **APIs**: Concurrent calls to both AI models with error handling

## Local Storage

Generation history is automatically saved to `public/history.json` and persists between sessions. You can also:
- Load custom history files
- Clear all history
- Export history by copying the JSON file

---

*This tool is designed for local development and testing only.*
