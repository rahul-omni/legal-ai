import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import React from 'react';
import { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { FileText, Folder, Gavel, Users, Settings } from 'lucide-react';

// Utility function to fetch entity names (can be extended)
const fetchEntityName = async (type: 'project' | 'file', id: string): Promise<string> => {
  try {
    // This would typically make an API call to get the actual name
    // For now, return a placeholder that could be replaced with real API calls
    
    if (type === 'project') {
      // Example: const response = await fetch(`/api/projects/${id}`);
      // const project = await response.json();
      // return project.name;
      return `Project Hub`; // Placeholder
    } else if (type === 'file') {
      // Example: const response = await fetch(`/api/files/${id}`);
      // const file = await response.json();
      // return file.name;
      return `File Details`; // Placeholder
    }
    
    return 'Details';
  } catch (error) {
    console.error('Error fetching entity name:', error);
    return 'Details';
  }
};

// Route configuration for breadcrumbs
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  '/dashboard': { label: 'Dashboard' },
  '/projects': { label: 'Projects' },
  '/cases': { label: 'Case Management' },
  '/editor': { label: 'Legal Editor' },
  '/team': { label: 'Team Management' },
  '/settings': { label: 'Settings' },
};

export const useBreadcrumbs = (
  customItems?: BreadcrumbItem[],
  entityNames?: Record<string, string> // Optional: pass actual names for dynamic routes
): BreadcrumbItem[] => {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const previousSegment = pathSegments[i - 1];
      const nextSegment = pathSegments[i + 1];
      currentPath += `/${segment}`;
      
      // Check if this is a dynamic route (UUID pattern)
      const isDynamicRoute = /^[a-f0-9-]{36}$/.test(segment);
      
      if (isDynamicRoute) {
        // Handle different types of dynamic routes based on context
        if (previousSegment === 'projects') {
          // This is a project ID
          const projectName = entityNames?.[segment] || 'Project Hub';
          items.push({
            label: projectName,
            href: currentPath,
          });
        } else if (previousSegment === 'edit' && pathSegments[i - 2] && /^[a-f0-9-]{36}$/.test(pathSegments[i - 2])) {
          // This is a file ID within a project edit
          const fileName = entityNames?.[segment] || segment;
          items.push({
            label: fileName,
            href: currentPath,
          });
        } else {
          // Generic dynamic route
          const entityName = entityNames?.[segment] || segment;
          items.push({
            label: entityName,
            href: currentPath,
          });
        }
      } else if (segment === 'edit' && previousSegment && /^[a-f0-9-]{36}$/.test(previousSegment)) {
        // This is an edit route within a project
        items.push({
          label: 'Edit',
          href: currentPath,
        });
      } else {
        // Handle static routes
        const config = routeConfig[currentPath];
        if (config) {
          items.push({
            label: config.label,
            href: currentPath,
            icon: config.icon,
          });
        } else {
          // Fallback for unknown routes
          items.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            href: currentPath,
          });
        }
      }
    }

    return items;
  }, [pathname, customItems]);

  return breadcrumbs;
}; 