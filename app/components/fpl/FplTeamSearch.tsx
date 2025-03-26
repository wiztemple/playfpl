'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { 
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Command,
} from '@/app/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useDebounce } from '@/app/hooks/useDebounce';

interface Team {
  id: number;
  name: string;
  player_name: string;
  total_points: number;
}

interface FplTeamSearchResultProps {
  onSelect: (team: Team) => void;
}

export function FplTeamSearchResult({ onSelect }: FplTeamSearchResultProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/fpl/search?query=${encodeURIComponent(debouncedSearchQuery)}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error searching for teams:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearchQuery]);

  const handleSelect = (team: Team) => {
    onSelect(team);
    setSearchQuery('');
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) {
      setOpen(true);
    }
  };

  const handleManualIdSubmit = () => {
    const id = parseInt(searchQuery);
    if (!isNaN(id) && id > 0) {
      // Directly fetch the team by ID
      fetchTeamById(id);
    }
  };

  const fetchTeamById = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fpl/team/${id}`);
      if (!response.ok) {
        throw new Error('Team not found');
      }
      const team = await response.json();
      onSelect(team);
      setSearchQuery('');
      setOpen(false);
    } catch (error) {
      console.error('Error fetching team by ID:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="Search your team name or enter ID"
                value={searchQuery}
                onChange={handleInputChange}
                className="w-full pr-8"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4}>
            <Command>
              <CommandList>
                {results.length === 0 && !loading ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {results.map((team) => (
                      <CommandItem
                        key={team.id}
                        onSelect={() => handleSelect(team)}
                        className="cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-gray-500">
                            {team.player_name} - ID: {team.id}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button 
          type="button" 
          onClick={handleManualIdSubmit}
          disabled={loading || !searchQuery}
          className="ml-2"
        >
          Go
        </Button>
      </div>
    </div>
  );
}