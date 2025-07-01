/**
 * Script to check which movies are missing from the database
 * Compares the expected 145 Oscar nominees with what's actually in the database
 * UPDATED: Now includes 2010s decade (2011-2020 ceremonies)
 * Also identifies unexpected movies that shouldn't be in the database
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Expected 145 movies - UPDATED TO INCLUDE 2010s decade
const EXPECTED_MOVIES = [
  // 2001 (73rd Academy Awards - films from 2000)
  { title: "Gladiator", year: 2001, winner: true },
  { title: "Chocolat", year: 2001, winner: false },
  { title: "Crouching Tiger, Hidden Dragon", year: 2001, winner: false },
  { title: "Erin Brockovich", year: 2001, winner: false },
  { title: "Traffic", year: 2001, winner: false },
  
  // 2002 (74th Academy Awards - films from 2001)
  { title: "A Beautiful Mind", year: 2002, winner: true },
  { title: "Gosford Park", year: 2002, winner: false },
  { title: "In the Bedroom", year: 2002, winner: false },
  { title: "The Lord of the Rings: The Fellowship of the Ring", year: 2002, winner: false },
  { title: "Moulin Rouge!", year: 2002, winner: false },
  
  // 2003 (75th Academy Awards - films from 2002)
  { title: "Chicago", year: 2003, winner: true },
  { title: "Gangs of New York", year: 2003, winner: false },
  { title: "The Hours", year: 2003, winner: false },
  { title: "The Lord of the Rings: The Two Towers", year: 2003, winner: false },
  { title: "The Pianist", year: 2003, winner: false },
  
  // 2004 (76th Academy Awards - films from 2003)
  { title: "The Lord of the Rings: The Return of the King", year: 2004, winner: true },
  { title: "Lost in Translation", year: 2004, winner: false },
  { title: "Master and Commander: The Far Side of the World", year: 2004, winner: false },
  { title: "Mystic River", year: 2004, winner: false },
  { title: "Seabiscuit", year: 2004, winner: false },
  
  // 2005 (77th Academy Awards - films from 2004)
  { title: "Million Dollar Baby", year: 2005, winner: true },
  { title: "The Aviator", year: 2005, winner: false },
  { title: "Finding Neverland", year: 2005, winner: false },
  { title: "Ray", year: 2005, winner: false },
  { title: "Sideways", year: 2005, winner: false },
  
  // 2006 (78th Academy Awards - films from 2005)
  { title: "Crash", year: 2006, winner: true },
  { title: "Brokeback Mountain", year: 2006, winner: false },
  { title: "Capote", year: 2006, winner: false },
  { title: "Good Night, and Good Luck", year: 2006, winner: false },
  { title: "Munich", year: 2006, winner: false },
  
  // 2007 (79th Academy Awards - films from 2006)
  { title: "The Departed", year: 2007, winner: true },
  { title: "Babel", year: 2007, winner: false },
  { title: "Letters from Iwo Jima", year: 2007, winner: false },
  { title: "Little Miss Sunshine", year: 2007, winner: false },
  { title: "The Queen", year: 2007, winner: false },
  
  // 2008 (80th Academy Awards - films from 2007)
  { title: "No Country for Old Men", year: 2008, winner: true },
  { title: "Atonement", year: 2008, winner: false },
  { title: "Juno", year: 2008, winner: false },
  { title: "Michael Clayton", year: 2008, winner: false },
  { title: "There Will Be Blood", year: 2008, winner: false },
  
  // 2009 (81st Academy Awards - films from 2008)
  { title: "Slumdog Millionaire", year: 2009, winner: true },
  { title: "The Curious Case of Benjamin Button", year: 2009, winner: false },
  { title: "Frost/Nixon", year: 2009, winner: false },
  { title: "Milk", year: 2009, winner: false },
  { title: "The Reader", year: 2009, winner: false },
  
  // 2010 (82nd Academy Awards - films from 2009)
  { title: "The Hurt Locker", year: 2010, winner: true },
  { title: "Avatar", year: 2010, winner: false },
  { title: "The Blind Side", year: 2010, winner: false },
  { title: "District 9", year: 2010, winner: false },
  { title: "An Education", year: 2010, winner: false },
  { title: "Inglourious Basterds", year: 2010, winner: false },
  { title: "Precious", year: 2010, winner: false },
  { title: "A Serious Man", year: 2010, winner: false },
  { title: "Up", year: 2010, winner: false },
  { title: "Up in the Air", year: 2010, winner: false },

  // 2011 (83rd Academy Awards - films from 2010)
  { title: "The King's Speech", year: 2011, winner: true },
  { title: "Black Swan", year: 2011, winner: false },
  { title: "The Fighter", year: 2011, winner: false },
  { title: "Inception", year: 2011, winner: false },
  { title: "The Kids Are All Right", year: 2011, winner: false },
  { title: "127 Hours", year: 2011, winner: false },
  { title: "The Social Network", year: 2011, winner: false },
  { title: "Toy Story 3", year: 2011, winner: false },
  { title: "True Grit", year: 2011, winner: false },
  { title: "Winter's Bone", year: 2011, winner: false },

  // 2012 (84th Academy Awards - films from 2011)
  { title: "The Artist", year: 2012, winner: true },
  { title: "The Descendants", year: 2012, winner: false },
  { title: "Extremely Loud & Incredibly Close", year: 2012, winner: false },
  { title: "The Help", year: 2012, winner: false },
  { title: "Hugo", year: 2012, winner: false },
  { title: "Midnight in Paris", year: 2012, winner: false },
  { title: "Moneyball", year: 2012, winner: false },
  { title: "The Tree of Life", year: 2012, winner: false },
  { title: "War Horse", year: 2012, winner: false },

  // 2013 (85th Academy Awards - films from 2012)
  { title: "Argo", year: 2013, winner: true },
  { title: "Amour", year: 2013, winner: false },
  { title: "Beasts of the Southern Wild", year: 2013, winner: false },
  { title: "Django Unchained", year: 2013, winner: false },
  { title: "Les Misérables", year: 2013, winner: false },
  { title: "Life of Pi", year: 2013, winner: false },
  { title: "Lincoln", year: 2013, winner: false },
  { title: "Silver Linings Playbook", year: 2013, winner: false },
  { title: "Zero Dark Thirty", year: 2013, winner: false },

  // 2014 (86th Academy Awards - films from 2013)
  { title: "12 Years a Slave", year: 2014, winner: true },
  { title: "American Hustle", year: 2014, winner: false },
  { title: "Captain Phillips", year: 2014, winner: false },
  { title: "Dallas Buyers Club", year: 2014, winner: false },
  { title: "Gravity", year: 2014, winner: false },
  { title: "Her", year: 2014, winner: false },
  { title: "Nebraska", year: 2014, winner: false },
  { title: "Philomena", year: 2014, winner: false },
  { title: "The Wolf of Wall Street", year: 2014, winner: false },

  // 2015 (87th Academy Awards - films from 2014)
  { title: "Birdman", year: 2015, winner: true },
  { title: "American Sniper", year: 2015, winner: false },
  { title: "Boyhood", year: 2015, winner: false },
  { title: "The Grand Budapest Hotel", year: 2015, winner: false },
  { title: "The Imitation Game", year: 2015, winner: false },
  { title: "Selma", year: 2015, winner: false },
  { title: "The Theory of Everything", year: 2015, winner: false },
  { title: "Whiplash", year: 2015, winner: false },

  // 2016 (88th Academy Awards - films from 2015)
  { title: "Spotlight", year: 2016, winner: true },
  { title: "The Big Short", year: 2016, winner: false },
  { title: "Bridge of Spies", year: 2016, winner: false },
  { title: "Brooklyn", year: 2016, winner: false },
  { title: "Mad Max: Fury Road", year: 2016, winner: false },
  { title: "The Martian", year: 2016, winner: false },
  { title: "The Revenant", year: 2016, winner: false },
  { title: "Room", year: 2016, winner: false },

  // 2017 (89th Academy Awards - films from 2016)
  { title: "Moonlight", year: 2017, winner: true },
  { title: "Arrival", year: 2017, winner: false },
  { title: "Fences", year: 2017, winner: false },
  { title: "Hacksaw Ridge", year: 2017, winner: false },
  { title: "Hell or High Water", year: 2017, winner: false },
  { title: "Hidden Figures", year: 2017, winner: false },
  { title: "La La Land", year: 2017, winner: false },
  { title: "Lion", year: 2017, winner: false },
  { title: "Manchester by the Sea", year: 2017, winner: false },

  // 2018 (90th Academy Awards - films from 2017)
  { title: "The Shape of Water", year: 2018, winner: true },
  { title: "Call Me by Your Name", year: 2018, winner: false },
  { title: "Darkest Hour", year: 2018, winner: false },
  { title: "Dunkirk", year: 2018, winner: false },
  { title: "Get Out", year: 2018, winner: false },
  { title: "Lady Bird", year: 2018, winner: false },
  { title: "Phantom Thread", year: 2018, winner: false },
  { title: "The Post", year: 2018, winner: false },
  { title: "Three Billboards Outside Ebbing, Missouri", year: 2018, winner: false },

  // 2019 (91st Academy Awards - films from 2018)
  { title: "Green Book", year: 2019, winner: true },
  { title: "Black Panther", year: 2019, winner: false },
  { title: "BlacKkKlansman", year: 2019, winner: false },
  { title: "Bohemian Rhapsody", year: 2019, winner: false },
  { title: "The Favourite", year: 2019, winner: false },
  { title: "Roma", year: 2019, winner: false },
  { title: "A Star Is Born", year: 2019, winner: false },
  { title: "Vice", year: 2019, winner: false },

  // 2020 (92nd Academy Awards - films from 2019)
  { title: "Parasite", year: 2020, winner: true },
  { title: "Ford v Ferrari", year: 2020, winner: false },
  { title: "The Irishman", year: 2020, winner: false },
  { title: "Jojo Rabbit", year: 2020, winner: false },
  { title: "Joker", year: 2020, winner: false },
  { title: "Little Women", year: 2020, winner: false },
  { title: "Marriage Story", year: 2020, winner: false },
  { title: "1917", year: 2020, winner: false },
  { title: "Once Upon a Time in Hollywood", year: 2020, winner: false }
];

function normalizeTitle(title) {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function checkMissingMovies() {
  console.log('🔍 Sprawdzanie brakujących filmów w bazie danych...\n');
  console.log('📊 UPDATED: Sprawdzanie 145 filmów oscarowych z 2 dekad (2000-2019)!\n');
  
  try {
    // Pobierz wszystkie filmy z bazy danych
    const { data: dbMovies, error } = await supabase
      .from('movies')
      .select('id, title, oscar_year, is_best_picture_winner, tmdb_id, created_at')
      .eq('is_best_picture_nominee', true)
      .order('oscar_year', { ascending: true });

    if (error) {
      console.error('❌ Błąd podczas pobierania filmów z bazy:', error);
      return;
    }

    console.log(`📊 Znaleziono ${dbMovies.length} filmów w bazie danych`);
    console.log(`📋 Oczekiwano ${EXPECTED_MOVIES.length} filmów (2 dekady: 2000-2019)\n`);

    // Stwórz mapę oczekiwanych filmów dla łatwego porównania
    const expectedMoviesMap = new Map();
    EXPECTED_MOVIES.forEach(movie => {
      const normalizedTitle = normalizeTitle(movie.title);
      const key = `${normalizedTitle}_${movie.year}`;
      expectedMoviesMap.set(key, movie);
    });

    // Stwórz mapę filmów z bazy danych dla łatwego porównania
    const dbMoviesMap = new Map();
    dbMovies.forEach(movie => {
      const normalizedTitle = normalizeTitle(movie.title);
      const key = `${normalizedTitle}_${movie.oscar_year}`;
      dbMoviesMap.set(key, movie);
    });

    // Znajdź brakujące filmy
    const missingMovies = [];
    const foundMovies = [];

    EXPECTED_MOVIES.forEach(expectedMovie => {
      const normalizedTitle = normalizeTitle(expectedMovie.title);
      const key = `${normalizedTitle}_${expectedMovie.year}`;
      
      if (dbMoviesMap.has(key)) {
        foundMovies.push(expectedMovie);
      } else {
        missingMovies.push(expectedMovie);
      }
    });

    // Znajdź nieoczekiwane filmy (są w bazie, ale nie na liście oczekiwanych)
    const unexpectedMovies = [];
    dbMovies.forEach(dbMovie => {
      const normalizedTitle = normalizeTitle(dbMovie.title);
      const key = `${normalizedTitle}_${dbMovie.oscar_year}`;
      
      if (!expectedMoviesMap.has(key)) {
        unexpectedMovies.push(dbMovie);
      }
    });

    // Wyświetl wyniki
    console.log(`✅ Znalezione filmy: ${foundMovies.length}`);
    console.log(`❌ Brakujące filmy: ${missingMovies.length}`);
    console.log(`⚠️  Nieoczekiwane filmy: ${unexpectedMovies.length}\n`);

    // Analiza według dekad
    const foundByDecade = { '2000s': 0, '2010s': 0 };
    const missingByDecade = { '2000s': 0, '2010s': 0 };
    
    foundMovies.forEach(movie => {
      if (movie.year >= 2001 && movie.year <= 2010) foundByDecade['2000s']++;
      else if (movie.year >= 2011 && movie.year <= 2020) foundByDecade['2010s']++;
    });
    
    missingMovies.forEach(movie => {
      if (movie.year >= 2001 && movie.year <= 2010) missingByDecade['2000s']++;
      else if (movie.year >= 2011 && movie.year <= 2020) missingByDecade['2010s']++;
    });

    console.log(`📈 ANALIZA WEDŁUG DEKAD:`);
    console.log(`========================`);
    console.log(`2000s (2001-2010): ${foundByDecade['2000s']}/55 znalezionych, ${missingByDecade['2000s']} brakujących`);
    console.log(`2010s (2011-2020): ${foundByDecade['2010s']}/90 znalezionych, ${missingByDecade['2010s']} brakujących\n`);

    if (missingMovies.length > 0) {
      console.log('🚨 BRAKUJĄCE FILMY:');
      console.log('=' .repeat(50));
      
      // Grupuj brakujące filmy według roku
      const missingByYear = {};
      missingMovies.forEach(movie => {
        if (!missingByYear[movie.year]) {
          missingByYear[movie.year] = [];
        }
        missingByYear[movie.year].push(movie);
      });

      Object.keys(missingByYear).sort().forEach(year => {
        console.log(`\n📅 ${year} (ceremonia Oscarów):`);
        missingByYear[year].forEach(movie => {
          const status = movie.winner ? '🏆 ZWYCIĘZCA' : '🎬 Nominowany';
          console.log(`   ${status}: ${movie.title}`);
        });
      });
    }

    if (unexpectedMovies.length > 0) {
      console.log('\n🚨 NIEOCZEKIWANE FILMY W BAZIE DANYCH:');
      console.log('=' .repeat(50));
      console.log('Te filmy są w bazie danych, ale nie ma ich na liście 145 oczekiwanych filmów:\n');
      
      unexpectedMovies.forEach(movie => {
        console.log(`📽️  "${movie.title}" (${movie.oscar_year})`);
        console.log(`   🆔 ID: ${movie.id}`);
        console.log(`   🎬 TMDB ID: ${movie.tmdb_id}`);
        console.log(`   📅 Dodano: ${new Date(movie.created_at).toLocaleString('pl-PL')}`);
        console.log(`   🏆 Status: ${movie.is_best_picture_winner ? 'Zwycięzca' : 'Nominowany'}`);
        console.log('');
      });
      
      if (unexpectedMovies.length === 1) {
        console.log('💡 INSTRUKCJA USUNIĘCIA:');
        console.log('=' .repeat(30));
        console.log('1. Przejdź do panelu Supabase w przeglądarce');
        console.log('2. Wybierz "Database" → "Table Editor"'); 
        console.log('3. Wybierz tabelę "movies"');
        console.log(`4. Znajdź wiersz z ID: ${unexpectedMovies[0].id}`);
        console.log('5. Kliknij ikonę kosza, aby usunąć wiersz');
        console.log('6. Potwierdź usunięcie\n');
      }
    }

    // Sprawdź, czy są duplikaty w bazie
    console.log('🔍 Sprawdzanie duplikatów...');
    const titleCounts = {};
    dbMovies.forEach(movie => {
      const normalizedTitle = normalizeTitle(movie.title);
      const key = `${normalizedTitle}_${movie.oscar_year}`;
      titleCounts[key] = (titleCounts[key] || 0) + 1;
    });

    const duplicates = Object.entries(titleCounts).filter(([title, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  ZNALEZIONO DUPLIKATY:');
      duplicates.forEach(([title, count]) => {
        console.log(`   "${title}" - ${count} razy`);
      });
    } else {
      console.log('✅ Brak duplikatów');
    }

    // Podsumowanie
    console.log('\n📈 PODSUMOWANIE:');
    console.log('=' .repeat(50));
    console.log(`Filmy w bazie danych: ${dbMovies.length}`);
    console.log(`Oczekiwane filmy (2 dekady): ${EXPECTED_MOVIES.length}`);
    console.log(`Brakujące filmy: ${missingMovies.length}`);
    console.log(`Nieoczekiwane filmy: ${unexpectedMovies.length}`);
    console.log(`Duplikaty: ${duplicates.length}`);

    if (missingMovies.length === 0 && unexpectedMovies.length === 0) {
      console.log('\n🎉 Wszystkie oczekiwane filmy są w bazie danych i nie ma żadnych nieoczekiwanych!');
      console.log('📊 Baza danych zawiera kompletne 2 dekady filmów oscarowych (2000-2019)');
    } else if (missingMovies.length === 0 && unexpectedMovies.length > 0) {
      console.log('\n✅ Wszystkie oczekiwane filmy są w bazie danych');
      console.log(`⚠️  Ale znaleziono ${unexpectedMovies.length} nieoczekiwanych filmów do usunięcia`);
    } else {
      console.log(`\n💡 Aby dodać brakujące filmy, uruchom migrację: 20250627160000_add_2010s_oscar_movies.sql`);
      if (unexpectedMovies.length > 0) {
        console.log(`💡 Aby usunąć nieoczekiwane filmy, usuń je ręcznie z panelu Supabase`);
      }
    }

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania:', error);
  }
}

// Uruchom sprawdzenie
checkMissingMovies();