import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Manage Artworks</h2>
          <p className="text-gray-600 mb-4">Add, edit, or remove artworks from your portfolio.</p>
          <a
            href="/admin/artworks"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Manage Artworks
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          <p className="text-gray-600 mb-4">View and manage customer orders.</p>
          <a
            href="/admin/orders"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View Orders
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
          <p className="text-gray-600 mb-4">Update homepage hero image and other site settings.</p>
          <a
            href="/admin/settings"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Site Settings
          </a>
        </div>
      </div>
    </div>
  );
}