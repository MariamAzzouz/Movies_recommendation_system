import React, { useState, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  Box,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import CategoryIcon from '@mui/icons-material/Category';
import debounce from 'lodash/debounce';
import { movieService } from '../services/api';

const SearchBar = ({ onSearchResults }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const [inputValue, setInputValue] = useState('');

  const searchMovies = async (query) => {
    if (!query) {
      setOptions([]);
      onSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await movieService.searchMovies(query);
      if (response.status === 'success' && Array.isArray(response.data)) {
        setOptions(response.data);
        onSearchResults(response.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    }
    setLoading(false);
  };

  const debouncedSearch = useCallback(
    debounce(searchMovies, 300),
    []
  );

  const handleInputChange = (event, value) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ToggleButtonGroup
        value={searchType}
        exclusive
        onChange={(event, newType) => setSearchType(newType)}
        size="small"
        sx={{ backgroundColor: 'white', borderRadius: 1 }}
      >
        <ToggleButton value="all" aria-label="all">
          <MovieIcon fontSize="small" />
        </ToggleButton>
        <ToggleButton value="title" aria-label="title">
          Title
        </ToggleButton>
        <ToggleButton value="genre" aria-label="genre">
          <CategoryIcon fontSize="small" />
        </ToggleButton>
      </ToggleButtonGroup>

      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.title || '')}
        sx={{ width: 300 }}
        loading={loading}
        onInputChange={handleInputChange}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={`Search by ${searchType === 'genre' ? 'genre' : searchType === 'title' ? 'title' : 'title or genre'}...`}
            variant="outlined"
            size="small"
            sx={{
              backgroundColor: 'white',
              borderRadius: 1
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ fontWeight: 'bold' }}>{option.title}</Box>
              <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {option.genres.join(', ')}
              </Box>
            </Box>
          </li>
        )}
      />
    </Box>
  );
};

export default SearchBar; 