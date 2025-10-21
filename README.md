# Interactive Graphics Quiz Platform

A web-based educational platform for computer graphics concepts, featuring interactive 3D transformations and ray-sphere intersection problems.

## Features

- **3D Transformation Exercises**: Interactive questions covering translation, rotation, and matrix transformations
- **Ray-Sphere Intersection Problems**: Three difficulty levels testing geometric ray tracing concepts
- **Real-time Visualization**: Live 3D rendering with Three.js showing transformations as students work
- **Deterministic Question Generation**: Seeded random generation ensures consistent questions per student
- **Multiple Question Types**: Multiple choice, code input, and visual matching formats

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **3D Graphics**: Three.js with React Three Fiber
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling

## Getting Started

### Prerequisites

- Node.js 16+ and npm (or bun)
- Modern browser with WebGL support

### Installation

```sh
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```sh
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── EnhancedThreeScene.tsx    # 3D visualization
│   ├── RaySpherePlayer.tsx       # Ray-sphere question interface
│   ├── StudentPlayer.tsx         # Main quiz interface
│   └── ui/                       # Reusable UI components
├── utils/              # Utility functions
│   ├── questionGenerator.ts      # Question generation logic
│   ├── rng.ts                    # Seeded random number generator
│   └── raySphere.ts              # Ray-sphere intersection logic
└── types/              # TypeScript type definitions
```

## Question Types

- **Q4**: Multiple choice - select correct transformation sequence
- **Q5**: Code to picture - match code with resulting image
- **Q6**: Stack reasoning - identify transformation sequence from visual
- **Q7**: Code input - write transformation code to match target
- **Q8**: Ray-sphere intersection (Levels A, B, C)

## Development

The codebase uses TypeScript for type safety and follows React best practices. The deterministic question generation ensures each student receives consistent questions based on their student ID and exam key.

## License

MIT
