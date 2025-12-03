import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Convert path segments to readable names
  const getPageName = (segment) => {
    // Remove "Page" suffix if it exists and convert to Title Case
    return segment
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  if (pathSegments.length === 0 || pathSegments[0] === 'Dashboard') {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link 
        to={createPageUrl("Dashboard")}
        className="flex items-center hover:text-orange-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const pageName = getPageName(segment);
        const path = '/' + pathSegments.slice(0, index + 1).join('/');

        return (
          <React.Fragment key={path}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {isLast ? (
              <span className="font-medium text-gray-900">{pageName}</span>
            ) : (
              <Link 
                to={path}
                className="hover:text-orange-600 transition-colors"
              >
                {pageName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}