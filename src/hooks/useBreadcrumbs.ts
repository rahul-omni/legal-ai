import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { fetchNodes } from '@/app/apiServices/nodeServices';

// Route configuration for breadcrumbs
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  '/': { label: 'Dashboard' },
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
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const fetchName = async (id: string): Promise<string | undefined> => {
      try {
        const response = await fetchNodes('', id);
        return response?.[0]?.name;
      } catch {
        return undefined;
      }
    };

    const buildBreadcrumbs = async () => {
      if (customItems && customItems.length) {
        if (!isCancelled) setBreadcrumbs(customItems);
        return;
      }

      const pathSegments = pathname.split('/').filter(Boolean);
      const items: BreadcrumbItem[] = [];

      let currentPath = '';
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const previousSegment = pathSegments[i - 1];
        currentPath += `/${segment}`;
        
        // Check if this is a dynamic route (UUID pattern)
        const isDynamicRoute = /^[a-f0-9-]{36}$/.test(segment);
        
        if (isDynamicRoute) {
          // Handle different types of dynamic routes based on context
          if (pathSegments[0] === 'projects' && previousSegment === 'edit') {
            // File ID within a project edit route
            const fileName = entityNames?.[segment] || 'Editor';
            items.push({ label: fileName, href: currentPath });
          } else if (pathSegments[0] === 'projects' && previousSegment === 'projects') {
            // Project ID
            const projectName = entityNames?.[segment] || (await fetchName(segment)) || 'Project Details';
            items.push({ label: projectName, href: currentPath });
          } else {
            // Generic dynamic route
            const entityName = entityNames?.[segment] || segment;
            items.push({ label: entityName, href: currentPath });
          }
        } else if (segment === 'edit' && previousSegment && pathSegments[0] === 'projects') {
          // Edit segment within projects
          // items.push({ label: 'Edit', href: currentPath });
        } else if (segment === 'root' && previousSegment && pathSegments[0] === 'projects') {
          // Optional: label for root
          // items.push({ label: 'Root', href: currentPath });
        } else {
          // Handle static routes
          const config = routeConfig[currentPath];
          if (config) {
            items.push({ label: config.label, href: currentPath, icon: config.icon });
          } else {
            // Fallback for unknown routes
            items.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1), href: currentPath });
          }
        }
      }

      if (!isCancelled) setBreadcrumbs(items);
    };

    buildBreadcrumbs();

    return () => {
      isCancelled = true;
    };
  }, [pathname, customItems, entityNames]);

  return breadcrumbs;
}; 