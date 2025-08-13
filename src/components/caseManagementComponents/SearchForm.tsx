import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { HIGH_COURT_CASE_TYPES, HIGH_COURT_CITY, SUPREME_COURT_CASE_TYPES } from "@/lib/constants";
import { SearchParams, ValidationErrors } from "./types";

interface SearchFormProps {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  isLoading: boolean;
  onSearch: () => void;
  errors?: ValidationErrors;
}

export function SearchForm({ searchParams, setSearchParams, isLoading, onSearch, errors }: SearchFormProps) {
  const loadingMessages = useMemo(
    () => [
      "Validating inputs...",
      "Contacting court services...",
      "Fetching case records...",
      "Parsing judgments...",
      "Almost there...",
    ],
    []
  );
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setMessageIndex(0);
      return;
    }
    const intervalId = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [isLoading, loadingMessages.length]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Form Header */}
      <div className="text-center pb-2">
        <h4 className="text-xl font-semibold text-text mb-2">Search Legal Cases</h4>
        <p className="text-sm text-text-light">
          Enter case details to search for available judgments
        </p>
      </div>

      {/* General Error */}
      {errors?.general && (
        <div className="bg-error-light border border-error rounded-md p-3">
          <p className="text-sm text-error">{errors.general}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Court Selection */}
        <div>
          <label className="block text-sm font-medium text-text-light mb-2">
            Court Type <span className="text-error">*</span>
          </label>
          <select
            value={searchParams.court}
            onChange={(e) =>
              setSearchParams({ ...searchParams, court: e.target.value, caseType: "", year: "", city: "", judgmentType: "", number: "" })
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
              errors?.court ? 'border-error' : 'border-border'
            }`}
          >
            <option value="">Select court type</option>
            <option value="Supreme Court">Supreme Court</option>
            <option value="High Court">High Court</option>
            {/* <option value="District Court">District Court</option> */}
          </select>
          {errors?.court && (
            <p className="mt-1 text-sm text-error">{errors.court}</p>
          )}
        </div>

        {searchParams.court === 'High Court' && (
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              City <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.city}
              onChange={(e) =>
                setSearchParams({ ...searchParams, city: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.city ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">All City</option>
              {HIGH_COURT_CITY.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors?.city && (
            <p className="mt-1 text-sm text-error">{errors.city}</p>
          )}
        </div>
        )}

        {/* Case Type Selection */}
        {searchParams.court === "High Court" && (
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Case Type <span className="text-error">*</span>
            </label>
            <select
              value={searchParams.caseType}
              onChange={(e) =>
                setSearchParams({ ...searchParams, caseType: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background-light ${
                errors?.caseType ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">All Case Types</option>
              {searchParams.court === 'High Court' ? HIGH_COURT_CASE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              )) : SUPREME_COURT_CASE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors?.caseType && (
              <p className="mt-1 text-sm text-error">{errors.caseType}</p>
            )}
          </div>
        )}

        {/* Case Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Diary Number <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={searchParams.number}
              onChange={(e) =>
                setSearchParams({ ...searchParams, number: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                errors?.number ? 'border-error' : 'border-border'
              }`}
              placeholder="e.g. 72381"
            />
            {errors?.number && (
              <p className="mt-1 text-sm text-error">{errors.number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-light mb-2">
              Year <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={searchParams.year}
              onChange={(e) =>
                setSearchParams({ ...searchParams, year: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                errors?.year ? 'border-error' : 'border-border'
              }`}
              placeholder="e.g. 1989"
            />
            {errors?.year && (
              <p className="mt-1 text-sm text-error">{errors.year}</p>
            )}
          </div>
        </div>

        {/* High Court City Options */}
        {searchParams.court === 'High Court' && (
          <div>
            <label htmlFor="judgmentType" className="block text-sm font-medium text-text mb-1">
              Judgement Type
            </label>
            <select
              id="judgmentType"
              name="judgmentType"
              value={searchParams.judgmentType}
              onChange={(e) =>
                setSearchParams({ ...searchParams, judgmentType: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="">All Types</option>
              <option value="JUDGEMENT">Judgement</option>
              <option value="ORDER">Order</option>
            </select>
          </div>
        )}

        {/* Search Button */}
        <div className="pt-4">
          <button
            onClick={onSearch}
            className="w-full px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingMessages[messageIndex]}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search Cases
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 