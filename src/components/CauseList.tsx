import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/context/userContext';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { CalendarDay } from 'react-day-picker';

type CaseType = {
  id: string;
  case_id: string;
  caseDetails: CaseDetails;
};

type CaseDetails = {
  diaryNumber: string;
  caseType: string;
  city: string;
  court: string;
  district: string;
  bench: string;
  courtComplex: string;
  courtType: string;
  caseNumber: string;
}

const CauseList: React.FC = () => {

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [causes, setCauses] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hearingDensity, setHearingDensity] = useState<Record<string, number>>({});
  const { userState } = useUserContext();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!userState.user) return;
    setCalendarLoading(true);
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

    fetch(`/api/causelist?userId=${userState.user.id}&month=${month}`)
      .then(res => res.json())
      .then(data => {
        const counts: Record<string, number> = {};
        data.counts.forEach((item: { case_date: string; case_count: number }) => {
          counts[item.case_date] = item.case_count;
        });
        setHearingDensity(counts);
      })
      .catch(() => setHearingDensity({}))
      .finally(() => setCalendarLoading(false));
  }, [userState, currentMonth]);

  // 🔹 Fetch causes when a specific date is selected
  useEffect(() => {
    if (!selectedDate || !userState.user) return;

    setLoading(true);
    setCauses([]); // reset previous causes

    fetch(`/api/causelist?userId=${userState.user.id}&date=${format(selectedDate, 'yyyy-MM-dd')}`)
      .then(res => res.json())
      .then(data => setCauses(data.causeList || []))
      .catch(() => setCauses([]))
      .finally(() => setLoading(false));
  }, [selectedDate, userState]);

  // 🔹 Handle day click
  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setShowModal(true);
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 p-3">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-5xl">
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-6 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-200 rounded-full"></span> 1–5 Hearings
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-200 rounded-full"></span> 5–15 Hearings
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-300 rounded-full"></span> 15+ Hearings
          </span>
        </div>
        {/* Calendar */}
        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDaySelect}
            onMonthChange={month => setCurrentMonth(month)}
            className="rounded-lg p-4"
            components={{
              Day: ({ day }: { day: CalendarDay | undefined | null }) => {
                if (calendarLoading) {
                  return (
                    <td className="border w-12 h-12 bg-gray-200 animate-pulse rounded-md"></td>
                  );
                }
                // day?.date is already a Date
                const dateObj = day?.date;
                if (!dateObj) return <td className="border w-12 h-12"></td>;

                // Format as string for density lookup
                const key = format(dateObj, 'yyyy-MM-dd'); // e.g., "2025-10-26"
                const count = hearingDensity[key] || 0;

                // Determine cell color
                let colorClass = '';
                if (count >= 15) colorClass = 'bg-red-300';
                else if (count >= 5) colorClass = 'bg-orange-200';
                else if (count > 0) colorClass = 'bg-green-200';

                return (
                  <td
                    onClick={() => handleDaySelect(dateObj)}
                    className={`border-4 w-12 h-12 text-center align-middle text-x font-bold cursor-pointer ${colorClass} 
                    ${day?.outside ? 'bg-gray-200 cursor-not-allowed text-gray-400' : `${colorClass} cursor-pointer hover:bg-blue-300`}`}
                  >
                    {dateObj.getDate()}
                  </td>
                );

              },
            }}
            modifiersClassNames={{
              selected: 'bg-blue-600 text-white rounded-full',
            }}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Cases on {format(selectedDate, 'EEE, dd MMM yyyy')}
            </h3>

            {loading ? (
              <div className="text-center py-6 text-gray-600">Loading...</div>
            ) : causes.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No cases found.</div>
            ) : (
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full border border-gray-200 rounded-md text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Diary Number</th>
                      <th className="border p-2">Case Number</th>
                      <th className="border p-2">Court</th>
                      <th className="border p-2">District</th>
                      <th className="border p-2">Court Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {causes.map((cause) => (
                      <tr key={cause.id} className="hover:bg-gray-50">
                        <td className="border p-2 text-center">{cause.caseDetails.diaryNumber}</td>
                        <td className="border p-2 text-center">{cause.caseDetails.caseNumber}</td>
                        <td className="border p-2 text-center">{cause.caseDetails.court}</td>
                        <td className="border p-2 text-center">{cause.caseDetails.district || "-"}</td>
                        <td className="border p-2 text-center">{cause.caseDetails.courtType || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CauseList;
