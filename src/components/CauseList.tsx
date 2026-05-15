import React, { useEffect, useState } from "react";
import { useUserContext } from "@/context/userContext";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DayPicker, UI } from "react-day-picker";
import type { DayButtonProps, DayProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { addMonths, format, isWeekend } from "date-fns";

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
  courtType: string;
  caseNumber: string;
};

/**
 * Returns a display label if `d` is a court holiday (no cause list expected).
 * Order: specific single days, then ranges (2026-centric Good Friday; update yearly).
 */
function getCourtHolidayLabel(d: Date): string | null {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();

  if (m === 1 && day === 26) return "Republic Day";
  if (y === 2026 && m === 4 && day === 3) return "Good Friday";
  if (m === 8 && day === 15) return "Independence Day";
  if (m === 10 && day === 2) return "Mahatma Gandhi's Birthday";

  if (m === 1 && day >= 1 && day <= 2) return "New Year Holiday";
  if (m === 3 && day >= 2 && day <= 7) return "Holi Break";
  if (m === 6 || (m === 7 && day <= 12)) return "Summer Vacation / Partial Working";
  if (m === 10 && day >= 19 && day <= 24) return "Dussehra Holidays";
  if (m === 11 && day >= 9 && day <= 14) return "Diwali Holidays";
  if (m === 12 && day >= 21) return "Christmas & New Year Holiday";

  return null;
}

