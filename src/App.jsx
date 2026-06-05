import { BrowserRouter, Routes, Route } from "react-router-dom";
import ArtistPage from "./pages/ArtistPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ArtistPage />} />
      </Routes>
    </BrowserRouter>
  );
}
