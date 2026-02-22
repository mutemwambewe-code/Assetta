
'use client';

import type { Tenant, InvoiceItem } from '@/lib/types';
import { format } from 'date-fns';

interface InvoicePreviewProps {
    tenant?: Tenant;
    items: Partial<InvoiceItem>[];
    totalAmount: number;
    dueDate?: Date;
    notes?: string;
}

export function InvoicePreview({ tenant, items, totalAmount, dueDate, notes }: InvoicePreviewProps) {

    const tenantName = tenant?.name || 'Tenant Name';
    const tenantEmail = tenant?.email || 'tenant@email.com';
    const propertyName = tenant?.property || 'Property Name';
    const issueDate = new Date();
    const effectiveDueDate = dueDate || new Date();

    return (
        <div className="bg-white rounded-lg shadow-lg border max-w-2xl mx-auto text-gray-800">
            <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
                        <p className="text-gray-500">From: Assetta Property Management</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">Issue Date:</p>
                        <p>{format(issueDate, 'PPP')}</p>
                        <p className="font-bold mt-2">Due Date:</p>
                        <p>{format(effectiveDueDate, 'PPP')}</p>
                    </div>
                </div>

                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <p className="font-bold">Invoice To:</p>
                    <p>{tenantName}</p>
                    <p>{tenantEmail}</p>
                    <p>Property: {propertyName}</p>
                </div>

                <table className="w-full mb-8">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left p-3">Description</th>
                            <th className="text-right p-3">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">{item.description || '...'}</td>
                                <td className="text-right p-3">ZMW {item.amount?.toLocaleString() || '0.00'}</td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr className="border-b">
                                <td className="p-3 text-gray-500 italic">No items added yet...</td>
                                <td className="text-right p-3"></td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="text-right mb-8">
                    <p className="text-gray-600">Subtotal: ZMW {totalAmount.toLocaleString()}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">Total Due: ZMW {totalAmount.toLocaleString()}</p>
                </div>

                {notes && (
                    <div>
                        <p className="font-bold">Notes:</p>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