const CauseList: React.FC = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [causes, setCauses] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [hearingDensity, setHearingDensity] = useState<Record<string, number>>({});
  const { userState } = useUserContext();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const selectedHolidayLabel = selectedDate ? getCourtHolidayLabel(selectedDate) : null;

  useEffect(() => {
    if (!userState.user) return;
    setCalendarLoading(true);
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

    fetch(`/api/causelist?userId=${userState.user.id}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        const counts: Record<string, number> = {};
        data.counts?.forEach((item: { case_date: string; case_count: number }) => {
          counts[item.case_date] = item.case_count;
        });
        setHearingDensity(counts);
      })
      .catch(() => setHearingDensity({}))
      .finally(() => setCalendarLoading(false));
  }, [userState, currentMonth]);

  useEffect(() => {
    if (!selectedDate || !userState.user) return;

    if (getCourtHolidayLabel(selectedDate)) {
      setCauses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setCauses([]);

    fetch(`/api/causelist?userId=${userState.user.id}&date=${format(selectedDate, "yyyy-MM-dd")}`)
      .then((res) => res.json())
      .then((data) => setCauses(data.causeList || []))
      .catch(() => setCauses([]))
      .finally(() => setLoading(false));
  }, [selectedDate, userState]);

  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-stretch justify-center bg-gray-50 p-3 sm:p-4">
      <div className="flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-xl lg:flex-row lg:items-stretch lg:gap-8 lg:p-8">
        {/* Left: fixed width on desktop so the right panel does not resize the calendar */}
        <div className="flex w-full shrink-0 flex-col lg:w-[400px] lg:max-w-[400px]">
          <h2 className="mb-1 text-lg font-semibold text-gray-800 sm:text-xl">Cause list calendar</h2>
          <p className="mb-4 text-sm text-gray-600">Select a date — details appear on the right.</p>

          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-full bg-blue-600" aria-hidden />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-600" aria-hidden />
              Cause list day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-full bg-red-600" aria-hidden />
              Sat / Sun
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-full bg-amber-600" aria-hidden />
              Holiday
            </span>
            
          </div>

          <div
            className={`relative flex justify-center rounded-xl border border-gray-200/90 bg-white p-4 shadow-sm ${calendarLoading ? "pointer-events-none opacity-60" : ""}`}
          >
            {calendarLoading ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/85 text-sm text-gray-500 backdrop-blur-[1px]"
                aria-live="polite"
              >
                Loading calendar…
              </div>
            ) : null}
            <div className="w-full">
              <div className="mb-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Previous month"
                >
                  <span className="text-4xl leading-none" aria-hidden>
                    ‹
                  </span>
                </button>
                <div className="min-w-[140px] text-center text-[0.95rem] font-semibold leading-none tracking-tight text-gray-900">
                  {format(currentMonth, "MMMM yyyy")}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Next month"
                >
                  <span className="text-4xl leading-none" aria-hidden>
                    ›
                  </span>
                </button>
              </div>

              <DayPicker
                mode="single"
                weekStartsOn={1}
                showOutsideDays
                hideNavigation
                month={currentMonth}
                selected={selectedDate ?? undefined}
                onSelect={handleDaySelect}
                onMonthChange={(month) => setCurrentMonth(month)}
                classNames={{
                  [UI.Root]:
                    "rdp-root mx-auto w-max max-w-full [--rdp-accent-color:rgb(37,99,235)] [--rdp-outside-opacity:1] [--rdp-today-color:rgb(17,24,39)] [--rdp-day-width:2.5rem] [--rdp-day-height:2.5rem] [--rdp-day_button-width:2.5rem] [--rdp-day_button-height:2.5rem]",
                  [UI.Months]: "rdp-months flex w-full justify-center",
                  [UI.Month]: "rdp-month relative mx-auto w-max",
                  [UI.MonthCaption]: "hidden",
                  [UI.Weekdays]: "rdp-weekdays",
                  [UI.Weekday]:
                    "rdp-weekday w-10 pb-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400",
                  [UI.Week]: "",
                  [UI.MonthGrid]: "rdp-month_grid mx-auto border-collapse",
                  [UI.Day]: "p-0",
                  [UI.DayButton]: "",
                  outside: "!opacity-100",
                  selected: "!text-[0.875rem] !font-medium",
                  today: "text-gray-900",
                }}
                className="w-full"
                components={{
                Day: ({ day: _d, modifiers: _m, className, style, children, ...tdProps }: DayProps) => (
                  <td
                    {...tdProps}
                    className={`border-0 bg-transparent p-0 align-middle ${className ?? ""}`.trim()}
                    style={style}
                  >
                    {children}
                  </td>
                ),
                DayButton: ({ day, modifiers, className, ...btn }: DayButtonProps) => {
                  const dateObj = day.date;
                  const key = format(dateObj, "yyyy-MM-dd");
                  const count = hearingDensity[key] || 0;
                  const weekend = isWeekend(dateObj);
                  const hol = getCourtHolidayLabel(dateObj) !== null;
                  const selected = Boolean(modifiers.selected);
                  const outside = day.outside;

                  let labelColor = "text-gray-900";
                  if (outside) {
                    labelColor = "text-gray-400";
                  } else if (weekend) {
                    labelColor = "text-red-600";
                  } else if (hol) {
                    labelColor = "text-amber-600 font-bold";
                  } else if (count > 0) {
                    labelColor = "text-emerald-600 font-bold";
                  }

                  const base =
                    "mx-auto flex size-10 items-center justify-center rounded-full text-[0.875rem] font-medium transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-[0.96]";
                  const clickableHint = count > 0 ? "cursor-pointer hover:shadow-sm" : "";

                  if (selected) {
                    return (
                      <button
                        {...btn}
                        type="button"
                        className={
                          `${className ?? ""} ${base} ${clickableHint} border-0 bg-blue-600 text-white shadow-sm hover:bg-blue-700`.trim()
                        }
                        title={count > 0 ? `${count} case${count === 1 ? "" : "s"} on this date` : undefined}
                      />
                    );
                  }

                  return (
                    <button
                      {...btn}
                      type="button"
                      className={
                        `${className ?? ""} ${base} ${clickableHint} border-2 border-transparent bg-transparent ${labelColor} hover:bg-gray-100/90`.trim()
                      }
                      title={count > 0 ? `${count} case${count === 1 ? "" : "s"} on this date` : undefined}
                    />
                  );
                },
              }}
              />
            </div>
          </div>
        </div>

        {/* Right: fills remaining width; min-w-0 keeps wide table scroll inside without shifting the left column */}
        <div className="flex min-h-[320px] min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-gray-50/80 p-5 lg:min-h-0">
          {!selectedDate ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
              <p className="text-base font-medium text-gray-700">Select a date</p>
              <p className="max-w-sm text-sm text-gray-600">
                Click a day on the calendar to see court holidays or your subscribed cause list.
              </p>
            </div>
          ) : selectedHolidayLabel ? (
            <div className="flex flex-1 flex-col">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-200 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Court holiday</p>
                  <p className="mt-1 text-sm text-gray-600">{format(selectedDate, "EEEE, d MMMM yyyy")}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm text-gray-500 underline-offset-4 hover:text-gray-800 hover:underline"
                  onClick={() => setSelectedDate(null)}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-1 flex-col justify-center rounded-lg border border-orange-200/80 bg-orange-50/50 px-6 py-10 text-center">
                <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">{selectedHolidayLabel}</h3>
                <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
                  No cause list is published on this day. Choose another date for hearings.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-200 pb-3">
                <h3 className="text-lg font-semibold text-gray-800">Cases on {format(selectedDate, "EEE, dd MMM yyyy")}</h3>
                <button
                  type="button"
                  className="shrink-0 text-sm text-gray-500 underline-offset-4 hover:text-gray-800 hover:underline"
                  onClick={() => setSelectedDate(null)}
                >
                  Clear
                </button>
              </div>

              {loading ? (
                <div className="flex flex-1 items-center justify-center py-12 text-gray-600">Loading…</div>
              ) : causes.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-white py-12 text-center">
                  <p className="font-medium text-gray-700">No cases on this date</p>
                  <p className="max-w-xs text-sm text-gray-500">Nothing matched your subscriptions for this hearing day.</p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full min-w-[700px] border-collapse text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="border-b border-gray-200 p-2 text-left font-semibold text-gray-700">Diary Number</th>
                        <th className="border-b border-gray-200 p-2 text-left font-semibold text-gray-700">Case Number</th>
                        <th className="border-b border-gray-200 p-2 text-left font-semibold text-gray-700">Court</th>
                        <th className="border-b border-gray-200 p-2 text-left font-semibold text-gray-700">District</th>
                        <th className="border-b border-gray-200 p-2 text-left font-semibold text-gray-700">Court Type</th>
                        <th className="border-b border-gray-200 p-2 text-right font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {causes.map((cause) => (
                        <tr
                          key={cause.id}
                          role="button"
                          tabIndex={0}
                          className="group cursor-pointer border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/80 active:bg-blue-100/70 focus-visible:bg-blue-50 focus-visible:outline-none"
                          onClick={() => router.push(`/case-details/${cause.case_id}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              router.push(`/case-details/${cause.case_id}`);
                            }
                          }}
                        >
                          <td className="p-2 font-medium text-gray-900 transition-colors group-hover:text-blue-700">
                            {cause.caseDetails.diaryNumber}
                          </td>
                          <td className="p-2 text-gray-800 transition-colors group-hover:text-blue-700">
                            {cause.caseDetails.caseNumber}
                          </td>
                          <td className="p-2 text-gray-800 transition-colors group-hover:text-blue-700">
                            {cause.caseDetails.court}
                          </td>
                          <td className="p-2 text-gray-800 transition-colors group-hover:text-blue-700">
                            {cause.caseDetails.district || "—"}
                          </td>
                          <td className="p-2 text-gray-800 transition-colors group-hover:text-blue-700">
                            {cause.caseDetails.courtType || "—"}
                          </td>
                          <td className="p-2 text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 opacity-80 transition-all group-hover:bg-blue-100 group-hover:opacity-100">
                              Open
                              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CauseList;
