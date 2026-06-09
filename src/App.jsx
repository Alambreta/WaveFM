import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ArtistPage from "./pages/ArtistPage";
import HomePage from "./pages/HomePage";
import GenrePage from "./pages/GenrePage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/artist" element={<ArtistPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/genre/:tag" element={<GenrePage />} />
      </Routes>
    </BrowserRouter>
  );
}
