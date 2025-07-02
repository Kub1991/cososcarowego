import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, Play, Star, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Movie {
  id: string;
  title: string;
  year: number;
  poster_path: string | null;
  vote_average: number | null;
  runtime: number | null;
  genres: string[] | null;
  overview: string | null;
  ai_brief_text: string | null;
  is_best_picture_nominee: boolean;
  is_best_picture_winner: boolean;
  oscar_year: number | null;
}

interface BrowseByYearsScreenProps {
  onBack: () => void;
  onMovieSelect: (movie: Movie) => void;
}

const BrowseByYearsScreen: React.FC<BrowseByYearsScreenProps> = ({ onBack, onMovieSelect }) => {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null);

  const decades = [
    { range: '2020s', years: [2020, 2021, 2022, 2023, 2024, 2025] },
    { range: '2010s', years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
    { range: '2000s', years: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009] },
    { range: '1990s', years: [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999] },
    { range: '1980s', years: [1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989] },
    { range: '1970s', years: [1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979] },
    { range: '1960s', years: [1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969] },
    { range: '1950s', years: [1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959] },
    { range: '1940s', years: [1940, 1941, 1942, 1943, 1944, 1945, 1946, 1947, 1948, 1949] },
    { range: '1930s', years: [1930, 1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939] },
  ];

  const fetchMoviesByYear = async (year: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('year', year)
        .eq('is_best_picture_nominee', true)
        .order('vote_average', { ascending: false });

      if (error) throw error;
      setMovies(data || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedYear) {
      fetchMoviesByYear(selectedYear);
    }
  }, [selectedYear]);

  const handleDecadeSelect = (decade: string) => {
    setSelectedDecade(decade);
    setSelectedYear(null);
    setMovies([]);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleBack = () => {
    if (selectedYear) {
      setSelectedYear(null);
      setMovies([]);
    } else if (selectedDecade) {
      setSelectedDecade(null);
    } else {
      onBack();
    }
  };

  const toggleMovieExpansion = (movieId: string) => {
    setExpandedMovie(expandedMovie === movieId ? null : movieId);
  };

  const parseBriefSections = (briefText: string) => {
    if (!briefText) return [];
    
    const lines = briefText.split('\n');
    const sections = [];
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      const headerMatch = line.match(/^(.+?)\s*\*\*(.+?)\*\*/);
      
      if (headerMatch) {
        if (currentSection.title || currentSection.content.trim()) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content.trim()
          });
        }
        
        currentSection = {
          title: headerMatch[2],
          content: ''
        };
      } else if (line.trim()) {
        if (currentSection.content) {
          currentSection.content += '\n';
        }
        currentSection.content += line;
      }
    }
    
    if (currentSection.title || currentSection.content.trim()) {
      sections.push({
        title: currentSection.title,
        content: currentSection.content.trim()
      });
    }
    
    if (sections.length === 0) {
      sections.push({
        title: '',
        content: briefText.trim()
      });
    }
    
    return sections;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Wstecz
          </button>
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">
              {selectedYear ? `Rok ${selectedYear}` : selectedDecade ? `Lata ${selectedDecade}` : 'Przeglądaj według lat'}
            </h1>
          </div>
        </div>

        {/* Content */}
        {!selectedDecade ? (
          /* Decades Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {decades.map((decade) => (
              <button
                key={decade.range}
                onClick={() => handleDecadeSelect(decade.range)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="text-2xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                  {decade.range}
                </div>
                <div className="text-white/60 text-sm">
                  {decade.years.length} lat
                </div>
              </button>
            ))}
          </div>
        ) : !selectedYear ? (
          /* Years Grid */
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {decades.find(d => d.range === selectedDecade)?.years.map((year) => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="text-lg font-semibold text-white group-hover:scale-110 transition-transform">
                  {year}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Movies List */
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                <p className="text-white/60 mt-4">Ładowanie filmów...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Brak filmów z tego roku w bazie danych</p>
              </div>
            ) : (
              movies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex gap-6 p-6">
                    {/* Poster */}
                    <div className="flex-shrink-0">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title}
                          className="w-24 h-36 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-36 bg-white/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-white/40" />
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{movie.title}</h3>
                          <div className="flex items-center gap-4 text-white/60 text-sm">
                            <span>{movie.year}</span>
                            {movie.runtime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{movie.runtime} min</span>
                              </div>
                            )}
                            {movie.vote_average && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>{movie.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {movie.is_best_picture_winner && (
                            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-semibold">
                              Zwycięzca
                            </span>
                          )}
                          {movie.is_best_picture_nominee && (
                            <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              Nominowany
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Genres */}
                      {movie.genres && movie.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {movie.genres.slice(0, 3).map((genre, index) => (
                            <span
                              key={index}
                              className="bg-white/20 text-white/80 px-2 py-1 rounded-full text-xs"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Overview */}
                      {movie.overview && (
                        <p className="text-white/70 text-sm mb-4 line-clamp-2">
                          {movie.overview}
                        </p>
                      )}

                      {/* AI Brief Sections */}
                      {movie.ai_brief_text && expandedMovie === movie.id && (
                        <div className="space-y-3 mb-4">
                          {parseBriefSections(movie.ai_brief_text).map((section, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3">
                              {section.title && (
                                <h4 className="text-purple-300 font-semibold text-sm mb-2">
                                  {section.title}
                                </h4>
                              )}
                              <p className="text-white/70 text-sm leading-relaxed">
                                {section.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onMovieSelect(movie)}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Wybierz film
                        </button>
                        {movie.ai_brief_text && (
                          <button
                            onClick={() => toggleMovieExpansion(movie.id)}
                            className="text-purple-300 hover:text-purple-200 text-sm transition-colors"
                          >
                            {expandedMovie === movie.id ? 'Zwiń' : 'Więcej informacji'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseByYearsScreen;