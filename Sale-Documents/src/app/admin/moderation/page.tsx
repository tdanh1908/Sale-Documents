'use client';

import { useState } from 'react';

const mockUsers = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a@gmail.com', violation: 'Nickname: badword123', status: 'flagged' },
  { id: 2, name: 'Trần Thị B', email: 'b@gmail.com', violation: 'Trường: THPT ***', status: 'pending' },
  { id: 3, name: 'Lê Văn C', email: 'c@gmail.com', violation: 'Nickname: d1t', status: 'flagged' },
];

export default function ModerationPage() {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = (checked: boolean) => {
    setSelected(checked ? mockUsers.map(u => u.id) : []);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Kiểm duyệt</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Danh sách người dùng có trạng thái Pending hoặc Flagged</p>
          </div>
          <div className="flex gap-2">
            <button 
              disabled={selected.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Duyệt hàng loạt ({selected.length})
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      onChange={(e) => selectAll(e.target.checked)} 
                      checked={selected.length === mockUsers.length && mockUsers.length > 0}
                    />
                  </th>
                  <th className="p-4">Họ tên & Email</th>
                  <th className="p-4">Nghi ngờ vi phạm</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selected.includes(user.id)} 
                        onChange={() => toggleSelect(user.id)} 
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-mono text-xs border border-gray-200 dark:border-gray-600">
                        {user.violation}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.status === 'flagged' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium text-xs border border-red-200 dark:border-red-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-medium text-xs border border-yellow-200 dark:border-yellow-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/50 px-3 py-1.5 rounded-md font-medium transition">
                          Duyệt
                        </button>
                        <button className="text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 px-3 py-1.5 rounded-md font-medium transition">
                          Che ****
                        </button>
                        <button className="text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-md font-medium transition">
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
