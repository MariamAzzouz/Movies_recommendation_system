import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import sqlite3
from sklearn.decomposition import TruncatedSVD
import joblib
import os

class RecommendationSystem:
    def __init__(self):
        self.movies_df = None
        self.ratings_matrix = None
        self.tfidf_matrix = None
        self.svd_model = None
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

    def get_content_based_recommendations(self, movie_ids, n=10):
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

    def get_hybrid_recommendations(self, user_id, n_recommendations=10):
        """Combine both recommendation approaches"""
        try:
            # Get user's favorite movies and ratings
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
            
            # Get recommendations from both approaches
            content_based = self.get_content_based_recommendations(
                favorites['movie_id'].tolist() if not favorites.empty else [],
                n=n_recommendations
            )
            collaborative = self.get_collaborative_recommendations(
                user_id,
                n=n_recommendations
            )
            
            # Convert to DataFrames if they're not already
            if isinstance(content_based, list):
                content_based = pd.DataFrame(content_based)
            if isinstance(collaborative, list):
                collaborative = pd.DataFrame(collaborative)
            
            # Add source column to each DataFrame
            if not content_based.empty:
                content_based['source'] = 'content'
            if not collaborative.empty:
                collaborative['source'] = 'collaborative'
            
            # Combine recommendations and ensure uniqueness
            all_recs = pd.concat(
                [df for df in [content_based, collaborative] if not df.empty],
                ignore_index=True
            )
            
            if all_recs.empty:
                return self._get_popular_recommendations(n_recommendations)
            
            # Remove duplicates based on movieId and keep the highest rated version
            final_recs = (all_recs
                .sort_values(['mean', 'count'], ascending=[False, False])
                .drop_duplicates(subset=['movieId'], keep='first')
                .head(n_recommendations)
            )
            
            # Convert to records and ensure unique movies
            recommendations = final_recs.to_dict('records')
            
            # Additional uniqueness check based on movie title
            seen_titles = set()
            unique_recommendations = []
            for movie in recommendations:
                if movie['title'] not in seen_titles:
                    seen_titles.add(movie['title'])
                    unique_recommendations.append(movie)
                    if len(unique_recommendations) >= n_recommendations:
                        break
            
            return unique_recommendations
            
        except Exception as e:
            print(f"Error in hybrid recommendations: {str(e)}")
            return self._get_popular_recommendations(n_recommendations)

    def _get_popular_recommendations(self, n):
        """Fallback to popular movies"""
        try:
            popular_movies = self.movies_df[
                self.movies_df['count'] >= 100
            ].sort_values(
                ['mean', 'count'],
                ascending=[False, False]
            ).head(n)
            
            return popular_movies.to_dict('records')
        except Exception as e:
            print(f"Error getting popular recommendations: {str(e)}")
            return []