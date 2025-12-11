import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import logger from '../middleware/logger';
import { Bill, BillItem, GetBillResponse, CreateBillResponse } from '../types/paykaduna.d';
import { GetAllBillsQueryInput } from '../schemas/validation.schemas';

/**
 * Bill Database Service
 * Handles all database operations for bill mirroring
 */

class BillDbService {
  /**
   * Upsert a bill with its items
   * Creates a new bill or updates existing one, replacing all bill items
   */
  async upsertBill(
    billData: Bill,
    billItems: BillItem[],
    additionalData?: {
      invoiceNo?: string;
      invoiceUrl?: string;
      metadata?: Record<string, unknown>;
      head?: string;
      subhead?: string;
      paidAt?: Date;
    }
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Upsert the bill
        await tx.bill.upsert({
          where: { billReference: billData.billReference },
          update: {
            payStatus: billData.payStatus,
            narration: billData.narration || null,
            invoiceNo: additionalData?.invoiceNo || undefined,
            invoiceUrl: additionalData?.invoiceUrl || undefined,
            metadata: additionalData?.metadata ? (additionalData.metadata as Prisma.InputJsonValue) : undefined,
            head: additionalData?.head !== undefined ? additionalData.head : billData.head || null,
            subhead: additionalData?.subhead !== undefined ? additionalData.subhead : billData.subhead || null,
            paidAt: additionalData?.paidAt !== undefined ? additionalData.paidAt : (billData.paidAt ? new Date(billData.paidAt) : null),
            updatedAt: new Date(),
          },
          create: {
            billReference: billData.billReference,
            payStatus: billData.payStatus,
            narration: billData.narration || null,
            invoiceNo: additionalData?.invoiceNo || null,
            invoiceUrl: additionalData?.invoiceUrl || null,
            metadata: additionalData?.metadata ? (additionalData.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
            head: additionalData?.head !== undefined ? additionalData.head : billData.head || null,
            subhead: additionalData?.subhead !== undefined ? additionalData.subhead : billData.subhead || null,
            paidAt: additionalData?.paidAt !== undefined ? additionalData.paidAt : (billData.paidAt ? new Date(billData.paidAt) : null),
          },
        });

        // Delete existing bill items (replace strategy)
        await tx.billItem.deleteMany({
          where: { billReference: billData.billReference },
        });

        // Create new bill items
        if (billItems.length > 0) {
          await tx.billItem.createMany({
            data: billItems.map((item) => ({
              billReference: billData.billReference,
              revenueHead: item.revenueHead,
              revenueCode: item.revenueCode,
              amount: new Decimal(item.amount),
              // Note: mdasId and narration from BillItem aren't in the API response,
              // but we keep them in schema for potential future use
            })),
          });
        }
      });

