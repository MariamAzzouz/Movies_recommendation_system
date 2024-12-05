# Movie Recommender System

Welcome to the Movie Recommender System! This project is a comprehensive application that provides personalized movie recommendations using a hybrid approach combining collaborative and content-based filtering. It also includes features for user authentication, movie search, and more.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Recommendation System](#recommendation-system)
- [Database](#database)
- [TMDB API Integration](#tmdb-api-integration)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Demo](#demo)

## Features

- **User Authentication**: Register and login functionality with JWT-based authentication.
- **Movie Recommendations**: Personalized recommendations using a hybrid approach.
- **Search Functionality**: Search for movies by title or genre.
- **Favorites and Ratings**: Users can rate movies and add them to their favorites.
- **Responsive UI**: Built with React and Material-UI for a seamless user experience.

## Architecture

The project is divided into two main parts:

1. **Backend**: Built with Flask, it handles API requests, user authentication, and the recommendation logic.
2. **Frontend**: Developed using React, it provides a user-friendly interface for interacting with the system.

## Installation

### Prerequisites

- Node.js and npm
- Python 3.x
- SQLite3

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/movie-recommender.git
   cd movie-recommender/backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

- Access the application at `http://localhost:3000`.
- Register or login to start receiving personalized movie recommendations.
- Use the search bar to find movies by title or genre.
- Rate movies and add them to your favorites for a more personalized experience.

## Recommendation System

The recommendation system is the core of this project, providing users with personalized movie suggestions. It uses a hybrid approach that combines:

- **Content-Based Filtering**: Utilizes movie metadata such as genres to recommend similar movies. This is achieved using a TF-IDF Vectorizer to analyze the genres and a Truncated SVD for dimensionality reduction, followed by cosine similarity to find similar movies.

- **Collaborative Filtering**: Analyzes user behavior and preferences to suggest movies liked by similar users. This involves finding users with similar tastes and recommending movies they have rated highly.

- **Hybrid Approach**: Combines content-based and collaborative filtering for robust recommendations. This ensures that users receive suggestions based on both their personal preferences and the preferences of similar users.

### Key Components

- **TF-IDF Vectorizer**: Converts genre text data into numerical format for analysis.
- **Truncated SVD**: Reduces the dimensionality of the TF-IDF matrix for efficient computation.
- **Cosine Similarity**: Measures similarity between movies for content-based recommendations.
- **User Preferences**: Tracks user interactions, ratings, and favorite genres to enhance recommendations.

## Database

The application uses SQLite3 for data storage, which is lightweight and easy to set up. The database schema includes tables for:

- **Users**: Stores user information and credentials.
- **User Preferences**: Tracks user preferences, including favorite genres and watch history.
- **User Favorites**: Keeps a record of movies marked as favorites by users.
- **User Ratings**: Stores user ratings for movies.

### Database Initialization

The database is initialized with the `init_db()` function in `app.py`, which creates the necessary tables if they do not exist.

## TMDB API Integration

The application integrates with the [TMDB (The Movie Database) API](https://www.themoviedb.org/documentation/api) to fetch additional movie data, such as posters and detailed information. This enhances the user experience by providing rich media content and up-to-date movie details.

- **Movie Posters**: Fetches high-quality movie posters to display in the UI.
- **Movie Details**: Retrieves detailed information about movies, including overviews and release dates.

### API Key

To use the TMDB API, you need to obtain an API key from TMDB and set it in your environment or configuration files.

## API Endpoints

- **Authentication**:
  - `POST /auth/register`: Register a new user.
  - `POST /auth/login`: Login and receive a JWT token.

- **Movies**:
  - `GET /movies`: Retrieve a list of movies with pagination.
  - `GET /movies/recommendations`: Get personalized movie recommendations.
  - `POST /movies/rate`: Rate a movie.
  - `POST /movies/favorite`: Add a movie to favorites.

- **Search**:
  - `GET /movies/search`: Search for movies by title or genre.

## Frontend Components

- **Navbar**: Provides navigation links and authentication options.
- **MovieCard**: Displays movie details and allows rating and favoriting.
- **SearchBar**: Allows users to search for movies.
- **FilmDetails**: Shows detailed information about a selected movie.
- **MainContent**: Displays movies, recommendations, and search results.

## Demo

![Demo Image for the search ](https://github.com/user-attachments/assets/db541116-5e77-44eb-97fc-08ee322dc782)
![Demo Image 2](path/to/demo2.png)


