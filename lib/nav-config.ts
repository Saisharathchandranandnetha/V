import {
    LayoutDashboard,
    Library,
    BookOpen,
    Route,
    BarChart3,
    Settings,
    CalendarCheck,
    CheckSquare,
    Target,
    DollarSign,
    StickyNote,
    Folder,
    Users,
    MessageSquare,
    Layout,
    Map as MapIcon
} from 'lucide-react'

// Navigation items for the sidebar
export const sidebarNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Teams',
        href: '#',
        icon: Users,
        children: [
            {
                title: 'Teams Dashboard',
                href: '/dashboard/teams',
                icon: Layout,
            },
            {
                title: 'Teams Chat',
                href: '/dashboard/chat',
                icon: MessageSquare,
            }
        ]
    },
    {
        title: 'Habits',
        href: '/dashboard/habits',
        icon: CalendarCheck,
    },
    {
        title: 'Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
    },
    {
        title: 'Goals',
        href: '/dashboard/goals',
        icon: Target,
    },
    {
        title: 'Finances',
        href: '/dashboard/finances',
        icon: DollarSign,
    },
    {
        title: 'Resources',
        href: '/dashboard/resources',
        icon: Library,
    },
    {
        title: 'Categories',
        href: '/dashboard/categories',
        icon: BookOpen,
    },
    {
        title: 'Collections',
        href: '/dashboard/collections',
        icon: Folder,
    },
    {
        title: 'Learning Paths',
        href: '/dashboard/paths',
        icon: Route,
    },
    {
        title: 'Roadmaps',
        href: '/dashboard/roadmaps',
        icon: MapIcon,
    },
    {
        title: 'Notes',
        href: '/dashboard/notes',
        icon: StickyNote,
    },
    {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
]