      logger.info('Bill upserted successfully', {
        billReference: billData.billReference,
        itemCount: billItems.length,
      });
    } catch (error) {
      logger.error('Failed to upsert bill', {
        billReference: billData.billReference,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get bill by reference from database
   */
  async getBillByReference(billReference: string) {
    try {
      const bill = await prisma.bill.findUnique({
        where: { billReference },
        include: {
          billItems: true,
        },
      });

      return bill;
    } catch (error) {
      logger.error('Failed to get bill from database', {
        billReference,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update bill from webhook event data
   * Fetches latest bill data from API if billReference is available
   */
  async updateBillFromWebhook(
    billReference: string,
    webhookData: Record<string, unknown>,
    apiBillData?: GetBillResponse,
    eventType?: string
  ): Promise<void> {
    try {
      // Determine if this is a payment success event
      const isPaymentSuccess = eventType === 'charge.success' || eventType === 'payment.success';
      const paidAt = isPaymentSuccess ? new Date() : undefined;

      // Extract head and subhead from webhook data
      const head = webhookData.head as string | undefined;
      const subhead = webhookData.subhead as string | undefined;

      // If we have full bill data from API, use it for update
      if (apiBillData?.bill && apiBillData?.billItems) {
        await this.upsertBill(apiBillData.bill, apiBillData.billItems, {
          invoiceNo: webhookData.invoiceNo as string | undefined,
          metadata: webhookData as Record<string, unknown>,
          head,
          subhead,
          paidAt,
        });
      } else {
        // Partial update - only update what we have from webhook
        const updateData: Prisma.BillUpdateInput = {
          updatedAt: new Date(),
        };

        if (webhookData.payStatus) {
          updateData.payStatus = webhookData.payStatus as string;
        }

        if (webhookData.invoiceNo) {
          updateData.invoiceNo = webhookData.invoiceNo as string;
        }

        if (webhookData.status) {
          // Map webhook status to payStatus if provided
          updateData.payStatus = webhookData.status as string;
        }

        // Set paidAt if payment was successful
        if (paidAt) {
          updateData.paidAt = paidAt;
        }

        // Set head and subhead if provided
        if (head !== undefined) {
          updateData.head = head;
        }

        if (subhead !== undefined) {
          updateData.subhead = subhead;
        }

        // Store webhook data as metadata
        updateData.metadata = webhookData as Prisma.InputJsonValue;

        await prisma.bill.update({
          where: { billReference },
          data: updateData,
        });

        logger.info('Bill updated from webhook', {
          billReference,
          hasFullData: !!apiBillData,
          isPaymentSuccess,
        });
      }
    } catch (error) {
      logger.error('Failed to update bill from webhook', {
        billReference,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - webhook processing should continue even if DB update fails
    }
  }

  /**
   * Manually update paidAt field for a bill
   */
  async updatePaidAt(billReference: string, paidAt: Date): Promise<void> {
    try {
      await prisma.bill.update({
        where: { billReference },
        data: {
          paidAt,
          updatedAt: new Date(),
        },
      });

      logger.info('PaidAt updated manually', {
        billReference,
        paidAt,
      });
    } catch (error) {
      logger.error('Failed to update paidAt', {
        billReference,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Save bill from CreateBillResponse
   */
  async saveBillFromResponse(response: CreateBillResponse): Promise<void> {
    if (response.bill && response.billItems) {
      await this.upsertBill(response.bill, response.billItems);
    }
  }

  /**
   * Save bill from GetBillResponse
   */
  async saveBillFromGetResponse(
    response: GetBillResponse,
    invoiceUrl?: string
  ): Promise<void> {
    if (response.bill && response.billItems) {
      await this.upsertBill(response.bill, response.billItems, {
        invoiceUrl,
      });
    }
  }

  /**
   * Get all bills with filters, pagination, and sorting
   */
  async getAllBills(filters: GetAllBillsQueryInput) {
    try {
      const {
        billReference,
        invoiceNo,
        status,
        head,
        subhead,
        createdAtStart,
        createdAtEnd,
        updatedAtStart,
        updatedAtEnd,
        paidAtStart,
        paidAtEnd,
        minAmount,
        maxAmount,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      // Build where clause
      const where: Prisma.BillWhereInput = {};

      // Exact match filters
      if (status) {
        where.payStatus = status;
      }

      if (head) {
        where.head = head;
      }

      if (subhead) {
        where.subhead = subhead;
      }

      // Text search filters (case-insensitive partial match)
      if (billReference) {
        where.billReference = {
          contains: billReference,
          mode: 'insensitive',
        };
      }

      if (invoiceNo) {
        where.invoiceNo = {
          contains: invoiceNo,
          mode: 'insensitive',
        };
      }

      // Date range filters
      if (createdAtStart || createdAtEnd) {
        where.createdAt = {};
        if (createdAtStart) {
          where.createdAt.gte = new Date(createdAtStart);
        }
        if (createdAtEnd) {
          where.createdAt.lte = new Date(createdAtEnd);
        }
      }

      if (updatedAtStart || updatedAtEnd) {
        where.updatedAt = {};
        if (updatedAtStart) {
          where.updatedAt.gte = new Date(updatedAtStart);
        }
        if (updatedAtEnd) {
          where.updatedAt.lte = new Date(updatedAtEnd);
        }
      }

      if (paidAtStart || paidAtEnd) {
        where.paidAt = {};
        if (paidAtStart) {
          where.paidAt.gte = new Date(paidAtStart);
        }
        if (paidAtEnd) {
          where.paidAt.lte = new Date(paidAtEnd);
        }
      }

      // Build orderBy clause
      const orderBy: Prisma.BillOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      // First, get total count (before amount filtering)
      const totalCountBeforeAmountFilter = await prisma.bill.count({ where });

      // Fetch bills with items
      const bills = await prisma.bill.findMany({
        where,
        include: {
          billItems: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      // Calculate total amount per bill and filter by amount range if needed
      let filteredBills = bills;
      if (minAmount !== undefined || maxAmount !== undefined) {
        filteredBills = bills.filter((bill) => {
          const totalAmount = bill.billItems.reduce(
            (sum, item) => sum + Number(item.amount),
            0
          );

          if (minAmount !== undefined && totalAmount < minAmount) {
            return false;
          }
          if (maxAmount !== undefined && totalAmount > maxAmount) {
            return false;
          }
          return true;
        });
      }

      // Recalculate total count if amount filtering was applied
      // Note: This is an approximation. For exact count with amount filtering,
      // we'd need to fetch all bills, which could be expensive.
      // A better approach would be to use a raw SQL query with aggregation.
      let totalCount = totalCountBeforeAmountFilter;
      if (minAmount !== undefined || maxAmount !== undefined) {
        // For accurate count with amount filtering, we need to fetch all matching bills
        // (without pagination) to calculate totals
        const allBillsForCount = await prisma.bill.findMany({
          where,
          include: {
            billItems: true,
          },
        });

        totalCount = allBillsForCount.filter((bill) => {
          const totalAmount = bill.billItems.reduce(
            (sum, item) => sum + Number(item.amount),
            0
          );

          if (minAmount !== undefined && totalAmount < minAmount) {
            return false;
          }
          if (maxAmount !== undefined && totalAmount > maxAmount) {
            return false;
          }
          return true;
        }).length;
      }

      const totalPages = Math.ceil(totalCount / limit);

      logger.info('Bills retrieved successfully', {
        page,
        limit,
        totalCount,
        billsReturned: filteredBills.length,
      });

      return {
        bills: filteredBills,
        totalCount,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to get all bills', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const billDbService = new BillDbService();
export default billDbService;

