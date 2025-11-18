# Dashboard Components

This directory contains the main dashboard layout components for the FamilySync application.

## Components

### `DashboardLayout.tsx`

Main layout component that manages responsive behavior. Used as a wrapper for all dashboard pages.

**Features:**

- Responsive sidebar (hidden on mobile <900px, always visible on desktop)
- Mobile header with burger menu
- Automatic sidebar closing when switching to desktop view

### `Sidebar.tsx`

Navigation sidebar component with user profile section.

**Features:**

- Navigation menu (Dashboard, Groups, Events, Chat, Media, Tasks)
- User profile section with dropdown menu (Profile, Settings, Logout)
- Active route highlighting
- Responsive behavior (slides in from left on mobile)
- User avatar with initials

### `MobileHeader.tsx`

Header component visible only on mobile devices (<900px).

**Features:**

- Burger menu button to toggle sidebar
- FamilySync app title
- Clean, centered layout

## Usage

### Layout Usage

The `DashboardLayout` is automatically applied to all pages under `/dashboard` route via the `app/dashboard/layout.tsx` file.

### Responsive Breakpoints

- **Desktop**: ≥900px - Sidebar always visible, no mobile header
- **Mobile**: <900px - Sidebar hidden by default, mobile header visible

### Navigation

All navigation items in the sidebar automatically handle active state based on the current route.

## Styling

Components use Tailwind CSS with custom CSS variables defined in `globals.css`:

- Primary color: Blue-500
- Uses Inter font family
- Supports light/dark mode through CSS custom properties

## Future Enhancements

- Profile and Settings page implementations
- Enhanced user menu functionality
- Notification badges for navigation items
- Improved animations and micro-interactions
