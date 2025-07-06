import React, { useEffect, useState, useRef, lazy, Suspense, memo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { addFavoriteMovie } from '../api';

// Current date and user information
const CURRENT_DATETIME = "2025-07-06 01:42:22";
const CURRENT_USER = "nithinmouli";

// Memoized components for better performance
const MoviePoster = memo(({ path, title, className }) => {
  const fallbackPoster = 'https://via.placeholder.com/500x750?text=No+Poster+Available';
  return (
    <img 
      src={path ? path : fallbackPoster} 
      alt={title} 
      className={className}
      loading="lazy"
    />
  );
});

const StarRating = memo(({ rating }) => {
  const stars = Math.round(rating / 2);
  return (
    <div className="flex items-center">
      <div className="flex mr-1">
        {[...Array(5)].map((_, index) => (
          <svg
            key={index}
            className={`w-3 h-3 sm:w-4 sm:h-4 ${index < stars ? 'text-yellow-400' : 'text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049.927.9 6.317H7.53L9.05.867l1.52 5.45h5.63l-4.55 3.3 1.74 5.23-4.34-3.15-4.34 3.15 1.74-5.23-4.55-3.3z" />
          </svg>
        ))}
      </div>
      <span className="font-semibold text-yellow-400 text-xs sm:text-sm">{rating.toFixed(1)}</span>
    </div>
  );
});

// Main Movie component
const Movie = () => {
  const { id } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(2);
  const [imdbId, setImdbId] = useState(null);
  const [tmdbId, setTmdbId] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('vidsrc');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for DOM elements
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const reviewsRef = useRef(null);

  // Fallback images
  const fallbackImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  const fallbackPoster = 'https://via.placeholder.com/500x750?text=No+Poster+Available';

  // API key (should be moved to environment variables in production)
  const apiKey = '1bf5ead9bb0ad708a1b4daa0e93f9b33';

  // Format runtime from minutes to hours and minutes
  const formatRuntime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Get Wikipedia link for a person
  const getWikipediaLink = (name) => {
    if (!name) return '#';
    const formattedName = name.split(' ').join('_');
    return `https://en.wikipedia.org/wiki/${formattedName}`;
  };

  // Get avatar URL from TMDB
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return fallbackImage;
    if (avatarPath.startsWith('/https')) {
      return avatarPath.replace('/https', 'https');
    }
    return `https://image.tmdb.org/t/p/w500${avatarPath}`;
  };

  // Get streaming URL based on selected provider
  const getStreamingUrl = () => {
    if (!imdbId && !tmdbId) return null;

    switch (selectedProvider) {
      case 'vidsrc':
        return imdbId 
          ? `https://vidsrc.xyz/embed/movie/${imdbId}?ds_lang=en&autoplay=1` 
          : `https://vidsrc.xyz/embed/movie/${tmdbId}?ds_lang=en&autoplay=1`;
      case '2embed':
        return imdbId
          ? `https://www.2embed.cc/embed/${imdbId}`
          : null;
      case 'godrive':
        return imdbId
          ? `https://godriveplayer.com/player.php?imdb=${imdbId}`
          : null;
      case 'vidsrcpro':
        return imdbId
          ? `https://vidsrc.me/embed/movie?imdb=${imdbId}`
          : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      case 'vidsrccc':
        return imdbId
          ? `https://vidsrc.cc/v2/embed/movie/${imdbId}`
          : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
      default:
        return imdbId 
          ? `https://vidsrc.xyz/embed/movie/${imdbId}?ds_lang=en&autoplay=1` 
          : `https://vidsrc.xyz/embed/movie/${tmdbId}?ds_lang=en&autoplay=1`;
    }
  };

  // Streaming providers data
  const providers = [
    { id: 'vidsrc', name: 'VidSrc', quality: 'HD', subtitles: true },
    { id: '2embed', name: '2Embed', quality: 'HD', subtitles: true },
    { id: 'godrive', name: 'GoDrive', quality: 'HD', subtitles: true },
    { id: 'vidsrcpro', name: 'VidSrc Pro', quality: 'HD+', subtitles: true },
    { id: 'vidsrccc', name: 'VidSrc CC', quality: '1080p', subtitles: true }
  ];

  // Load movie data
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch movie details
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
          params: {
            api_key: apiKey,
            append_to_response: 'credits,videos,watch/providers,external_ids',
          },
        });
        
        setMovieDetails(response.data);
        setTmdbId(id);
        
        if (response.data.external_ids && response.data.external_ids.imdb_id) {
          setImdbId(response.data.external_ids.imdb_id);
        }

        // Fetch additional data in parallel
        const [recommendationsResponse, reviewsResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${id}/recommendations`, {
            params: { api_key: apiKey },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${id}/reviews`, {
            params: { api_key: apiKey },
          })
        ]);

        // Set data with optimized array handling
        setRecommendations(recommendationsResponse.data.results.slice(0, 12));
        setReviews(reviewsResponse.data.results);
        
      } catch (err) {
        console.error('Error fetching movie details:', err);
        displayToast('Failed to load movie details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
    
    // Cleanup function
    return () => {
      // Cancel any pending requests if component unmounts
    };
  }, [id]);

  // Handle player loading state
  useEffect(() => {
    if (showPlayer) {
      setIsPlayerLoading(true);
    }
  }, [showPlayer, selectedProvider]);

  // Handle toast timeout
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Display toast messages
  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Add movie to favorites
  const handleAddToFavorites = async () => {
    try {
      await addFavoriteMovie(id);
      displayToast('Movie added to favorites!', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add movie to favorites.';
      if (errorMessage === 'Movie already in favorites') {
        displayToast('This movie is already in your favorites!', 'info');
      } else {
        displayToast(errorMessage, 'error');
      }
    }
  };

  // Toggle video player
  const togglePlayer = () => {
    setShowPlayer(!showPlayer);
    
    if (!showPlayer && playerContainerRef.current) {
      playerContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsPlayerLoading(false);
  };

  // Handle fullscreen
  const handleFullScreen = () => {
    if (playerRef.current) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      } else if (playerRef.current.webkitRequestFullscreen) {
        playerRef.current.webkitRequestFullscreen();
      } else if (playerRef.current.msRequestFullscreen) {
        playerRef.current.msRequestFullscreen();
      }
    }
  };

  // Change streaming provider
  const changeProvider = (provider) => {
    setSelectedProvider(provider);
    if (showPlayer) {
      setIsPlayerLoading(true);
    }
  };

  // Load more reviews
  const handleReadMore = () => {
    if (isLoadingMoreReviews) return;
    
    // Show loading state
    setIsLoadingMoreReviews(true);
    
    // Using requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Add more reviews
        setVisibleReviews((prev) => prev + 2);
        setIsLoadingMoreReviews(false);
        
        // Scroll to the new reviews after a slight delay
        setTimeout(() => {
          const reviewElements = document.querySelectorAll('.review-card');
          if (reviewElements.length > 0) {
            const lastVisible = reviewElements[Math.min(visibleReviews, reviewElements.length - 1)];
            if (lastVisible) {
              lastVisible.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 100);
      }, 500); // Reduced loading time for better performance
    });
  };

  // Show loading spinner while initial data loads
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-white text-lg">Loading movie details...</p>
        </div>
      </div>
    );
  }

  // Extract needed data from movieDetails
  if (!movieDetails) return null;

  const {
    title,
    backdrop_path,
    poster_path,
    overview,
    release_date,
    vote_average,
    runtime,
    genres,
    tagline,
    production_companies,
    popularity,
    production_countries,
    credits
  } = movieDetails;

  const director = credits?.crew?.find(person => person.job === 'Director');
  const cast = credits?.cast?.slice(0, 15) || []; // Limit cast to 15 people
  const trailer = movieDetails.videos?.results?.find(video => video.type === 'Trailer');
  const releaseYear = release_date ? new Date(release_date).getFullYear() : '';
  const streamingUrl = getStreamingUrl();

  return (
    <div className="bg-gray-900 text-white">
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-16 sm:top-20 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <div className={`flex items-center p-3 sm:p-4 rounded-lg shadow-md ${
            toastType === 'success' ? 'bg-green-800 text-green-100' : 
            toastType === 'error' ? 'bg-red-800 text-red-100' : 
            'bg-blue-800 text-blue-100'
          }`}>
            {toastType === 'success' && (
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toastType === 'error' && (
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm sm:text-base">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Hero section with backdrop */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-10"></div>
        
        {/* Background image */}
        <img
          src={`https://image.tmdb.org/t/p/original${backdrop_path || poster_path}`}
          alt={title}
          className="h-full w-full object-cover object-top sm:object-center"
          loading="eager"
        />
        
        {/* Movie info section */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Movie poster - visible on all screens but with different styling */}
            <div className="hidden md:block">
              <MoviePoster 
                path={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : fallbackPoster}
                title={title}
                className="w-40 lg:w-52 h-auto rounded-lg border-2 border-gray-800 shadow-lg"
              />
            </div>
            
            {/* Movie details */}
            <div className="flex-1">
              {/* Title and year */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                {title}
                {releaseYear && <span className="text-xl sm:text-2xl ml-2 font-normal text-gray-300">({releaseYear})</span>}
              </h1>
              
              {/* Movie metadata */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                <span className="bg-blue-600/30 border border-blue-700 py-0.5 px-2 sm:py-1 sm:px-3 rounded-full text-xs sm:text-sm">
                  {release_date}
                </span>
                
                {runtime && (
                  <span className="bg-blue-600/30 border border-blue-700 py-0.5 px-2 sm:py-1 sm:px-3 rounded-full text-xs sm:text-sm">
                    {formatRuntime(runtime)}
                  </span>
                )}
                
                <StarRating rating={vote_average} />
                
                {imdbId && (
                  <a 
                    href={`https://www.imdb.com/title/${imdbId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-yellow-600/30 border border-yellow-700 py-0.5 px-2 sm:py-1 sm:px-3 rounded-full text-xs sm:text-sm"
                  >
                    IMDb
                  </a>
                )}
              </div>
              
              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="text-white text-xs sm:text-sm bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 sm:px-3 sm:py-1"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
              
              {/* Overview - fewer lines on mobile */}
              <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-5 max-w-3xl line-clamp-3 sm:line-clamp-4 md:line-clamp-none">
                {overview}
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm sm:text-base font-medium rounded-full py-1.5 px-3 sm:py-2 sm:px-5 bg-red-600/80 hover:bg-red-600"
                  >
                    <svg
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
                    </svg>
                    <span className="hidden sm:inline">Watch</span> Trailer
                  </a>
                )}
                
                {(imdbId || tmdbId) ? (
                  <button
                    onClick={togglePlayer}
                    className="flex items-center gap-1.5 text-sm sm:text-base font-medium rounded-full py-1.5 px-3 sm:py-2 sm:px-5 bg-green-600/80 hover:bg-green-600"
                  >
                    <svg
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
                    </svg>
                    <span className="hidden sm:inline">{showPlayer ? 'Hide' : 'Watch'}</span> Movie
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-1.5 text-sm sm:text-base font-medium rounded-full py-1.5 px-3 sm:py-2 sm:px-5 bg-green-600/40 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <svg
                      stroke="currentColor"
                      fill="currentColor"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
                    </svg>
                    <span className="hidden sm:inline">Watch</span> Movie
                  </button>
                )}
                
                <button
                  onClick={handleAddToFavorites}
                  className="flex items-center gap-1.5 text-sm sm:text-base font-medium rounded-full py-1.5 px-3 sm:py-2 sm:px-5 bg-yellow-600/80 hover:bg-yellow-600"
                >
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 576 512"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path>
                  </svg>
                  <span className="hidden sm:inline">Add to</span> Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Better Mobile poster with details */}
      <div className="md:hidden px-4 py-5">
        <div className="flex items-start">
          <div className="w-1/3 flex-shrink-0 mr-4">
            <MoviePoster 
              path={poster_path ? `https://image.tmdb.org/t/p/w342${poster_path}` : fallbackPoster}
              title={title}
              className="w-full h-auto rounded-lg border border-gray-700 shadow-md"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">About this movie</h2>
            <p className="text-sm text-gray-300 mb-2">
              {tagline || `Released in ${releaseYear}`}
            </p>
            <div className="text-xs text-gray-400">
              {production_companies && production_companies.length > 0 && (
                <p className="mb-1">Studios: {production_companies.slice(0, 2).map(company => company.name).join(', ')}</p>
              )}
              <p>Popularity: {popularity?.toFixed(0)}</p>
              {production_countries && production_countries.length > 0 && (
                <p className="mt-1">Country: {production_countries[0].name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video player */}
      {(imdbId || tmdbId) && (
        <div ref={playerContainerRef} className="py-4 sm:py-6 md:py-8 px-3 sm:px-6 md:px-12">
          <div className="w-full rounded-lg overflow-hidden bg-black/60 border border-gray-700 shadow-md">
            {!showPlayer ? (
              <div className="relative">
                <img 
                  src={`https://image.tmdb.org/t/p/w1280${backdrop_path || poster_path}`} 
                  alt={title} 
                  className="w-full h-auto sm:h-[300px] md:h-[400px] lg:h-[500px] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                  <button 
                    onClick={togglePlayer}
                    className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-600/80 hover:bg-green-600"
                    aria-label="Play movie"
                  >
                    <svg
                      stroke="currentColor"
                      fill="white"
                      strokeWidth="0"
                      viewBox="0 0 448 512"
                      height="1.5em"
                      width="1.5em"
                      className="sm:h-8 sm:w-8"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path>
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-white text-base sm:text-xl font-bold">{title}</h3>
                  <p className="text-gray-300 text-xs sm:text-sm">Click to watch the movie</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Provider selection buttons */}
                <div className="bg-gray-900 p-2 sm:p-3 flex flex-wrap gap-1.5 sm:gap-2 justify-center border-b border-gray-700">
                  {providers.map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => changeProvider(provider.id)}
                      className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                        selectedProvider === provider.id 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="flex items-center">
                        {provider.name}
                        <span className={`ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded ${
                          provider.quality === 'HD+' || provider.quality === '1080p' 
                            ? 'bg-blue-600/80 text-blue-100' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {provider.quality}
                        </span>
                        {provider.subtitles && (
                          <span className="ml-1 sm:ml-2 text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 4h5" />
                            </svg>
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Video player with aspect ratio container */}
                <div className="relative w-full h-0 pb-[56.25%] bg-black will-change-transform">
                  {isPlayerLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-16 sm:w-16 border-t-2 border-b-2 border-green-500 mb-3 sm:mb-4"></div>
                        <p className="text-white text-sm sm:text-base">Loading {providers.find(p => p.id === selectedProvider)?.name || 'player'}...</p>
                      </div>
                    </div>
                  )}
                  
                  {streamingUrl && (
                    <iframe
                      ref={playerRef}
                      src={streamingUrl}
                      className={`absolute top-0 left-0 w-full h-full ${isPlayerLoading ? 'opacity-0' : 'opacity-100'}`}
                      allowFullScreen
                      title={title}
                      onLoad={handleIframeLoad}
                      allow="autoplay; fullscreen"
                      loading="lazy"
                    ></iframe>
                  )}
                  
                  {/* Player controls */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex space-x-1 sm:space-x-2 opacity-70 hover:opacity-100">
                    <button 
                      onClick={handleFullScreen}
                      className="p-1.5 sm:p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md"
                      aria-label="Fullscreen"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                      </svg>
                    </button>
                    <button 
                      onClick={togglePlayer}
                      className="p-1.5 sm:p-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                      aria-label="Close player"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Player footer info */}
                <div className="bg-gray-900 p-2 text-[10px] sm:text-xs text-gray-400 flex flex-col sm:flex-row sm:justify-between sm:items-center border-t border-gray-700">
                  <div className="mb-1 sm:mb-0">
                    <span>Using {providers.find(p => p.id === selectedProvider)?.name || 'player'} | Quality: {providers.find(p => p.id === selectedProvider)?.quality}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>If one provider doesn't work, try another</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cast and crew section */}
      <div className="py-6 sm:py-8 px-3 sm:px-6 md:px-12">
        {/* Director section */}
        {director && (
          <div className="mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold text-center mb-4 sm:mb-6">
              Director
            </h2>
            <div className="flex justify-center">
              <a
                href={getWikipediaLink(director.name)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-full border-2 border-blue-700/30">
                    <img
                      src={director.profile_path ? `https://image.tmdb.org/t/p/w500${director.profile_path}` : fallbackImage}
                      alt={director.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-2 sm:mt-3 text-base sm:text-lg font-medium text-white">{director.name}</h3>
                  <p className="text-sm text-gray-400">Director</p>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* Cast section with horizontal scrolling */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold text-center mb-4 sm:mb-6">
            Cast
          </h2>
          
          <div className="relative">
            {/* Left shadow indicator for scrolling */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none"></div>
            
            {/* Scrollable cast list */}
            <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {cast.map((member) => (
                <a
                  key={member.cast_id}
                  href={getWikipediaLink(member.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-24 sm:w-32"
                >
                  <div className="flex flex-col">
                    <div className="w-24 h-32 sm:w-32 sm:h-44 overflow-hidden rounded-lg border border-gray-700">
                      <img
                        src={member.profile_path ? `https://image.tmdb.org/t/p/w500${member.profile_path}` : fallbackImage}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-medium text-white line-clamp-1">{member.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-1">{member.character}</p>
                  </div>
                </a>
              ))}
            </div>
            
            {/* Right shadow indicator for scrolling */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Reviews section - Only show if reviews exist */}
      {reviews.length > 0 && (
        <div ref={reviewsRef} className="py-6 sm:py-8 px-3 sm:px-6 md:px-12 bg-gray-900/95">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold text-center mb-4 sm:mb-6">
            Reviews <span className="text-sm text-gray-400">({reviews.length})</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {reviews.slice(0, visibleReviews).map((review, index) => (
              <div key={review.id} className="review-card bg-gray-800/50 border border-gray-700 rounded-lg p-3 sm:p-5 transition-all duration-300 hover:bg-gray-800 will-change-transform">
                <div className="flex items-center mb-2 sm:mb-3">
                  <img
                    src={review.author_details.avatar_path ? getAvatarUrl(review.author_details.avatar_path) : fallbackImage}
                    alt={review.author}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">{review.author}</h4>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 line-clamp-3">
                  {review.content}
                </p>
                <a 
                  href={review.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 sm:mt-3 text-xs sm:text-sm text-blue-400 hover:text-blue-300"
                >
                  Read full review
                </a>
              </div>
            ))}
          </div>
          
          {/* Enhanced "Load More Reviews" button */}
          {reviews.length > visibleReviews && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <button
                onClick={handleReadMore}
                disabled={isLoadingMoreReviews}
                className={`
                  px-6 py-2.5 sm:px-8 sm:py-3 
                  rounded-lg text-sm sm:text-base font-medium
                  flex items-center justify-center gap-2
                  transform transition-all will-change-transform
                  ${isLoadingMoreReviews 
                    ? 'bg-blue-700/50 cursor-wait' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-700/20'
                  }
                `}
              >
                {isLoadingMoreReviews ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Reviews</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* Reviews count indicator */}
          <div className="text-center mt-4 text-xs sm:text-sm text-gray-400">
            Showing {Math.min(visibleReviews, reviews.length)} of {reviews.length} reviews
          </div>
        </div>
      )}

      {/* Recommendations section with horizontal scrolling */}
      {recommendations.length > 0 && (
        <div className="py-6 sm:py-8 px-3 sm:px-6 md:px-12">
          <h2 className="text-xl sm:text-2xl text-blue-300 font-semibold text-center mb-4 sm:mb-6">
            Recommended Movies
          </h2>
          
          <div className="relative">
            {/* Left shadow indicator for scrolling */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {recommendations.map((movie) => (
                <a
                  key={movie.id}
                  href={`/movie/${movie.id}`}
                  className="flex-shrink-0 w-28 sm:w-36"
                >
                  <div className="flex flex-col">
                    <div className="w-28 h-40 sm:w-36 sm:h-52 overflow-hidden rounded-lg border border-gray-700">
                      <MoviePoster 
                        path={movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : fallbackPoster}
                        title={movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-medium text-white line-clamp-1">{movie.title}</h4>
                    <div className="flex items-center mt-0.5 sm:mt-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049.927.9 6.317H7.53L9.05.867l1.52 5.45h5.63l-4.55 3.3 1.74 5.23-4.34-3.15-4.34 3.15 1.74-5.23-4.55-3.3z" />
                      </svg>
                      <p className="text-xs sm:text-sm text-gray-400">{movie.vote_average.toFixed(1)}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            
            {/* Right shadow indicator for scrolling */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
      )}
      
      {/* Footer with user and timestamp */}
      
    </div>
  );
};

export default Movie;