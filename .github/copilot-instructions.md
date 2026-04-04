# Copilot Instructions for AMS Frontend

## Project Overview
This is the frontend for an Academic Management System (AMS) built with Next.js 16 (App Router). It serves teachers and students.
**CRITICAL:** This is a **pure frontend** application. It connects to a separate backend API.

## Self-Maintenance
**IMPORTANT:** When making major architectural changes, new feature implementations, or significant updates to the project structure, **automatically update this instruction file** to reflect those changes. Keep this document as the single source of truth for the project.

### When to Update This File
Update `.github/copilot-instructions.md` immediately after:
- **Adding new routes or pages** (e.g., new dashboard sections, user flows)
- **Creating new component directories** or major UI components
- **Implementing new features** (e.g., notifications system, assignment management)
- **Adding new libraries or dependencies** that change coding patterns
- **Modifying authentication flow** or user role definitions
- **Changing API integration patterns** or backend communication
- **Adding new environment variables** or configuration requirements
- **Restructuring folder organization** or file naming conventions

### How to Update
1. Locate the relevant section in this file (Project Structure, Tech Stack, etc.)
2. Add the new information with clear, actionable descriptions
3. Use the same format and style as existing entries
4. Include file paths, component names, and usage examples
5. Update the "Project Structure" section if adding new files/folders
6. Do NOT ask permission - just update the file as part of completing the task

## Architecture & Boundaries
- **Frontend Only:** DO NOT create API routes (`app/api/...`) inside Next.js.
- **Backend Integration:**
  - **API Documentation:** **ALWAYS reference the complete API documentation at https://mulearnucek.github.io/ams-backend/ when implementing features or making API calls.**
  - Use the external API for all data operations.
  - If a required API endpoint is missing from documentation, **STOP** and ask the user for the request/response format. Do not mock or workaround without approval.
  - **API Response Format:** The backend returns responses in the format:
    ```typescript
    {
      status_code: number,
      message: string,
      data: { ...otherFields }
    }
    ```
  - **API Best Practices:**
    - **DELETE operations:** Do NOT include `Content-Type` header when no request body is being sent. Only include headers when sending data in the request body.
    - **Credentials:** Always include `credentials: 'include'` for session-based authentication.
    - **Error Handling:** Always wrap API calls in try-catch and provide meaningful error messages.
- **Authentication:**
  - Implemented via `better-auth` client and custom `AuthContext`.
  - Reference: `lib/auth-client.ts` and `lib/auth-context.tsx`.
  - **Always use `useAuth()` hook** from `lib/auth-context.tsx` to access user data, session, and auth state.
  - For auth operations (signin, signout), use `authClient` from `lib/auth-client.ts`.
  - User type includes: `_id`, `email`, `name`, `image`, `role`, `first_name`, `last_name`, `phone`, `gender`, `adm_number`, `adm_year`, `candidate_code`, `department`, etc.

## Tech Stack & Conventions
- **Framework:** Next.js 16 (App Router), React 19.
- **Language:** TypeScript.
- **Styling:**
  - **Tailwind CSS v4:** Use `@theme` and CSS variables in `app/globals.css`.
  - **Shadcn UI:** Use for all UI components.
    - Location: `components/ui/`.
    - Add components via CLI or strictly following Shadcn patterns.
  - **Icons:** `lucide-react`.
  - **Animations:** `framer-motion` for advanced animations.
- **State/Forms:** `react-hook-form` with `zod` validation.
- **Date Utilities:** `date-fns` for date formatting and manipulation.
- **Theming:** `next-themes` for dark/light mode support.
- **CSV Utilities:** `papaparse` for parsing uploads + generating templates.

## Coding Standards
1.  **Styling:**
    - Use `app/globals.css` for all color/theme variables (OKLCH format).
    - Use `cn()` helper from `@/lib/utils` for conditional class merging.
    - Example: `className={cn("bg-background text-foreground", className)}`.
    - Always ensure components support both light and dark modes using theme-aware Tailwind classes.
2.  **Components:**
    - Place reusable UI components in `components/ui`.
    - Place feature-specific components in `components/<feature>` (e.g., `components/student`, `components/dashboard`).
    - Ensure all components are responsive (mobile-first).
    - Use proper mobile breakpoints: `md:` for desktop, default for mobile.
3.  **Imports:**
    - Use path aliases defined in `tsconfig.json` / `components.json`:
      - `@/components` -> `components/`
      - `@/lib` -> `lib/`
      - `@/ui` -> `components/ui/`

