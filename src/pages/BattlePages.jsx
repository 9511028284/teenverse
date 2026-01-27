import React from 'react';

const BattlePage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Battle Arena ⚔️</h1>
        <p className="text-gray-600">Compete with other freelancers and level up your skills.</p>
      </div>

      {/* Active Battles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Battle Card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">Live Now</span>
            <span className="text-gray-400 text-sm">24 Participants</span>
          </div>
          <h3 className="text-xl font-bold mb-2">UI/UX Design Sprint</h3>
          <p className="text-gray-500 text-sm mb-4">Redesign a landing page for a fintech startup in 45 minutes.</p>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Enter Battle
          </button>
        </div>

        {/* Battle Card 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-medium">Starts in 2h</span>
            <span className="text-gray-400 text-sm">112 Registered</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Frontend Bug Bash</h3>
          <p className="text-gray-500 text-sm mb-4">Fix as many React bugs as possible within the time limit.</p>
          <button className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            Register
          </button>
        </div>

      </div>
    </div>
  );
};

export default BattlePage;