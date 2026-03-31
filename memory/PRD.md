# Airtel 8-Week PPO Tracker - PRD

## Original Problem Statement
Build an 8-Week PPO Execution Plan tracker for Airtel internship with:
- Email + default password authentication with limited access
- Backend to manually add email/password pairs
- Comments and due dates on tasks
- Airtel colors (professional red/white theme)
- All content editable including week titles and tasks
- Auto-save all changes

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Auth**: JWT with httpOnly cookies
- **Database**: MongoDB with collections: users, weeks

## User Personas
1. **Admin** - Can manage users (add/delete), access all tracker features
2. **Regular User** - Can view/edit tasks, add comments, track progress

## Core Requirements (Static)
- [x] Email/password authentication
- [x] 8-week task tracker with 5 default tasks per week
- [x] Editable week titles and task names
- [x] Task completion toggle with checkboxes
- [x] Progress bars (per week and overall)
- [x] Add/delete tasks
- [x] Due dates for tasks (calendar picker)
- [x] Comments on tasks
- [x] User management (admin only)
- [x] Auto-save functionality
- [x] Airtel branding (red #E40000 theme)

## What's Been Implemented
**Date: 2026-03-31**
- Complete authentication system with JWT
- Admin seeding on startup (admin@airtel.com / airtel123)
- 8-week data structure with pre-populated tasks
- Full CRUD for weeks, tasks, and comments
- User management page for admin
- Professional Airtel-branded UI with Outfit + IBM Plex Sans fonts
- Real-time progress tracking
- Responsive design

## API Endpoints
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user
- GET /api/users - List users (admin)
- POST /api/users - Create user (admin)
- DELETE /api/users/:id - Delete user (admin)
- GET /api/weeks - Get all weeks
- PUT /api/weeks/:id - Update week title
- POST /api/weeks/:id/tasks - Add task
- PUT /api/weeks/:id/tasks/:taskId - Update task
- DELETE /api/weeks/:id/tasks/:taskId - Delete task
- POST /api/weeks/:id/tasks/:taskId/comments - Add comment
- DELETE /api/weeks/:id/tasks/:taskId/comments/:commentId - Delete comment

## Prioritized Backlog
### P0 (Done)
- [x] Core authentication
- [x] Task tracking system
- [x] Comments & due dates
- [x] User management

### P1 (Future)
- [ ] Password change functionality
- [ ] Email notifications for due dates
- [ ] Export progress report as PDF

### P2 (Nice to Have)
- [ ] Drag & drop task reordering
- [ ] Task priority levels
- [ ] File attachments on tasks

## Next Tasks
1. Add password change feature for users
2. Add reminder notifications for upcoming due dates
3. Export functionality for progress reports
