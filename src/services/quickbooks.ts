// QuickBooks API Integration
// https://developer.intuit.com/app/developer/qbo/docs/api/accounting
// For importing actual rental income and expenses

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  realmId?: string;
  accessToken?: string;
  refreshToken?: string;
  sandbox?: boolean;
}

export interface QuickBooksAccount {
  Id: string;
  Name: string;
  AccountType: string;
  CurrentBalance: number;
}

export interface QuickBooksTransaction {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  PrivateNote?: string;
  Line?: Array<{
    Description?: string;
    Amount: number;
    DetailType: string;
  }>;
}

export interface QuickBooksIncomeReport {
  Header: {
    StartPeriod: string;
    EndPeriod: string;
    ReportName: string;
  };
  Columns: {
    Column: Array<{
      ColType: string;
      ColTitle: string;
    }>;
  };
  Rows: {
    Row: Array<{
      group?: string;
      Header?: { ColData: Array<{ value: string }> };
      Summary?: { ColData: Array<{ value: string }> };
    }>;
  };
}

const QUICKBOOKS_API_BASE = 'https://quickbooks.api.intuit.com/v3';
const QUICKBOOKS_SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com/v3';

export class QuickBooksService {
  private config: QuickBooksConfig;
  private isConfigured: boolean;

  constructor(config?: Partial<QuickBooksConfig>) {
    this.config = {
      clientId: config?.clientId || import.meta.env.VITE_QUICKBOOKS_CLIENT_ID || '',
      clientSecret: config?.clientSecret || import.meta.env.VITE_QUICKBOOKS_CLIENT_SECRET || '',
      realmId: config?.realmId || import.meta.env.VITE_QUICKBOOKS_REALM_ID,
      accessToken: config?.accessToken,
      refreshToken: config?.refreshToken,
      sandbox: config?.sandbox || import.meta.env.VITE_QUICKBOOKS_SANDBOX === 'true',
    };
    this.isConfigured = !!(this.config.clientId && this.config.clientSecret);
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string; connected: boolean } {
    if (!this.config.clientId) {
      return { 
        configured: false, 
        message: 'QuickBooks Client ID not configured. Add VITE_QUICKBOOKS_CLIENT_ID to your .env file.',
        connected: false,
      };
    }
    if (!this.config.clientSecret) {
      return { 
        configured: false, 
        message: 'QuickBooks Client Secret not configured. Add VITE_QUICKBOOKS_CLIENT_SECRET to your .env file.',
        connected: false,
      };
    }
    if (!this.config.accessToken) {
      return { 
        configured: true, 
        message: 'QuickBooks configured but not authenticated. Connect your account.',
        connected: false,
      };
    }
    return { 
      configured: true, 
      message: 'QuickBooks connected',
      connected: true,
    };
  }

  getAuthUrl(redirectUri: string): string {
    const environment = this.config.sandbox ? 'sandbox.' : '';
    const baseUrl = `https://appcenter.intuit.com/connect/oauth2`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      state: 'quickbooks_auth',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    realmId?: string;
  }> {
    const url = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    
    const authString = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code');
    }

    const data = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    
    return data;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: unknown): Promise<unknown> {
    if (!this.config.accessToken) {
      throw new Error('Not authenticated with QuickBooks');
    }

    const baseUrl = this.config.sandbox ? QUICKBOOKS_SANDBOX_BASE : QUICKBOOKS_API_BASE;
    const url = `${baseUrl}/company/${this.config.realmId}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please reconnect QuickBooks.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  }

  async getAccounts(): Promise<QuickBooksAccount[]> {
    const response = await this.makeRequest('/query?query=select * from Account') as { QueryResponse: { Account: QuickBooksAccount[] } };
    return response.QueryResponse?.Account || [];
  }

  async getIncomeAccounts(): Promise<QuickBooksAccount[]> {
    const accounts = await this.getAccounts();
    return accounts.filter(
      a => a.AccountType === 'Income' && 
           (a.Name.toLowerCase().includes('rent') || 
            a.Name.toLowerCase().includes('rental'))
    );
  }

  async getExpenseAccounts(): Promise<QuickBooksAccount[]> {
    const accounts = await this.getAccounts();
    return accounts.filter(
      a => a.AccountType === 'Expense' || 
           a.AccountType === 'Cost of Goods Sold'
    );
  }

  async getTransactions(startDate: string, endDate: string): Promise<QuickBooksTransaction[]> {
    const query = encodeURIComponent(`select * from Purchase where TxnDate >= '${startDate}' and TxnDate <= '${endDate}'`);
    const response = await this.makeRequest(`/query?query=${query}`) as { QueryResponse: { Purchase: QuickBooksTransaction[] } };
    return response.QueryResponse?.Purchase || [];
  }

  async getIncomeReport(year: number, month: number): Promise<{
    totalIncome: number;
    byAccount: Record<string, number>;
  }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const report = await this.makeRequest(
      `/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`
    ) as QuickBooksIncomeReport;

    // Parse income from report
    let totalIncome = 0;
    const byAccount: Record<string, number> = {};

    if (report.Rows?.Row) {
      const incomeRows = report.Rows.Row.find(r => r.Header?.ColData?.[0]?.value === 'Income');
      if (incomeRows?.Summary?.ColData?.[1]?.value) {
        totalIncome = parseFloat(incomeRows.Summary.ColData[1].value) || 0;
      }
    }

    return { totalIncome, byAccount };
  }

  async getExpenseReport(year: number, month: number): Promise<{
    totalExpenses: number;
    byCategory: Record<string, number>;
  }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const report = await this.makeRequest(
      `/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`
    ) as QuickBooksIncomeReport;

    let totalExpenses = 0;
    const byCategory: Record<string, number> = {
      maintenance: 0,
      utilities: 0,
      insurance: 0,
      propertyTax: 0,
      managementFees: 0,
      legal: 0,
      other: 0,
    };

    if (report.Rows?.Row) {
      const expenseRows = report.Rows.Row.find(r => r.Header?.ColData?.[0]?.value === 'Expenses');
      if (expenseRows?.Summary?.ColData?.[1]?.value) {
        totalExpenses = parseFloat(expenseRows.Summary.ColData[1].value) || 0;
      }
    }

    return { totalExpenses, byCategory };
  }

  disconnect(): void {
    this.config.accessToken = undefined;
    this.config.refreshToken = undefined;
    this.config.realmId = undefined;
  }
}

// Singleton instance
export const quickBooksService = new QuickBooksService();
