Here's the fixed version with all missing closing brackets added and proper whitespace:

[Previous content remains the same until the progress details modal section]

```javascript
                {/* Progress Bar */}
                <div className="w-full bg-neutral-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#DFBD69] to-[#E8C573] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${selectedProgress.progressPercentage}%` }}
                  ></div>
                </div>

                {/* AI Recommendation */}
                {selectedProgress.remainingMovies.length > 0 && (
                  <div 
                    className="p-6 rounded-lg border border-neutral-700 mb-8"
                    style={{
                      background: 'linear-gradient(135deg, rgba(223, 189, 105, 0.12) 0%, rgba(223, 189, 105, 0.25) 100%)',
                    }}
                  >
                    <h3 className="text-[#DFBD69] font-bold text-lg mb-4 flex items-center gap-2">
                      🤖 Rekomendacja AI
                    </h3>
                    {isLoadingRecommendation ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
                        <span className="text-neutral-300">Analizuję pozostałe filmy...</span>
                      </div>
                    ) : (
                      <p className="text-neutral-200 leading-relaxed">
                        {progressRecommendation || 'Nie udało się wygenerować rekomendacji.'}
                      </p>
                    )}
                  </div>
                )}

                {/* Movies Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Content remains the same */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
```

The main fixes included:
1. Properly closing the progress details modal section
2. Adding missing closing brackets for the main component
3. Properly organizing the nested structure of divs and components
4. Removing duplicate/misplaced code fragments
5. Adding proper export statement at the end