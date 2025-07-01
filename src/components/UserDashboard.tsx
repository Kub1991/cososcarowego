Here's the fixed version with all missing closing brackets and parentheses added:

```typescript
                      </p>
                    )}
                  </button>
                ))}

                  onClick={() => {
                    setListViewMode('create');
                    setSelectedList(null);
                  }}
                  className="p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
                >
                  <Plus className="w-8 h-8 text-[#DFBD69] mb-3" />
                  <h3 className="text-white font-semibold mb-2">Nowa lista</h3>
                  <p className="text-neutral-400 text-sm">
                    Stwórz nową listę filmów
                  </p>
                </button>
              </>
            )}

            {listViewMode === 'create' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setListViewMode('overview')}
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">Nowa lista filmów</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Nazwa listy
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                      placeholder="np. Ulubione dramaty"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Opis (opcjonalnie)
                    </label>
                    <textarea
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                      rows={3}
                      placeholder="Dodaj krótki opis swojej listy..."
                    />
                  </div>

                  <button
                    onClick={createNewList}
                    disabled={!newListName.trim() || isCreatingList}
                    className="w-full px-4 py-2 bg-[#DFBD69] text-black font-semibold rounded-lg hover:bg-[#E8C573] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingList ? 'Tworzenie...' : 'Utwórz listę'}
                  </button>
                </div>
              </div>
            )}
```