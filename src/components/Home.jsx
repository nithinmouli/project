import { useEffect, useState } from "react";
import axios from "axios";
import MovieList from "./MovieList";
import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";

function Home() {
  const [searchMovies, setSearchMovies] = useState("");
  const [movies, setMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [popularPage, setPopularPage] = useState(1);
  const apiKey = '1bf5ead9bb0ad708a1b4daa0e93f9b33';

  const moviesFetch = async () => {
    if (searchMovies.trim()) {
      const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
        params: {
          api_key: apiKey,
          query: searchMovies,
        },
      });
      setMovies(response.data.results || []);
    }
  };

  const fetchTopRatedMovies = async () => {
    const response = await axios.get("https://api.themoviedb.org/3/movie/top_rated", {
      params: {
        api_key: apiKey,
        page: topRatedPage,
      },
    });
    setTopRatedMovies((prev) => [...prev, ...response.data.results]);
  };

  const fetchUpcomingMovies = async () => {
    const response = await axios.get("https://api.themoviedb.org/3/movie/upcoming", {
      params: {
        api_key: apiKey,
        page: upcomingPage,
      },
    });
    setUpcomingMovies((prev) => [...prev, ...response.data.results]);
  };

  const fetchPopularMovies = async () => {
    const response = await axios.get("https://api.themoviedb.org/3/movie/popular", {
      params: {
        api_key: apiKey,
        page: popularPage,
      },
    });
    setPopularMovies((prev) => [...prev, ...response.data.results]);
  };

  useEffect(() => {
    moviesFetch();
  }, [searchMovies]);

  useEffect(() => {
    fetchTopRatedMovies();
  }, [topRatedPage]);

  useEffect(() => {
    fetchUpcomingMovies();
  }, [upcomingPage]);

  useEffect(() => {
    fetchPopularMovies();
  }, [popularPage]);

  const displayedTopRatedMovies = topRatedMovies.slice(0, 15);
  const displayedUpcomingMovies = upcomingMovies.slice(0, 15);
  const displayedPopularMovies = popularMovies.slice(0, 15);

  return (
    <div className="bg-black text-white flex flex-col items-center min-h-screen px-4">
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-lg my-8">
          <SearchBar
            searchMovies={searchMovies}
            setSearchMovies={setSearchMovies}
            onSearch={moviesFetch}
          />
        </div>
      </div>

      <div className="w-full">
        {searchMovies ? (
          <MovieList movies={movies} />
        ) : (
          <>
            <div className="my-10">
              <h1 className="text-3xl text-blue-300 font-semibold text-center p-2">Upcoming Movies</h1>
              <div className="md:px-5 flex flex-row my-5 max-w-full items-center overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-500/20 scrollbar-track-gray-900/90 md:pb-3">
                {displayedUpcomingMovies.map((movie) => (
                  <a
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    className="flex min-w-[9rem] md:min-w-[10rem] max-w-[9rem] md:max-w-[10rem] h-full items-center text-center flex-col mx-3 cursor-pointer"  // Increased margin
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-[20rem] max-w-[14rem] object-cover rounded-xl transition-transform duration-300 ease-in-out transform hover:scale-105"
                    />
                    <p className="text-white mt-2">{movie.title}</p>
                  </a>
                ))}
                <Link to={`/movies/upcoming-movies`} className="flex-shrink-0 mx-3">
                  <button 
                    className="text-white  to-purple-600 hover:from-blue-700 hover:to-purple-800 font-bold py-2 px-6 rounded-full shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105">
                    See More
                  </button>
                </Link>
              </div>
             
            </div>

            <div className="my-10">
              <h1 className="text-3xl text-blue-300 font-semibold text-center p-2">Top Rated Movies</h1>
              <div className="md:px-5 flex flex-row my-5 max-w-full items-center overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-500/20 scrollbar-track-gray-900/90 md:pb-3">
                {displayedTopRatedMovies.map((movie) => (
                  <a
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    className="flex min-w-[9rem] md:min-w-[10rem] max-w-[9rem] md:max-w-[10rem] h-full items-center text-center flex-col mx-3 cursor-pointer"  // Increased margin
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-[20rem] max-w-[14rem] object-cover rounded-xl transition-transform duration-300 ease-in-out transform hover:scale-105"
                    />
                    <p className="text-white mt-2">{movie.title}</p>
                  </a>
                ))}
                <Link to={`/movies/top-rated`} className="flex-shrink-0 mx-3">
                  <button 
                    className="text-white hover:from-blue-700 hover:to-purple-800 font-bold py-2 px-6 rounded-full shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105">
                    See More
                  </button>
                </Link>
              </div>
              
            </div>

            <div className="my-10">
              <h1 className="text-3xl text-blue-300 font-semibold text-center p-2">Popular Movies</h1>
              <div className="md:px-5 flex flex-row my-5 max-w-full items-center overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-500/20 scrollbar-track-gray-900/90 md:pb-3">
                {displayedPopularMovies.map((movie) => (
                  <a
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    className="flex min-w-[9rem] md:min-w-[10rem] max-w-[9rem] md:max-w-[10rem] h-full items-center text-center flex-col mx-3 cursor-pointer"  // Increased margin
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-[20rem] max-w-[14rem] object-cover rounded-xl transition-transform duration-300 ease-in-out transform hover:scale-105"
                    />
                    <p className="text-white mt-2">{movie.title}</p>
                  </a>
                ))}

                <Link to={`/movies/popular`} className="flex-shrink-0 mx-3">
                  <button 
                    className="text-white  hover:from-blue-700 hover:to-purple-800 font-bold py-2 px-6 rounded-full shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-105">
                    See More
                  </button>
                </Link>
              </div>
              
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
