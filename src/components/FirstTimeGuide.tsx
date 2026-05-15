"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function FirstTimeGuide() {
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("navTourCompleted");

    if (!hasSeenGuide) {
      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        animate: true,
        overlayColor: "rgba(0, 0, 0, 0.6)",
        stagePadding: 6,
        popoverClass: "custom-driver-popover",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Finish",
        onPopoverRender: (popover) => {
          // Use the built-in close button as an explicit "Skip"
          if (popover?.closeButton) {
            popover.closeButton.textContent = "Skip";
            popover.closeButton.classList.add("driver-skip-btn");
          }
        },
        onCloseClick: () => {
          localStorage.setItem("navTourCompleted", "true");
          driverObj.destroy();
        },
        onDestroyed: () => {
          // Mark as completed on finish as well.
          localStorage.setItem("navTourCompleted", "true");
        },
        steps: [
          {
            element: "#firststep",
            popover: {
              title: "👋 Welcome",
              description: "Welcome to the legal AI portal!",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#cases",
            popover: {
              title: "📑 Cases",
              description: "Access and manage all your legal cases here.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#calendar",
            popover: {
              title: "📅 Calendar",
              description: "Your central hub for managing legal calendars.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#projecthub",
            popover: {
              title: "📂 Project Hub",
              description: "Your central hub for managing legal projects.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#pendingreviews",
            popover: {
              title: "🕒 Pending Reviews",
              description: "See documents waiting for your review.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#clients",
            popover: {
              title: "👥 Clients",
              description: "Manage your client list and profiles.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#settings",
            popover: {
              title: "Settings",
              description: "Manage your profile and previews.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#notifications",
            popover: {
              title: "🔔 Notifications",
              description: "Stay up to date with alerts and updates.",
              side: "bottom",
              align: "start",
            },
          },
        ],
      });

      driverObj.drive();
    }
  }, []);

  return (
    <style jsx global>{`
      .custom-driver-popover {
        background: white;
        color: #333;
        border-radius: 10px;
        padding: 1rem;
        max-width: 280px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }
      .driver-popover-title {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 6px;
        color: #2b6cb0;
      }
      .driver-stage {
        border: 3px solid #3182ce !important;
        border-radius: 8px !important;
      }
      .driver-popover-footer button {
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
      }

      .driver-popover-footer button.driver-next-btn,
      .driver-popover-footer button.driver-done-btn {
        background-color: #3182ce;
        color: white;
      }
      .driver-popover-footer button.driver-next-btn:hover,
      .driver-popover-footer button.driver-done-btn:hover {
        background-color: #2b6cb0;
      }

      .driver-popover-footer button.driver-prev-btn,
      .driver-popover-footer button.driver-close-btn {
        background-color: #e2e8f0;
        color: #333;
      }
      .driver-popover-footer button.driver-prev-btn:hover,
      .driver-popover-footer button.driver-close-btn:hover {
        background-color: #cbd5e0;
      }

      .driver-popover-footer button.driver-close-btn.driver-skip-btn {
        background: linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(244, 63, 94, 0.12));
        color: #b91c1c;
      }
      .driver-popover-footer button.driver-close-btn.driver-skip-btn:hover {
        background: linear-gradient(90deg, rgba(239, 68, 68, 0.18), rgba(244, 63, 94, 0.18));
      }
    `}</style>
  );
}
