import React from 'react';
import { Download, Receipt, CreditCard } from 'lucide-react';

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  pdfUrl?: string;
}

interface BillingHistoryProps {
  invoices: Invoice[];
  onDownload?: (invoice: Invoice) => void;
}

export function BillingHistory({ invoices, onDownload }: BillingHistoryProps) {
  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'pending':
        return 'text-amber-400 bg-amber-500/10';
      case 'failed':
        return 'text-red-400 bg-red-500/10';
      case 'refunded':
        return 'text-blue-400 bg-blue-500/10';
      default:
        return 'text-lb-text-muted bg-lb-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="w-12 h-12 text-lb-text-muted mx-auto mb-3" />
        <p className="text-lb-text-secondary">No billing history yet</p>
        <p className="text-sm text-lb-text-muted mt-1">
          Your invoices will appear here once you start your subscription
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-lb-border">
            <th className="text-left py-3 px-4 text-xs font-medium text-lb-text-secondary uppercase tracking-wide">
              Date
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-lb-text-secondary uppercase tracking-wide">
              Description
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-lb-text-secondary uppercase tracking-wide">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-lb-text-secondary uppercase tracking-wide">
              Amount
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-lb-text-secondary uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="border-b border-lb-border/50 hover:bg-lb-muted/50 transition-colors"
            >
              <td className="py-4 px-4 text-sm text-lb-text-primary">
                {formatDate(invoice.date)}
              </td>
              <td className="py-4 px-4 text-sm text-lb-text-primary">
                {invoice.description}
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-lb-text-primary text-right">
                {formatAmount(invoice.amount)}
              </td>
              <td className="py-4 px-4 text-right">
                {invoice.pdfUrl && (
                  <button
                    onClick={() => onDownload?.(invoice)}
                    className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BillingHistory;
