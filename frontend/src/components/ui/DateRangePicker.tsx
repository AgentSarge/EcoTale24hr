import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from './Button';
import { Calendar } from './Calendar';

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
  placeholder?: string;
}

export const DateRangePicker = ({
  value,
  onChange,
  placeholder = 'Select date range',
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [startDate, endDate] = value;

  const handleSelect = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      onChange([date, null]);
    } else {
      if (date < startDate) {
        onChange([date, startDate]);
      } else {
        onChange([startDate, date]);
      }
    }
  };

  const displayValue = startDate && endDate
    ? `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`
    : startDate
    ? `${format(startDate, 'MMM d, yyyy')} - Select end date`
    : placeholder;

  const handleClear = () => {
    onChange([null, null]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto justify-start"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {displayValue}
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Select Date Range
            </h3>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
          <Calendar
            mode="range"
            selected={startDate && endDate ? { from: startDate, to: endDate } : undefined}
            onSelect={(range) => {
              if (range?.from) handleSelect(range.from);
              if (range?.to) handleSelect(range.to);
            }}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}; 