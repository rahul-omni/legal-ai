import { CaseData } from "./types";
import { CaseCard } from "./CaseCard";

interface CaseListProps {
  cases: CaseData[];
  isLoadingMore?: boolean;
}

export function CaseList({
  cases,
  isLoadingMore = false
}: CaseListProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-2 px-6 mb-6">
        {cases.map((caseItem, index) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            index={index}
          />
        ))}
      </div>
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 bg-background-light rounded-full flex items-center justify-center">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      )}
    </>
  );
} 