import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { GripVertical } from 'lucide-react';

interface Suite {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export function LoungeLayout() {
  const [suites, setSuites] = useState<Suite[]>([
    {
      id: 'vip-a1',
      name: 'VIP Suite A1',
      position: { x: 50, y: 50 },
      size: { width: 150, height: 120 },
    },
    {
      id: 'vip-a2',
      name: 'VIP Suite A2',
      position: { x: 220, y: 50 },
      size: { width: 150, height: 120 },
    },
    {
      id: 'vip-b1',
      name: 'VIP Suite B1',
      position: { x: 50, y: 190 },
      size: { width: 150, height: 120 },
    },
    {
      id: 'vip-b2',
      name: 'VIP Suite B2',
      position: { x: 220, y: 190 },
      size: { width: 150, height: 120 },
    },
    {
      id: 'exec-1',
      name: 'Executive Suite 1',
      position: { x: 390, y: 50 },
      size: { width: 120, height: 100 },
    },
    {
      id: 'exec-2',
      name: 'Executive Suite 2',
      position: { x: 390, y: 170 },
      size: { width: 120, height: 100 },
    },
    {
      id: 'business-1',
      name: 'Business Suite 1',
      position: { x: 530, y: 50 },
      size: { width: 120, height: 100 },
    },
    {
      id: 'business-2',
      name: 'Business Suite 2',
      position: { x: 530, y: 170 },
      size: { width: 120, height: 100 },
    },
    {
      id: 'family-1',
      name: 'Family Suite',
      position: { x: 50, y: 330 },
      size: { width: 200, height: 150 },
    },
    {
      id: 'business-3',
      name: 'Business Suite 3',
      position: { x: 270, y: 330 },
      size: { width: 120, height: 100 },
    },
    {
      id: 'business-4',
      name: 'Business Suite 4',
      position: { x: 410, y: 330 },
      size: { width: 120, height: 100 },
    },
    {
      id: 'business-5',
      name: 'Business Suite 5',
      position: { x: 550, y: 330 },
      size: { width: 120, height: 100 },
    },
  ]);

  const [draggedSuite, setDraggedSuite] = useState<Suite | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.DragEvent, suite: Suite) => {
    setDraggedSuite(suite);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedSuite) return;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - draggedSuite.size.width));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - draggedSuite.size.height));

    setSuites((prevSuites) =>
      prevSuites.map((suite) =>
        suite.id === draggedSuite.id
          ? { ...suite, position: { x: newX, y: newY } }
          : suite
      )
    );

    setDraggedSuite(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Manage Lounge Layout Plan</h1>
        <p className="text-gray-600">Configure and manage suite positions on the floor plan</p>
      </div>

      {/* Interactive Floor Plan */}
      <Card className="p-6">
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative bg-gray-50 rounded-lg" 
          style={{ height: '600px' }}
        >
          {/* Layout Title */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-lg text-gray-700 pointer-events-none">
            HKIA VIP Lounge - Floor Plan
          </div>

          {/* Entrance */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-100 text-blue-700 rounded border-2 border-blue-300 pointer-events-none">
            Entrance ↓
          </div>

          {/* Draggable Suites */}
          {suites.map((suite) => (
            <div
              key={suite.id}
              draggable
              onDragStart={(e) => handleDragStart(e, suite)}
              className={`absolute border-2 border-gray-300 bg-white rounded-lg flex flex-col items-center justify-center p-2 cursor-move hover:shadow-lg hover:border-blue-400 transition-all ${
                draggedSuite?.id === suite.id ? 'opacity-50' : 'opacity-100'
              }`}
              style={{
                left: `${suite.position.x}px`,
                top: `${suite.position.y}px`,
                width: `${suite.size.width}px`,
                height: `${suite.size.height}px`,
              }}
            >
              <GripVertical className="w-4 h-4 text-gray-400 mb-1" />
              <div className="text-sm font-medium text-gray-700">{suite.name}</div>
            </div>
          ))}

          {/* Common Areas */}
          <div className="absolute right-8 top-50 px-3 py-2 bg-blue-50 border-2 border-blue-200 rounded text-sm text-blue-700 pointer-events-none">
            Reception
          </div>
          <div className="absolute right-8 top-120 px-3 py-2 bg-purple-50 border-2 border-purple-200 rounded text-sm text-purple-700 pointer-events-none">
            Dining Area
          </div>
          <div className="absolute left-8 bottom-100 px-3 py-2 bg-indigo-50 border-2 border-indigo-200 rounded text-sm text-indigo-700 pointer-events-none">
            Restrooms
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="bg-blue-600 hover:bg-blue-700">
          Save Layout
        </Button>
        <Button variant="outline">
          Reset to Default
        </Button>
      </div>
    </div>
  );
}