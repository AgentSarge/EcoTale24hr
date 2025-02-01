import { useState } from 'react';
import { Button } from '../ui/Button';

interface DateRangeFilterProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null) => void;
}

type DateRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export const DateRangeFilter = ({ onFilterChange }: DateRangeFilterProps) => {
  const [activeRange, setActiveRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const handleRangeClick = (range: DateRange) => {
    setActiveRange(range);
    
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = now;

    switch (range) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case 'custom':
        return; // Don't trigger filter change for custom until dates are selected
    }

    onFilterChange(startDate, endDate);
  };

  const handleCustomDateChange = () => {
    if (customStart && customEnd) {
      onFilterChange(new Date(customStart), new Date(customEnd));
    }
  };

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
      <div className="flex space-x-2">
        <Button
          variant={activeRange === '7d' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleRangeClick('7d')}
        >
          7 Days
        </Button>
        <Button
          variant={activeRange === '30d' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleRangeClick('30d')}
        >
          30 Days
        </Button>
        <Button
          variant={activeRange === '90d' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleRangeClick('90d')}
        >
          90 Days
        </Button>
        <Button
          variant={activeRange === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleRangeClick('all')}
        >
          All Time
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant={activeRange === 'custom' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handleRangeClick('custom')}
        >
          Custom
        </Button>
        {activeRange === 'custom' && (
          <>
            <input
              type="date"
              className="input-primary"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              className="input-primary"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCustomDateChange}
              disabled={!customStart || !customEnd}
            >
              Apply
            </Button>
          </>
        )}
      </div>
    </div>
  );
}; 