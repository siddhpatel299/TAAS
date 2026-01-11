import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const investmentService = {
  // Dashboard
  async getDashboard(userId: string) {
    const [
      investments,
      totalInvestments,
      watchlistCount,
      recentTransactions,
      recentDividends,
    ] = await Promise.all([
      prisma.investment.findMany({
        where: { userId, isWatchlist: false },
      }),
      prisma.investment.count({ where: { userId, isWatchlist: false } }),
      prisma.investment.count({ where: { userId, isWatchlist: true } }),
      prisma.investmentTransaction.findMany({
        where: { investment: { userId } },
        orderBy: { date: 'desc' },
        take: 5,
        include: { investment: { select: { symbol: true, name: true } } },
      }),
      prisma.investmentDividend.findMany({
        where: { investment: { userId } },
        orderBy: { date: 'desc' },
        take: 5,
        include: { investment: { select: { symbol: true, name: true } } },
      }),
    ]);

    // Calculate portfolio metrics
    let totalValue = 0;
    let totalCost = 0;
    const typeAllocation: Record<string, number> = {};
    const sectorAllocation: Record<string, number> = {};

    investments.forEach((inv: any) => {
      const quantity = Number(inv.quantity);
      const avgCost = Number(inv.avgCostBasis);
      const currentPrice = Number(inv.currentPrice) || avgCost;
      
      const value = quantity * currentPrice;
      const cost = quantity * avgCost;
      
      totalValue += value;
      totalCost += cost;

      // Type allocation
      typeAllocation[inv.type] = (typeAllocation[inv.type] || 0) + value;

      // Sector allocation
      if (inv.sector) {
        sectorAllocation[inv.sector] = (sectorAllocation[inv.sector] || 0) + value;
      }
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalInvestments,
      watchlistCount,
      totalValue: Math.round(totalValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalGainLoss: Math.round(totalGainLoss * 100) / 100,
      totalGainLossPercent: Math.round(totalGainLossPercent * 100) / 100,
      typeAllocation,
      sectorAllocation,
      recentTransactions,
      recentDividends,
    };
  },

  // Investments
  async getInvestments(userId: string, params?: {
    type?: string;
    sector?: string;
    isWatchlist?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const where: Prisma.InvestmentWhereInput = { userId };
    
    if (params?.type) where.type = params.type;
    if (params?.sector) where.sector = params.sector;
    if (params?.isWatchlist !== undefined) where.isWatchlist = params.isWatchlist;
    if (params?.search) {
      where.OR = [
        { symbol: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.InvestmentOrderByWithRelationInput = {};
    const sortBy = params?.sortBy || 'symbol';
    const sortOrder = params?.sortOrder || 'asc';
    (orderBy as any)[sortBy] = sortOrder;

    const investments = await prisma.investment.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { transactions: true, dividends: true } },
      },
    });

    // Calculate current values and gains
    return investments.map((inv: any) => {
      const quantity = Number(inv.quantity);
      const avgCost = Number(inv.avgCostBasis);
      const currentPrice = Number(inv.currentPrice) || avgCost;
      
      const currentValue = quantity * currentPrice;
      const totalCost = quantity * avgCost;
      const gainLoss = currentValue - totalCost;
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      return {
        ...inv,
        currentValue: Math.round(currentValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        gainLoss: Math.round(gainLoss * 100) / 100,
        gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      };
    });
  },

  async getInvestment(userId: string, investmentId: string) {
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId },
      include: {
        transactions: { orderBy: { date: 'desc' } },
        dividends: { orderBy: { date: 'desc' } },
      },
    });

    if (!investment) return null;

    const quantity = Number(investment.quantity);
    const avgCost = Number(investment.avgCostBasis);
    const currentPrice = Number(investment.currentPrice) || avgCost;
    
    const currentValue = quantity * currentPrice;
    const totalCost = quantity * avgCost;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    // Calculate total dividends
    const totalDividends = investment.dividends.reduce(
      (sum: number, d: any) => sum + Number(d.amount),
      0
    );

    return {
      ...investment,
      currentValue: Math.round(currentValue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      gainLoss: Math.round(gainLoss * 100) / 100,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      totalDividends: Math.round(totalDividends * 100) / 100,
    };
  },

  async createInvestment(userId: string, data: {
    symbol: string;
    name: string;
    type: string;
    quantity?: number;
    avgCostBasis?: number;
    currentPrice?: number;
    currency?: string;
    exchange?: string;
    sector?: string;
    notes?: string;
    isWatchlist?: boolean;
  }) {
    return prisma.investment.create({
      data: {
        userId,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        type: data.type,
        quantity: data.quantity || 0,
        avgCostBasis: data.avgCostBasis || 0,
        currentPrice: data.currentPrice,
        currency: data.currency || 'USD',
        exchange: data.exchange,
        sector: data.sector,
        notes: data.notes,
        isWatchlist: data.isWatchlist || false,
      },
    });
  },

  async updateInvestment(userId: string, investmentId: string, data: Partial<{
    symbol: string;
    name: string;
    type: string;
    quantity: number;
    avgCostBasis: number;
    currentPrice: number;
    currency: string;
    exchange: string;
    sector: string;
    notes: string;
    isWatchlist: boolean;
  }>) {
    if (data.symbol) data.symbol = data.symbol.toUpperCase();
    
    return prisma.investment.updateMany({
      where: { id: investmentId, userId },
      data,
    });
  },

  async deleteInvestment(userId: string, investmentId: string) {
    return prisma.investment.deleteMany({
      where: { id: investmentId, userId },
    });
  },

  // Transactions
  async addTransaction(userId: string, investmentId: string, data: {
    type: string;
    quantity: number;
    pricePerUnit: number;
    fees?: number;
    date?: Date;
    notes?: string;
  }) {
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId },
    });

    if (!investment) throw new Error('Investment not found');

    const totalAmount = data.quantity * data.pricePerUnit + (data.fees || 0);

    const transaction = await prisma.investmentTransaction.create({
      data: {
        investmentId,
        type: data.type,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        totalAmount,
        fees: data.fees,
        date: data.date || new Date(),
        notes: data.notes,
      },
    });

    // Update investment quantity and average cost
    let newQuantity = Number(investment.quantity);
    let newAvgCost = Number(investment.avgCostBasis);

    if (data.type === 'buy' || data.type === 'transfer_in') {
      const oldTotal = newQuantity * newAvgCost;
      const newTotal = data.quantity * data.pricePerUnit;
      newQuantity += data.quantity;
      newAvgCost = newQuantity > 0 ? (oldTotal + newTotal) / newQuantity : 0;
    } else if (data.type === 'sell' || data.type === 'transfer_out') {
      newQuantity -= data.quantity;
      if (newQuantity < 0) newQuantity = 0;
    }

    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        quantity: newQuantity,
        avgCostBasis: newAvgCost,
        isWatchlist: false, // No longer watchlist if we have transactions
      },
    });

    return transaction;
  },

  async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await prisma.investmentTransaction.findFirst({
      where: { id: transactionId },
      include: { investment: true },
    });

    if (!transaction || transaction.investment.userId !== userId) {
      throw new Error('Transaction not found');
    }

    // Recalculate investment after deletion would be complex,
    // so we just delete the transaction
    return prisma.investmentTransaction.delete({
      where: { id: transactionId },
    });
  },

  // Dividends
  async addDividend(userId: string, investmentId: string, data: {
    amount: number;
    date?: Date;
    isReinvested?: boolean;
    notes?: string;
  }) {
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId },
    });

    if (!investment) throw new Error('Investment not found');

    return prisma.investmentDividend.create({
      data: {
        investmentId,
        amount: data.amount,
        date: data.date || new Date(),
        isReinvested: data.isReinvested || false,
        notes: data.notes,
      },
    });
  },

  async deleteDividend(userId: string, dividendId: string) {
    const dividend = await prisma.investmentDividend.findFirst({
      where: { id: dividendId },
      include: { investment: true },
    });

    if (!dividend || dividend.investment.userId !== userId) {
      throw new Error('Dividend not found');
    }

    return prisma.investmentDividend.delete({
      where: { id: dividendId },
    });
  },

  // Update prices (manual for now, could integrate with API later)
  async updatePrice(userId: string, investmentId: string, price: number) {
    return prisma.investment.updateMany({
      where: { id: investmentId, userId },
      data: { currentPrice: price },
    });
  },

  // Get types and sectors for filtering
  async getFilters(userId: string) {
    const investments = await prisma.investment.findMany({
      where: { userId },
      select: { type: true, sector: true },
    });

    const types = [...new Set(investments.map((i: any) => i.type))];
    const sectors = [...new Set(investments.map((i: any) => i.sector).filter(Boolean))];

    return { types, sectors };
  },

  // Fetch real-time NAV for Indian mutual funds from MFAPI.in
  async fetchMutualFundNAV(schemeCode: string): Promise<{
    nav: number;
    date: string;
    schemeName: string;
    schemeCategory: string;
  } | null> {
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      if (!response.ok) return null;
      
      const data: any = await response.json();
      if (!data || !data.data || data.data.length === 0) return null;
      
      const latestNAV = data.data[0];
      return {
        nav: parseFloat(latestNAV.nav),
        date: latestNAV.date,
        schemeName: data.meta?.scheme_name || '',
        schemeCategory: data.meta?.scheme_category || '',
      };
    } catch (error) {
      console.error(`Failed to fetch NAV for scheme ${schemeCode}:`, error);
      return null;
    }
  },

  // Search mutual funds by name
  async searchMutualFunds(query: string): Promise<Array<{
    schemeCode: string;
    schemeName: string;
  }>> {
    try {
      const response = await fetch('https://api.mfapi.in/mf/search?q=' + encodeURIComponent(query));
      if (!response.ok) return [];
      
      const data = await response.json() as any[];
      return data.slice(0, 20).map((item: any) => ({
        schemeCode: String(item.schemeCode),
        schemeName: item.schemeName,
      }));
    } catch (error) {
      console.error('Failed to search mutual funds:', error);
      return [];
    }
  },

  // Update prices for all mutual funds of a user
  async refreshMutualFundPrices(userId: string): Promise<{
    updated: number;
    failed: number;
    results: Array<{ symbol: string; name: string; oldPrice: number; newPrice: number; change: number }>;
  }> {
    const mutualFunds = await prisma.investment.findMany({
      where: { 
        userId, 
        type: 'mutual_fund',
        symbol: { not: '' },
      },
    });

    let updated = 0;
    let failed = 0;
    const results: Array<{ symbol: string; name: string; oldPrice: number; newPrice: number; change: number }> = [];

    for (const mf of mutualFunds) {
      // Symbol should contain the AMFI scheme code for Indian MFs
      const navData = await this.fetchMutualFundNAV(mf.symbol || '');
      
      if (navData) {
        const oldPrice = Number(mf.currentPrice) || 0;
        const newPrice = navData.nav;
        const change = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

        await prisma.investment.update({
          where: { id: mf.id },
          data: { 
            currentPrice: newPrice,
          },
        });

        results.push({
          symbol: mf.symbol || '',
          name: mf.name,
          oldPrice,
          newPrice,
          change: Math.round(change * 100) / 100,
        });
        updated++;
      } else {
        failed++;
      }
    }

    return { updated, failed, results };
  },

  // Get historical NAV data for a mutual fund
  async getMutualFundHistory(schemeCode: string, days: number = 30): Promise<Array<{
    date: string;
    nav: number;
  }>> {
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      if (!response.ok) return [];
      
      const data: any = await response.json();
      if (!data || !data.data) return [];
      
      return data.data.slice(0, days).map((item: any) => ({
        date: item.date,
        nav: parseFloat(item.nav),
      }));
    } catch (error) {
      console.error(`Failed to fetch history for scheme ${schemeCode}:`, error);
      return [];
    }
  },
};
