import "./style.css";
import OrderingSystem from "./components/orderingSystem.jsx";
import QueuingSystem from "./components/queuingSystem.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cashier" element={<OrderingSystem />} />
      <Route path="/kitchen" element={<QueuingSystem />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