## Project Structure
- **Routes:**
  - `/` - Landing page
  - `/signin` - Authentication page with split-screen design
  - `/onboarding` - User registration completion form (shown when user has incomplete profile - 422 response)
  - `/dashboard` - Main dashboard with role-based routing
  - `/dashboard/(student)` - Student-specific dashboard route group
  - `/dashboard/(admin)` - Admin-specific dashboard route group
  - `/dashboard/(admin)/users` - User management page with CRUD operations
  - `/dashboard/(teacher)` - Teacher-specific dashboard route group
  - `/dashboard/(teacher)/attendance` - Attendance management page (list today's classes)
  - `/dashboard/(teacher)/attendance/session/[id]` - Single session attendance marking page
  - `/dashboard/profile` - User profile page
  - `/dashboard/notifications` - Notifications page
  - `/dashboard/assignments` - Assignments page
- **Components:**
  - `components/ui/` - Shadcn UI components (button, card, form, input, label, alert, badge, avatar, tabs, table, select, progress, dropdown-menu, charts, dialog, pagination, skeleton, alert-dialog, separator, textarea)
  - `components/student/` - Student-specific components
    - `greeting-header.tsx` - Time-based greeting with dynamic backgrounds
    - `attendance-overview.tsx` - Subject-wise attendance display
    - `marks-overview.tsx` - Academic performance with grades
    - `recent-absences.tsx` - Recent absence records
    - `upcoming-classes.tsx` - Next scheduled classes
    - `summary-card.tsx` - Reusable summary card component
    - `notifications-list.tsx` - Teacher announcements
  - `components/teacher/` - Teacher specific components
    - `class-attendance-overview.tsx` - Class-wise attendance statistics
    - `teacher-notifications.tsx` - Teacher notification list
    - `my-classes.tsx` - Quick-start grid showing unique class templates (batch+subject combinations)
    - `quick-start-dialog.tsx` - Dialog for starting new attendance sessions with time and duration selection
  - `components/appshell/` - Layout and navigation components
    - `appshell.tsx` - Main layout wrapper
    - `Dock.tsx` - Animated bottom navigation dock
    - `navbar.tsx` - Top navigation bar
    - `profile.tsx` - Profile dropdown component
    - `theme_toggle.tsx` - Dark/light mode toggle
  - `components/logo.tsx` - Application logo component
- **Library:**
  - `lib/auth-client.ts` - better-auth client configuration
  - `lib/auth-context.tsx` - React context for auth state (use `useAuth()` hook)
  - `lib/utils.ts` - Utility functions (cn() helper)
  - `lib/dummy-data.ts` - Mock data for development
  - `lib/api/user.ts` - User API service functions (listUsers, getUserById, createUser, updateUserById, deleteUserById)
  - `lib/api/batch.ts` - Batch API service functions (listBatches, getBatchById, createBatch, updateBatchById, deleteBatchById)
  - `lib/api/subject.ts` - Subject API service functions (listSubjects, getSubjectById, createSubject, updateSubjectById, deleteSubjectById)
  - `lib/api/attendance-session.ts` - Attendance Session API service functions (listAttendanceSessions, getAttendanceSessionById, createAttendanceSession, updateAttendanceSessionById, deleteAttendanceSessionById, getRecentUniqueSessions)
  - `lib/api/attendance-record.ts` - Attendance Record API service functions (listAttendanceRecords, getAttendanceRecordById, createAttendanceRecord, createBulkAttendanceRecords, updateAttendanceRecordById, deleteAttendanceRecordById)

## Dashboard Features by Role

### Student Dashboard (`/dashboard/(student)`)
1. **Greeting Header:** Time-based greeting with dynamic backgrounds (Good Morning, Good Noon, Good Afternoon, Good Evening, Good Night, Good Late Night)
2. **Attendance Overview:** Subject-wise attendance with color-coded warnings (red <75%, yellow 75-85%, green >85%)
3. **Marks Overview:** Academic performance display with grades (A+, A, B+, B, C, F)
4. **Recent Absences:** List of recent missed classes
5. **Upcoming Classes:** Next scheduled classes with time and location
6. **Notifications List:** Teacher announcements with type indicators

### Admin Dashboard (`/dashboard/(admin)`)
- Admin-specific views and controls

#### Users Management (`/dashboard/(admin)/users`)
- **Features:**
  - Role-based user listing with tabs (Students, Teachers, Parents, Admins, HODs, Principals, Staff)
  - Server-side pagination using `/user/list` API endpoint
  - Real-time search across name, email, first name, and last name
  - Add new users with role-specific fields (student, teacher, parent, staff, etc.)
  - Student users require `batch` assignment during creation/onboarding
  - Bulk CSV import for creating multiple users at once (single-role per upload)
  - Downloadable CSV templates per role
  - View user details with complete profile information
  - Edit user information with role-specific fields
  - Delete users with confirmation dialog
  - Data table with responsive design
- **Components:**
  - `page.tsx` - Main users list page with data table and pagination
  - `add-user-dialog.tsx` - Modal for creating new users with role-based form sections
  - `components/bulk-upload-dialog.tsx` - CSV upload dialog (template download, validation, loading, results)
  - `user-dialog.tsx` - Combined modal for viewing and editing user information
  - `delete-user-dialog.tsx` - Confirmation dialog for user deletion
- **API Integration:** Uses `lib/api/user.ts` service functions with `/user/list` (GET) and `/user/bulk` (POST) for create + bulk import (enforce same role per bulk request)

#### Academics Management (`/dashboard/(admin)/academics`)
- **Features:**
  - Batch management (create, view, update, delete batches)
  - Batch supports optional human-readable `id` (e.g., `24CSE`); backend auto-generates if omitted
  - Subject management (create, view, update, delete subjects)
  - Pagination and filtering support
  - Responsive data tables
- **Components:**
  - `page.tsx` - Main academics page with tabs for batches and subjects
  - `batch-management.tsx` - Batch list and management
  - `subject-management.tsx` - Subject list and management
  - `add-batch-dialog.tsx` - Modal for creating new batches
  - `batch-dialog.tsx` - View/edit batch information
  - `delete-batch-dialog.tsx` - Confirmation dialog for batch deletion
  - `add-subject-dialog.tsx` - Modal for creating new subjects
  - `subject-dialog.tsx` - View/edit subject information
  - `delete-subject-dialog.tsx` - Confirmation dialog for subject deletion
- **API Integration:** Uses `lib/api/batch.ts` and `lib/api/subject.ts` service functions

### Teacher Dashboard (`/dashboard/(teacher)`)
- Teacher-specific views for class management and attendance

#### Teacher Home (`/dashboard/(teacher)`)
- **Features:**
  - My Classes grid showing unique batch+subject combinations (from `/attendance/session/recent`)
  - Click any class to open quick-start dialog for creating new session
  - Quick-start dialog features:
    - Duration selection (1hr, 2hrs, 3hrs) as toggle buttons
    - Start time selection (hour picker, auto-selected to current hour)
    - Minutes and seconds set to 00 (classes start at hour boundaries)
    - Session type selection (Regular, Extra, Practical)
    - Preview of start/end times
    - Automatically navigates to session page after creation
  - Class cards show last session date and total session count
  - Responsive grid layout (1-3 columns based on screen size)

#### Attendance Management (`/dashboard/(teacher)/attendance`)
- **Features:**
  - View all recent attendance sessions
  - Filter sessions by unique class (batch+subject combination)
  - Create new class/attendance session
  - Sessions table with batch, subject, time, duration, and actions
  - Click on a session to mark attendance
  - Mobile-first responsive design
  - Real-time loading states with skeletons
- **Components:**
  - `page.tsx` - Main attendance page with filtering
  - `create-class-dialog.tsx` - Modal for creating new attendance sessions
  - `session/[id]/page.tsx` - Single session view for marking attendance (coming soon: student list and marking features)
- **API Integration:** 
  - Uses `getRecentUniqueSessions()` from `/attendance/session/recent` to get unique batch+subject combinations
  - Uses `lib/api/attendance-session.ts` with `/attendance/session` endpoints for CRUD operations
  - Filter functionality allows viewing sessions by specific class

All components are responsive with mobile-first design and support dark/light modes.

## Navigation
- **Desktop:** Animated dock at bottom with magnification effects (`components/appshell/Dock.tsx`)
- **Mobile:** Fixed bottom navigation bar with icons and labels
- **Dock Items:** Home, Profile (with user avatar), Notifications, Assignments, Settings
- **Top Navbar:** Logo, theme toggle, profile dropdown (logout option)

## Critical Workflows
- **Dev Server:** `npm run dev` (runs on port 3232)
- **Linting:** `npm run lint`
- **Adding UI Components:** Prefer using existing Shadcn components in `components/ui`. If a new one is needed, ensure it matches the project's `new-york` style and `neutral` base color.

## "What to do if..."
- **API is missing:** "I cannot implement this feature because the backend API endpoint is not documented. Please provide the API endpoint path, method, request body, and response format."
- **Auth is needed:** Use `import { useAuth } from "@/lib/auth-context"` for user data and session. Use `import { authClient } from "@/lib/auth-client"` for auth operations.
