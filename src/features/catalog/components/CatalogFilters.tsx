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
      {/* Search input */}
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {searchTerm && (
            <span className="text-xs text-gray-400">
              {filteredCount} / {totalCount}
            </span>
          )}
        </div>
        <input
          type="text"
          aria-label="Rechercher une configuration"
          className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Catalog toggle */}
      <div className="flex items-center space-x-2">
        <Filter className="h-5 w-5 text-gray-400" />
        <label className="text-sm text-gray-600 flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCatalogOnly}
            onChange={(e) => onShowCatalogOnlyChange(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition"
          />
          Uniquement le catalogue
        </label>
      </div>

      {/* Tag filters */}
      <div className="lg:col-span-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Tags</h4>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  onTagsChange(
                    isSelected
                      ? selectedTags.filter((t) => t !== tag)
                      : [...selectedTags, tag]
                  )
                }
                aria-label={`Filtrer par tag ${tag}`}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Tag className="h-4 w-4 mr-1" />
                {tag}
                <span className="ml-1 text-xs opacity-60">
                  ({totalCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
