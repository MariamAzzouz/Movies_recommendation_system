import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import sqlite3
from sklearn.decomposition import TruncatedSVD
import joblib
import os
import requests

# Add these constants
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_API_KEY = "2236b1394816474a4a0c9ce17cce84ea"  # Replace with your actual TMDB API key

class RecommendationSystem:
    def __init__(self):
        self.movies_df = None
        self.ratings_matrix = None
        self.tfidf_matrix = None
        self.svd_model = None
        self.seen_movies = {}
        self.user_preferences = defaultdict(lambda: {
            'favorite_genres': defaultdict(int),
            'favorite_movies': set(),
            'ratings': {},
            'last_interactions': []
        })
        
        # Initialize data
        self.initialize_data()
        self.train_models()

    def initialize_data(self):
        """Load and preprocess data efficiently"""
        try:
            # Load movies with basic information
            self.movies_df = pd.read_csv('dataset/movies.csv')
            print(f"Loaded {len(self.movies_df)} movies.")
            
            # Create genre features
            self.movies_df['genres_list'] = self.movies_df['genres'].str.split('|')
            
            # Load ratings in chunks to handle memory
            chunks = []
            for chunk in pd.read_csv('dataset/ratings.csv', chunksize=100000):
                # Calculate average rating and count for each movie
                agg = chunk.groupby('movieId').agg({
                    'rating': ['mean', 'count']
                }).reset_index()
                chunks.append(agg)
            
            # Combine chunks
            ratings_agg = pd.concat(chunks)
            
            # Flatten the multi-level columns
            ratings_agg.columns = ['movieId', 'mean', 'count']
            
            # Merge with movies
            self.movies_df = self.movies_df.merge(
                ratings_agg, 
                on='movieId', 
                how='left'
            )
            
            # Fill NaN values
            self.movies_df['mean'] = self.movies_df['mean'].fillna(0)
            self.movies_df['count'] = self.movies_df['count'].fillna(0)
            
            print("Data initialized successfully")
            
        except Exception as e:
            print(f"Error initializing data: {str(e)}")
            raise

    def train_models(self):
        """Train content-based and collaborative filtering models"""
        try:
            # Content-based: TF-IDF on genres
            tfidf = TfidfVectorizer(stop_words='english')
            self.tfidf_matrix = tfidf.fit_transform(
                self.movies_df['genres'].fillna('')
            )
            
            # Determine the number of features
            n_features = self.tfidf_matrix.shape[1]
            
            # Reduce dimensionality for memory efficiency
            n_components = min(100, n_features)  # Ensure n_components <= n_features
            self.svd_model = TruncatedSVD(n_components=n_components)
            self.tfidf_matrix = self.svd_model.fit_transform(self.tfidf_matrix)
            
            # Save models
            joblib.dump(tfidf, 'models/tfidf_vectorizer.joblib')
            joblib.dump(self.svd_model, 'models/svd_model.joblib')
            
            print("Models trained successfully")
            
        except Exception as e:
            print(f"Error training models: {str(e)}")
            raise

    def get_content_based_recommendations(self, movie_ids, n=8):
        """Get content-based recommendations based on movie features"""
        try:
            if not movie_ids:
                return []
            
            # Get the mean feature vector of input movies
            movie_indices = self.movies_df[
                self.movies_df['movieId'].isin(movie_ids)
            ].index
            
            if len(movie_indices) == 0:
                return []
            
            movie_vector = np.mean(self.tfidf_matrix[movie_indices], axis=0)
            
            # Calculate similarities
            similarities = cosine_similarity([movie_vector], self.tfidf_matrix)[0]
            
            # Get top similar movies
            similar_indices = similarities.argsort()[::-1][:n*2]  # Get more for filtering
            similar_movies = self.movies_df.iloc[similar_indices]
            
            # Filter out input movies and sort by rating
            recommendations = similar_movies[
                ~similar_movies['movieId'].isin(movie_ids)
            ].sort_values('mean', ascending=False)
            
            return recommendations.head(n)
            
        except Exception as e:
            print(f"Error in content-based recommendations: {str(e)}")
            return []

    def get_collaborative_recommendations(self, user_id, n=10):
        """Get collaborative filtering recommendations based on user ratings"""
        try:
            # Get user's ratings
            with sqlite3.connect('movie_app.db') as conn:
                query = """
                    SELECT movie_id, rating 
                    FROM user_ratings 
                    WHERE user_id = ?
                """
                user_ratings = pd.read_sql_query(query, conn, params=[user_id])
            
            if user_ratings.empty:
                print(f"No ratings found for user {user_id}.")
                return []
            
            # Find similar users based on ratings
            similar_users_query = """
                SELECT DISTINCT ur2.user_id
                FROM user_ratings ur1
                JOIN user_ratings ur2 ON ur1.movie_id = ur2.movie_id
                WHERE ur1.user_id = ? AND ur2.user_id != ?
                GROUP BY ur2.user_id
                HAVING COUNT(*) >= 3
            """
            
            with sqlite3.connect('movie_app.db') as conn:
                similar_users = pd.read_sql_query(
                    similar_users_query, 
                    conn, 
                    params=[user_id, user_id]
                )
            
            if similar_users.empty:
                return []
            
            # Get recommendations from similar users
            recommendations_query = """
                SELECT m.*, AVG(ur.rating) as avg_rating, COUNT(*) as rating_count
                FROM user_ratings ur
                JOIN movies m ON ur.movie_id = m.movieId
                WHERE ur.user_id IN (?)
                AND ur.movie_id NOT IN (
                    SELECT movie_id FROM user_ratings WHERE user_id = ?
                )
                GROUP BY ur.movie_id
                HAVING rating_count >= 2
                ORDER BY avg_rating DESC, rating_count DESC
                LIMIT ?
            """
            
            with sqlite3.connect('movie_app.db') as conn:
                similar_user_recs = pd.read_sql_query(
                    recommendations_query,
                    conn,
                    params=[tuple(similar_users['user_id'].tolist()), user_id, n]
                )
            
            return similar_user_recs
            
        except Exception as e:
            print(f"Error in collaborative recommendations: {str(e)}")
            return []

    def get_hybrid_recommendations(self, user_id, n_recommendations=8):
        """Get hybrid recommendations based on user preferences and interactions."""
        try:
            print(f"Fetching recommendations for user: {user_id}")
            
            # Get user data
            with sqlite3.connect('movie_app.db') as conn:
                favorites = pd.read_sql_query(
                    "SELECT movie_id FROM user_favorites WHERE user_id = ?",
                    conn,
                    params=[user_id]
                )
                ratings = pd.read_sql_query(
                    "SELECT movie_id, rating FROM user_ratings WHERE user_id = ?",
                    conn,
                    params=[user_id]
                )

            recommendations = []
            
            # 1. Get content-based recommendations (based on favorites)
            if not favorites.empty:
                content_recs = self.get_content_based_recommendations(
                    favorites['movie_id'].tolist(),
                    n=n_recommendations * 2  # Get more to ensure enough unique recommendations
                )
                if isinstance(content_recs, pd.DataFrame):
                    recommendations.extend(content_recs.to_dict('records'))
                elif isinstance(content_recs, list):
                    recommendations.extend(content_recs)

            # 2. Get collaborative recommendations
            collab_recs = self.get_collaborative_recommendations(user_id, n=n_recommendations * 2)
            if isinstance(collab_recs, pd.DataFrame):
                recommendations.extend(collab_recs.to_dict('records'))
            elif isinstance(collab_recs, list):
                recommendations.extend(collab_recs)

            # 3. If we still need more recommendations, add popular movies
            if len(recommendations) < n_recommendations:
                popular_recs = self._get_popular_recommendations(n_recommendations * 2)
                if isinstance(popular_recs, list):
                    recommendations.extend(popular_recs)

            # Convert to DataFrame for easier processing
            if recommendations:
                df_recs = pd.DataFrame(recommendations)
                
                # Remove duplicates and sort by rating
                df_recs = df_recs.drop_duplicates(subset=['movieId'], keep='first')
                
                # Remove movies that the user has already rated or favorited
                if not ratings.empty:
                    df_recs = df_recs[~df_recs['movieId'].isin(ratings['movie_id'])]
                if not favorites.empty:
                    df_recs = df_recs[~df_recs['movieId'].isin(favorites['movie_id'])]
                
                # Sort by rating and popularity
                df_recs = df_recs.sort_values(
                    ['mean', 'count'],
                    ascending=[False, False]
                ).head(n_recommendations)
                
                final_recs = df_recs.to_dict('records')
                print(f"Returning {len(final_recs)} recommendations")
                return final_recs

            # Fallback to popular recommendations if no recommendations were generated
            print("Falling back to popular recommendations")
            return self._get_popular_recommendations(n_recommendations)

        except Exception as e:
            print(f"Error in hybrid recommendations: {str(e)}")
            return self._get_popular_recommendations(n_recommendations)

    def _get_popular_recommendations(self, n=8):
        """Get popular movies as a fallback recommendation strategy."""
        try:
            popular_movies = self.movies_df[
                (self.movies_df['count'] >= 100) &  # Movies with at least 100 ratings
                (self.movies_df['mean'] >= 3.5)     # Movies with average rating >= 3.5
            ].sort_values(
                ['mean', 'count'],
                ascending=[False, False]
            ).head(n)
            
            return popular_movies.to_dict('records')
        except Exception as e:
            print(f"Error getting popular recommendations: {str(e)}")
            return []

    def search_movies(self, query):
        """Search for movies based on a query."""
        try:
            # Assuming you have a DataFrame of movies loaded
            results = self.movies_df[self.movies_df['title'].str.contains(query, case=False, na=False)]
            return results.to_dict('records')  # Convert to a list of dictionaries
        except Exception as e:
            print(f"Error in search_movies: {str(e)}")
            return []

    def get_movie_poster(self, movie_title):
        """Fetch movie poster URL from TMDB or return cached URL."""
        if movie_title in self.seen_movies:
            return self.seen_movies[movie_title]

        try:
            clean_title = movie_title.rsplit('(', 1)[0].strip()
            search_url = f"{TMDB_BASE_URL}/search/movie"
            response = requests.get(search_url, params={
                'api_key': TMDB_API_KEY,
                'query': clean_title
            })
            
            if response.status_code == 200:
                results = response.json().get('results', [])
                if results:
                    poster_path = results[0].get('poster_path')
                    if poster_path:
                        poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
                        self.seen_movies[movie_title] = poster_url
                        print(f"Poster URL for {movie_title}: {poster_url}")
                        return poster_url
            return "https://via.placeholder.com/500x750?text=No+Poster+Available"
        except Exception as e:
            print(f"Error fetching poster for {movie_title}: {str(e)}")
            return "https://via.placeholder.com/500x750?text=No+Poster+Available"

    def add_to_favorites(self, user_id, movie_id):
        """Add a movie to the user's favorites."""
        if user_id in self.user_preferences:
            self.user_preferences[user_id]['favorite_movies'].add(movie_id)
        else:
            self.user_preferences[user_id] = {
                'favorite_movies': {movie_id},
                'ratings': {},
                'last_interactions': []
            }