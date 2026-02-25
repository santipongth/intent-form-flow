

# Export Analytics Data as CSV/PDF

## Overview
Add export buttons to the Analytics page allowing users to download their analytics data as CSV or PDF reports, using pure client-side generation (no additional dependencies needed for CSV; use browser print-to-PDF for PDF).

## Changes

### 1. Add Export Utility Functions (`src/lib/exportAnalytics.ts`)
Create a new utility file with two functions:

- **`exportCSV(daily, agentPerf, summary)`**: Generates a CSV string with three sections:
  1. Summary section (Total Calls, Avg Response Time, Total Tokens, Success Rate)
  2. Daily breakdown table (Date, API Calls, Avg Response Time, Tokens Used)
  3. Agent Performance table (Agent, Total Calls, Avg Response, Error Rate, Success Rate)
  - Creates a Blob, generates a download link, and triggers the download with filename like `analytics-report-2026-02-25.csv`

- **`exportPDF()`**: Opens the browser's native print dialog (`window.print()`) with a print-optimized view. This avoids adding heavy PDF libraries.

### 2. Update Analytics Page (`src/pages/Analytics.tsx`)
- Import `Download`, `FileText` icons from lucide-react
- Import the export utility functions
- Add a `DropdownMenu` with two options next to the time range selector:
  - "Export CSV" -- calls `exportCSV()` with current `daily`, `agentPerf`, and summary stats
  - "Export PDF" -- calls `window.print()` to use browser's built-in PDF export
- The export button is disabled when data is empty or loading

### 3. Print Styles (`src/index.css`)
Add a `@media print` block to:
- Hide sidebar, header navigation, and export buttons during printing
- Ensure charts and tables render cleanly on paper
- Set white background for print

## Technical Details

### Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/lib/exportAnalytics.ts` | Create | CSV generation function with multi-section report |
| `src/pages/Analytics.tsx` | Modify | Add export dropdown button with CSV and PDF options |
| `src/index.css` | Modify | Add `@media print` styles for clean PDF output |

### CSV Format Example
```text
Analytics Report - Generated 2026-02-25
Period: Last 7 days

--- Summary ---
Total API Calls,1234
Avg Response Time,350ms
Total Tokens,45000
Success Rate,98.5%

--- Daily Breakdown ---
Date,API Calls,Avg Response Time (ms),Tokens Used
02-20,150,320,5400
02-21,180,290,6100
...

--- Agent Performance ---
Agent,Total Calls,Avg Response (ms),Error Rate (%),Success Rate (%)
My Bot,800,310,1.2,98.8
...
```

### Export Button Placement
Added as a dropdown button between the agent filter and the time range selector in the header area.

