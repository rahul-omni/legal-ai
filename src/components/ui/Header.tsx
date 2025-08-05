"use client";

import React from "react";

interface HeaderProps {
  headerTitle: string;
  subTitle?: string;
}

const Header = ({ headerTitle, subTitle }: HeaderProps) => {

  return (
    <header className="gap-2">
        <h1 className="text-2xl font-semibold text-text-dark">{headerTitle}</h1>
        {subTitle && <p className="text-sm text-muted">{subTitle}</p>}
    </header>
  );
};

export default Header;
