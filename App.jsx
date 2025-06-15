import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-blue-400">
        <Navbar />
        <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
        <footer className="text-center py-4 text-white/70">
          &copy; {new Date().getFullYear()} Hello Jobs. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;