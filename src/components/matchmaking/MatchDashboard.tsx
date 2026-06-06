import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const MatchDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Matchmaking Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Matchmaking dashboard - Coming Soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchDashboard;
