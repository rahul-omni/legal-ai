"use client";

import React from "react";

interface HeaderProps {
  headerTitle: string;
  subTitle?: string;
  truncate?: boolean;
}

const Header = ({ headerTitle, subTitle, truncate = false }: HeaderProps) => {

  return (
    <header className="gap-4">
        <h1 className={`text-2xl font-medium text-text-dark ${truncate ? "truncate max-w-xs" : ""}`}>
          {truncate && headerTitle.length > 20 ? `${headerTitle.substring(0, 20)}...` : headerTitle}
        </h1>
        {subTitle && <p className="text-sm mt-1 text-muted">{subTitle}</p>}
    </header>
  );
};

export default Header;
