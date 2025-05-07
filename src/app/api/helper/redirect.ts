import { NextResponse } from "next/server";

export const redirectToURL = (url: string) => {
  const absoluteURL = new URL(url, process.env.NEXT_PUBLIC_APP_URL);
  return NextResponse.redirect(absoluteURL);
};
