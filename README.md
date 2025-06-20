# Movie Review Website

A modern movie review website built with React and Vite, leveraging the TMDB (The Movie Database) API to display movie information, ratings, and reviews.

## Features

- Browse popular, top-rated, and upcoming movies
- Search for movies by title
- View detailed movie information including cast, reviews, and ratings
- Responsive design for seamless experience across devices
- User-friendly interface with modern UI components

## Technologies Used

- **Frontend**: React, JavaScript
- **Build Tool**: Vite
- **Styling**: CSS
- **API**: TMDB (The Movie Database) API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- TMDB API key (get one from [themoviedb.org](https://www.themoviedb.org/documentation/api))

### Installation

1. Clone the repository
```bash
git clone https://github.com/nithinmouli/project.git
cd project
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Create a `.env` file in the root directory and add your TMDB API key
```
VITE_TMDB_API_KEY=your_api_key_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open `http://localhost:5173` in your browser

## Project Structure

```
project/
├── public/          # Public assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── styles/      # CSS styles
│   ├── App.jsx      # Main application component
│   └── main.jsx     # Entry point
└── README.md        # Project documentation
```

## API Integration

This project uses the TMDB API to fetch movie data. You can find more information about the API at [developers.themoviedb.org](https://developers.themoviedb.org/3/getting-started/introduction).

## License

[MIT](LICENSE)

## Acknowledgements

- [TMDB](https://www.themoviedb.org/) for providing the movie data API
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the development framework
