import React from 'react';
import { Search, Filter, Tag } from 'lucide-react';

interface CatalogFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showCatalogOnly: boolean;
  onShowCatalogOnlyChange: (value: boolean) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
  filteredCount: number;
  totalCount: number;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  searchTerm,
  onSearchChange,
  showCatalogOnly,
  onShowCatalogOnlyChange,
  selectedTags,
  onTagsChange,
  allTags,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {searchTerm && (
            <span className="text-xs text-gray-400">
              {filteredCount} résultat{filteredCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <label className="text-sm text-gray-600">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-indigo-600 mr-2 focus:ring-indigo-500 transition-colors duration-200"
              checked={showCatalogOnly}
              onChange={(e) => onShowCatalogOnlyChange(e.target.checked)}
            />
            Afficher uniquement le catalogue
          </label>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                onTagsChange(
                  selectedTags.includes(tag)
                    ? selectedTags.filter(t => t !== tag)
                    : [...selectedTags, tag]
                );
              }}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors duration-200`}
            >
              <Tag className="h-4 w-4 mr-1" />
              {tag}
              <span className="ml-1 text-xs opacity-60">
                ({totalCount})
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}