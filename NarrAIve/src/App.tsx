import React from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import './index.css'; // adjust path as needed

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Home />
    </>
  );
};

export default App;
