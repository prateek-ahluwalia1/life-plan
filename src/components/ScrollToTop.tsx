import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // This tells the browser to go to the top left of the window
    window.scrollTo(0, 0);
  }, [pathname]); // This runs every time the URL path changes

  return null;
}