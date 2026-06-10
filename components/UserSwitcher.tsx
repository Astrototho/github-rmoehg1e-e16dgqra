'use client';

import { MOCK_USERS } from '@/lib/constants';
import { useState, useEffect } from 'react';

export default function UserSwitcher() {
  const [currentUserId, setCurrentUserId] = useState<string>(MOCK_USERS[0].id);

  useEffect(() => {
    const saved = localStorage.getItem('currentUserId');
    if (saved) {
      setCurrentUserId(saved);
    }
  }, []);

  const handleChange = (userId: string) => {
    // 1. Save to localStorage
    localStorage.setItem('currentUserId', userId);
    
    // 2. Save to cookies for server-side (via fetch)
    fetch('/api/set-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).then(() => {
      // 3. Reload page
      window.location.reload();
    });
  };

  return (
    <select
      value={currentUserId}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-gray-100 border-none text-xs rounded-lg px-2 py-1 text-gray-700 font-medium outline-none cursor-pointer"
    >
      {MOCK_USERS.map((user) => (
        <option key={user.id} value={user.id}>
          👤 {user.name}
        </option>
      ))}
    </select>
  );
}
