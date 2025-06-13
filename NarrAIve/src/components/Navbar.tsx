import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-bold ">NarrAIve</h1>
      <div className="space-x-4">
        <a href="#" className="hover:text-gray-300">About</a>
        <a href="#" className="hover:text-gray-300">Contact</a>
      </div>
    </nav>
  );
};

export default Navbar;
