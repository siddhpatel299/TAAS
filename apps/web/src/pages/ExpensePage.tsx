import { useEffect } from 'react';
import { useExpenseStore } from '@/stores/expense.store';
import { ModernSidebar } from '@/components/layout/ModernSidebar';

export function ExpensePage() {
  const {
    categories,
    expenses,
    stats,
    isLoading,
    fetchCategories,
    fetchExpenses,
    fetchStats,
  } = useExpenseStore();

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      <main className="ml-20 p-8">
        <h1 className="text-2xl font-bold mb-6">Expense Tracker</h1>
        {isLoading && <div>Loading...</div>}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Stats</h2>
          <pre className="bg-gray-100 rounded-xl p-4 text-xs overflow-x-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Categories</h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <li key={cat.id} className="px-3 py-1 rounded-xl bg-white border border-gray-200 text-gray-700">
                {cat.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Expenses</h2>
          <table className="min-w-full bg-white rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Tags</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="px-4 py-2">{exp.date.slice(0, 10)}</td>
                  <td className="px-4 py-2">{exp.category?.name || '-'}</td>
                  <td className="px-4 py-2">{exp.amount} {exp.currency}</td>
                  <td className="px-4 py-2">{exp.description}</td>
                  <td className="px-4 py-2">{exp.tags?.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
