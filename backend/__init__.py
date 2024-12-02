"""
Movie Recommender System Package
------------------------------
This package contains the backend implementation of a movie recommendation system.

Main components:
- Flask API server (app.py)
- Recommendation system (recommendation_system.py)
- Database management
- Authentication system
"""

from .recommendation_system import HybridRecommender
from .app import app

__version__ = '1.0.0'
__author__ = 'Mariam Azzouz'
__email__ = 'azzouzmariam3@gmail.com'

# List of public components
__all__ = [
    'HybridRecommender',
    'app'
]

# Package metadata
PACKAGE_NAME = 'movie_recommender'
DESCRIPTION = 'A hybrid movie recommendation system using collaborative and content-based filtering' 