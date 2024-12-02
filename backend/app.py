from flask import Flask, request, jsonify, session
from flask_cors import CORS
import pandas as pd
from recommendation_system import RecommendationSystem
import requests
from datetime import datetime
import jwt
import bcrypt
from functools import wraps
import sqlite3
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.secret_key = 'ee7759d720541d25c94d01c68fa6debfbae47aef655fcfb4377737da67de980b'  # Change this to a secure secret key

# Keep existing TMDB configuration
TMDB_API_KEY = '2236b1394816474a4a0c9ce17cce84ea'
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

# Move init_db() function definition before its usage
def init_db():
    with sqlite3.connect('movie_app.db') as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INTEGER,
                favorite_genres TEXT,
                watch_history TEXT,
                ratings TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_favorites (
                user_id INTEGER,
                movie_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                PRIMARY KEY (user_id, movie_id)
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_ratings (
                user_id INTEGER,
                movie_id INTEGER,
                rating FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                PRIMARY KEY (user_id, movie_id)
            )
        ''')
        conn.commit()

# Then use it after definition
print("Starting server...")
print("Initializing recommendation system...")
recommender = RecommendationSystem()
print("Recommendation system initialized!")
print("Initializing database...")
init_db()
print("Database initialized!")

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.secret_key, algorithms=["HS256"])
            current_user = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# User Authentication Routes
@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'message': 'Missing required fields'}), 400

        # Hash password
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        with sqlite3.connect('movie_app.db') as conn:
            c = conn.cursor()
            c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                     (username, email, hashed))
            user_id = c.lastrowid
            c.execute('INSERT INTO user_preferences (user_id) VALUES (?)', (user_id,))
            conn.commit()

        return jsonify({
            'status': 'success',
            'message': 'User registered successfully'
        })
    except sqlite3.IntegrityError:
        return jsonify({
            'status': 'error',
            'message': 'Username or email already exists'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        with sqlite3.connect('movie_app.db') as conn:
            c = conn.cursor()
            c.execute('SELECT id, password FROM users WHERE username = ?', (username,))
            user = c.fetchone()

            if user and bcrypt.checkpw(password.encode('utf-8'), user[1]):
                token = jwt.encode({
                    'user_id': user[0],
                    'exp': datetime.utcnow() + timedelta(days=1)
                }, app.secret_key)
                
                return jsonify({
                    'status': 'success',
                    'token': token,
                    'user_id': user[0]
                })

        return jsonify({
            'status': 'error',
            'message': 'Invalid credentials'
        }), 401
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Protected Routes (require authentication)
@app.route('/movies/favorite', methods=['POST'])
@token_required
def favorite_movie(current_user):
    try:
        data = request.get_json()
        movie_id = data.get('movieId')
        
        with sqlite3.connect('movie_app.db') as conn:
            c = conn.cursor()
            c.execute('INSERT OR REPLACE INTO user_favorites (user_id, movie_id) VALUES (?, ?)',
                     (current_user, movie_id))
            conn.commit()
            
        recommender.add_to_favorites(current_user, movie_id)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/movies/rate', methods=['POST'])
@token_required
def rate_movie(current_user):
    try:
        data = request.get_json()
        movie_id = data.get('movieId')
        rating = data.get('rating')
        
        with sqlite3.connect('movie_app.db') as conn:
            c = conn.cursor()
            c.execute('INSERT OR REPLACE INTO user_ratings (user_id, movie_id, rating) VALUES (?, ?, ?)',
                     (current_user, movie_id, rating))
            conn.commit()
            
        recommender.rate_movie(current_user, movie_id, rating)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Update existing routes to use authentication
@app.route('/movies/recommendations')
@token_required
def get_recommendations(current_user):
    try:
        recommendations = recommender.get_hybrid_recommendations(
            current_user,
            n_recommendations=20
        )
        
        if not recommendations:
            return jsonify({
                'status': 'success',
                'data': []
            })
        
        # Ensure unique movies in the response
        seen_ids = set()
        unique_movies = []
        
        for movie in recommendations:
            movie_id = movie.get('movieId', 0)
            if movie_id not in seen_ids:
                seen_ids.add(movie_id)
                movie_data = {
                    'id': int(movie_id),
                    'title': movie.get('title', ''),
                    'genres': movie.get('genres', '').split('|') if movie.get('genres') else [],
                    'rating': float(movie.get('mean', 0)),
                    'ratingCount': int(movie.get('count', 0)),
                    'year': int(movie.get('title', '')[-5:-1]) if movie.get('title', '').endswith(')') else None,
                    'posterUrl': get_movie_poster(movie.get('title', ''))
                }
                unique_movies.append(movie_data)
        
        return jsonify({
            'status': 'success',
            'data': unique_movies
        })
    except Exception as e:
        print(f"Error in recommendations endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to get recommendations'
        }), 500

# Keep existing helper functions
def get_movie_poster(title):
    """Get movie poster from TMDB"""
    try:
        # Remove year from title
        clean_title = title.split('(')[0].strip()
        
        # Search movie in TMDB
        response = requests.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={
                'api_key': TMDB_API_KEY,
                'query': clean_title
            }
        )
        
        if response.status_code == 200:
            results = response.json().get('results', [])
            if results:
                poster_path = results[0].get('poster_path')
                if poster_path:
                    return f"{TMDB_IMAGE_BASE_URL}{poster_path}"
        
        return None
    except Exception as e:
        print(f"Error fetching poster for {title}: {str(e)}")
        return None

@app.route('/api/movies/<int:movie_id>/details')
def get_movie_details(movie_id):
    """Get additional movie details from TMDB"""
    try:
        movie = recommender.movies_df[recommender.movies_df['movieId'] == movie_id].iloc[0]
        
        # Get TMDB details
        clean_title = movie['title'].split('(')[0].strip()
        response = requests.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={
                'api_key': TMDB_API_KEY,
                'query': clean_title
            }
        )
        
        if response.status_code == 200:
            results = response.json().get('results', [])
            if results:
                tmdb_movie = results[0]
                return jsonify({
                    'status': 'success',
                    'details': {
                        'overview': tmdb_movie.get('overview'),
                        'release_date': tmdb_movie.get('release_date'),
                        'vote_average': tmdb_movie.get('vote_average'),
                        'poster_path': f"{TMDB_IMAGE_BASE_URL}{tmdb_movie.get('poster_path')}" if tmdb_movie.get('poster_path') else None,
                        'backdrop_path': f"{TMDB_IMAGE_BASE_URL}{tmdb_movie.get('backdrop_path')}" if tmdb_movie.get('backdrop_path') else None
                    }
                })
        
        return jsonify({
            'status': 'error',
            'message': 'Movie details not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/movies')
def get_movies():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))  # 12 movies per page
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get total count of movies
        with sqlite3.connect('movie_app.db') as conn:
            cursor = conn.cursor()
            total_movies = cursor.execute('SELECT COUNT(*) FROM movies').fetchone()[0]
            
            # Get paginated movies
            movies = cursor.execute('''
                SELECT * FROM movies 
                ORDER BY rating DESC 
                LIMIT ? OFFSET ?
            ''', (per_page, offset)).fetchall()
        
        # Calculate total pages
        total_pages = -(-total_movies // per_page)  # Ceiling division
        
        movies_list = [{
            'id': movie[0],
            'title': movie[1],
            'genres': movie[2].split('|'),
            'rating': float(movie[3]) if movie[3] else 0.0,
            'ratingCount': int(movie[4]) if movie[4] else 0,
            'year': int(movie[1][-5:-1]) if movie[1].endswith(')') else None,
            'posterUrl': get_movie_poster(movie[1])
        } for movie in movies]
        
        return jsonify({
            'status': 'success',
            'data': {
                'movies': movies_list,
                'total_pages': total_pages,
                'current_page': page,
                'per_page': per_page,
                'total_movies': total_movies
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/movies/search')
def search_movies():
    try:
        query = request.args.get('q', '').lower()
        matches = recommender.search_movies(query)
        
        # Format the response
        movies_list = [{
            'id': int(movie['movieId']),
            'title': movie['title'],
            'genres': movie['genres'].split('|'),
            'rating': float(movie['mean']) if pd.notnull(movie['mean']) else 0.0,
            'ratingCount': int(movie['count']) if pd.notnull(movie['count']) else 0,
            'year': int(movie['title'][-5:-1]) if movie['title'].endswith(')') else None,
            'posterUrl': get_movie_poster(movie['title'])
        } for movie in matches]
        
        return jsonify({
            'status': 'success',
            'data': movies_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/movies/featured')
def get_featured_movies():
    try:
        featured = recommender.get_featured_movies()
        
        # Format the response
        movies_list = [{
            'id': int(movie['movieId']),
            'title': movie['title'],
            'genres': movie['genres'].split('|'),
            'rating': float(movie['mean']) if pd.notnull(movie['mean']) else 0.0,
            'posterUrl': get_movie_poster(movie['title'])
        } for movie in featured]
        
        return jsonify({
            'status': 'success',
            'data': movies_list  # This matches the expected format
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.debug = True
    app.run(debug=True, port=5000, host='0.0.0.0', use_reloader=True)