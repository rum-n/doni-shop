import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrderDetail(id: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          artwork: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <>
        <AdminNavbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Order Not Found</h1>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            Back to Orders
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Order Details</h1>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            Back to Orders
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Order Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Order Number:</span> {order.orderNumber}</p>
                <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
                <p><span className="font-medium">Total Amount:</span> ${order.total.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Customer Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.customer.name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {order.customer.email}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-3">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artwork
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.artwork.images && item.artwork.images[0] && (
                          <div className="flex-shrink-0 h-16 w-16 relative">
                            <Image
                              src={typeof item.artwork.images[0] === 'object' && 'url' in item.artwork.images[0]
                                ? (item.artwork.images[0] as { url: string }).url
                                : ''}
                              alt={item.artwork.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.artwork.title}</div>
                      <div className="text-sm text-gray-500">
                        {item.artwork.medium}, {item.artwork.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}