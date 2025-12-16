import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import logger from '../middleware/logger';

/**
 * Analytics Service
 * Handles aggregation queries for bill analytics
 */

type BillWithItems = Prisma.BillGetPayload<{
  include: {
    billItems: {
      select: {
        amount: true;
      };
    };
  };
}>;

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  head?: string;
  subhead?: string;
  billType?: string;
  zone?: string;
  area?: string;
  fileNumber?: string;
  propertyType?: string;
}

export interface AggregationResult {
  groupBy: string;
  value: string | null;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}

export interface AnalyticsResponse {
  groupBy: string;
  totalCount: number;
  totalSum: number;
  totalAverage: number;
  totalMin: number;
  totalMax: number;
  items: AggregationResult[];
}

class AnalyticsService {
  /**
   * Build base where clause for filtering
   */
  private buildWhereClause(filter: AnalyticsFilter): Prisma.BillWhereInput {
    const where: Prisma.BillWhereInput = {};

    if (filter.status) {
      where.payStatus = filter.status;
    }

    if (filter.head) {
      where.head = filter.head;
    }

    if (filter.subhead) {
      where.subhead = filter.subhead;
    }

    if (filter.billType) {
      where.billType = filter.billType;
    }

    if (filter.zone) {
      where.zone = filter.zone;
    }

    if (filter.area) {
      where.area = filter.area;
    }

    if (filter.fileNumber) {
      where.fileNumber = filter.fileNumber;
    }

    if (filter.propertyType) {
      where.propertyType = filter.propertyType;
    }

    if (filter.startDate || filter.endDate) {
      where.paidAt = {};
      if (filter.startDate) {
        where.paidAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.paidAt.lte = filter.endDate;
      }
    }

    return where;
  }

  /**
   * Calculate aggregations from bill items
   */
  private calculateAggregations(
    bills: BillWithItems[]
  ): {
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
  } {
    const allAmounts: number[] = [];

    bills.forEach((bill: BillWithItems) => {
      bill.billItems.forEach((item: { amount: Decimal }) => {
        allAmounts.push(Number(item.amount));
      });
    });

    if (allAmounts.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
      };
    }

    const sum = allAmounts.reduce((acc, val) => acc + val, 0);
    const count = allAmounts.length;
    const average = sum / count;
    const min = Math.min(...allAmounts);
    const max = Math.max(...allAmounts);

    return { count, sum, average, min, max };
  }

  /**
   * Aggregate bills by status (payStatus)
   */
  async aggregateByStatus(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by payStatus
      const grouped = new Map<string, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        const status = bill.payStatus;
        if (!grouped.has(status)) {
          grouped.set(status, []);
        }
        grouped.get(status)!.push(bill);
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], status: string) => {
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'status',
          value: status,
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'status',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by status', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Aggregate bills by head
   */
  async aggregateByHead(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by head
      const grouped = new Map<string | null, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        const head = bill.head;
        if (!grouped.has(head)) {
          grouped.set(head, []);
        }
        grouped.get(head)!.push(bill);
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], head: string | null) => {
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'head',
          value: head,
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'head',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by head', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Aggregate bills by subhead
   */
  async aggregateBySubhead(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by subhead
      const grouped = new Map<string | null, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        const subhead = bill.subhead;
        if (!grouped.has(subhead)) {
          grouped.set(subhead, []);
        }
        grouped.get(subhead)!.push(bill);
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], subhead: string | null) => {
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'subhead',
          value: subhead,
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'subhead',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by subhead', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Aggregate bills by paidAt (date ranges)
   */
  async aggregateByPaidAt(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);
      // Only include bills that have been paid
      if (where.paidAt && typeof where.paidAt === 'object') {
        where.paidAt = { ...(where.paidAt as Record<string, unknown>), not: null };
      } else {
        where.paidAt = { not: null };
      }

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by date (YYYY-MM-DD format)
      const grouped = new Map<string, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        if (bill.paidAt) {
          const dateKey = bill.paidAt.toISOString().split('T')[0]; // YYYY-MM-DD
          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
          }
          grouped.get(dateKey)!.push(bill);
        }
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], dateKey: string) => {
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'paidAt',
          value: dateKey,
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      // Sort items by date
      items.sort((a, b) => {
        if (a.value === null) return 1;
        if (b.value === null) return -1;
        return a.value.localeCompare(b.value);
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'paidAt',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by paidAt', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Aggregate bills by status and head
   */
  async aggregateByStatusAndHead(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by status and head
      const grouped = new Map<string, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        const key = `${bill.payStatus}::${bill.head || 'null'}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(bill);
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], key: string) => {
        const [status, head] = key.split('::');
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'status-head',
          value: JSON.stringify({ status, head: head === 'null' ? null : head }),
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'status-head',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by status and head', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Aggregate bills by status, head, and subhead
   */
  async aggregateByStatusHeadSubhead(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by status, head, and subhead
      const grouped = new Map<string, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        const key = `${bill.payStatus}::${bill.head || 'null'}::${bill.subhead || 'null'}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(bill);
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], key: string) => {
        const [status, head, subhead] = key.split('::');
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'status-head-subhead',
          value: JSON.stringify({
            status,
            head: head === 'null' ? null : head,
            subhead: subhead === 'null' ? null : subhead,
          }),
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'status-head-subhead',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by status, head, and subhead', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
  /**
   * Aggregate bills by zone, area, billType, and propertyType
   */
  async aggregateByZoneAreaBillTypePropertyType(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    try {
      const where = this.buildWhereClause(filter);

      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: {
            select: {
              amount: true,
            },
          },
        },
      });

      // Group by zone, area, billType, propertyType
      const grouped = new Map<string, BillWithItems[]>();

      bills.forEach((bill: BillWithItems) => {
        const key = `${bill.zone || 'null'}::${bill.area || 'null'}::${bill.billType || 'null'}::${bill.propertyType || 'null'}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(bill);
      });

      // Calculate aggregations for each group
      const items: AggregationResult[] = [];
      let totalCount = 0;
      let totalSum = 0;
      const allAmounts: number[] = [];

      grouped.forEach((groupBills: BillWithItems[], key: string) => {
        const [zone, area, billType, propertyType] = key.split('::');
        const agg = this.calculateAggregations(groupBills);
        items.push({
          groupBy: 'zone-area-billType-propertyType',
          value: JSON.stringify({
            zone: zone === 'null' ? null : zone,
            area: area === 'null' ? null : area,
            billType: billType === 'null' ? null : billType,
            propertyType: propertyType === 'null' ? null : propertyType,
          }),
          ...agg,
        });
        totalCount += agg.count;
        totalSum += agg.sum;
        groupBills.forEach((bill: BillWithItems) => {
          bill.billItems.forEach((item: { amount: Decimal }) => {
            allAmounts.push(Number(item.amount));
          });
        });
      });

      const totalAverage = allAmounts.length > 0 ? totalSum / allAmounts.length : 0;
      const totalMin = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
      const totalMax = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;

      return {
        groupBy: 'zone-area-billType-propertyType',
        totalCount,
        totalSum,
        totalAverage,
        totalMin,
        totalMax,
        items,
      };
    } catch (error) {
      logger.error('Failed to aggregate by zone, area, billType, and propertyType', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Aggregate bills by time (based on paidAt)
   * Alias for aggregateByPaidAt for now, can be extended to support other date fields
   */
  async aggregateByTime(filter: AnalyticsFilter = {}): Promise<AnalyticsResponse> {
    return this.aggregateByPaidAt(filter);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;

