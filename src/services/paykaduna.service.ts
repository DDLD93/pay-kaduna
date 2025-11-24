import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config/env';
import { signRequest } from '../middleware/signRequest';
import { retryWithBackoff } from '../utils/retry';
import {
  CreateBillRequest,
  BulkBillRequest,
  CreateBillResponse,
  AttachDataRequest,
  BulkAttachDataRequest,
  InvoiceUrlResponse,
  RegisterTaxpayerRequest,
  SearchTaxpayerResponse,
  InitPaymentRequest,
  InitPaymentResponse,
} from '../types/paykaduna.d';

/**
 * PayKaduna Service
 * Handles all API communication with PayKaduna IBS
 */
class PayKadunaService {
  private axiosInstance: AxiosInstance;

  constructor() {
    // Create Axios instance with base URL from config
    this.axiosInstance = axios.create({
      baseURL: config.payKaduna.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach HMAC signature interceptor
    this.axiosInstance.interceptors.request.use((requestConfig) => {
      return signRequest(requestConfig, config.payKaduna.apiKey);
    });

    // Attach error interceptor for logging (optional)
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log error details here if needed
        return Promise.reject(error);
      }
    );
  }

  /**
   * Helper method to make requests with retry logic
   */
  private async request<T>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return retryWithBackoff(() => this.axiosInstance.request<T>(config));
  }

  // ============================================================================
  // Bill Management Methods
  // ============================================================================

  /**
   * Create a single ES Bill
   * Upstream: POST /api/ESBills/CreateESBill
   */
  async createESBill(requestBody: CreateBillRequest): Promise<CreateBillResponse> {
    // Inject engineCode from config if not provided
    const body = {
      ...requestBody,
      engineCode: requestBody.engineCode || config.payKaduna.engineCode,
    };

    const response = await this.request<CreateBillResponse>({
      method: 'POST',
      url: '/api/ESBills/CreateESBill',
      data: body,
    });

    return response.data;
  }

  /**
   * Create bulk ES Bills
   * Upstream: POST /api/ESBills/CreateBulkESBill
   */
  async createBulkESBill(requestBody: BulkBillRequest): Promise<CreateBillResponse> {
    // Inject engineCode from config if not provided
    const body = {
      ...requestBody,
      engineCode: requestBody.engineCode || config.payKaduna.engineCode,
    };

    const response = await this.request<CreateBillResponse>({
      method: 'POST',
      url: '/api/ESBills/CreateBulkESBill',
      data: body,
    });

    return response.data;
  }

  /**
   * Get Bill by reference
   * Upstream: GET /api/ESBills/GetBill?billreference=:reference
   */
  async getBill(billReference: string): Promise<unknown> {
    const response = await this.request<unknown>({
      method: 'GET',
      url: '/api/ESBills/GetBill',
      params: {
        billreference: billReference,
      },
    });

    return response.data;
  }

  /**
   * Get Invoice URL for a bill
   * Upstream: GET /api/ESBills/GetInvoiceUrl?billreference=:reference
   */
  async getInvoiceUrl(billReference: string): Promise<InvoiceUrlResponse> {
    const response = await this.request<InvoiceUrlResponse>({
      method: 'GET',
      url: '/api/ESBills/GetInvoiceUrl',
      params: {
        billreference: billReference,
      },
    });

    return response.data;
  }

  /**
   * Attach additional data to a bill
   * Upstream: POST /api/ESBills/AttachAdditionalDataToBill
   */
  async attachAdditionalDataToBill(
    requestBody: AttachDataRequest
  ): Promise<unknown> {
    const response = await this.request<unknown>({
      method: 'POST',
      url: '/api/ESBills/AttachAdditionalDataToBill',
      data: requestBody,
    });

    return response.data;
  }

  /**
   * Bulk attach additional data to bills
   * Upstream: POST /api/ESBills/BulkAttachAdditionalDataToBill
   */
  async bulkAttachAdditionalDataToBill(
    requestBody: BulkAttachDataRequest
  ): Promise<unknown> {
    const response = await this.request<unknown>({
      method: 'POST',
      url: '/api/ESBills/BulkAttachAdditionalDataToBill',
      data: requestBody,
    });

    return response.data;
  }

  // ============================================================================
  // Taxpayer Management Methods
  // ============================================================================

  /**
   * Register a new taxpayer
   * Upstream: POST /api/ESBills/RegisterTaxPayer
   */
  async registerTaxPayer(
    requestBody: RegisterTaxpayerRequest
  ): Promise<unknown> {
    const response = await this.request<unknown>({
      method: 'POST',
      url: '/api/ESBills/RegisterTaxPayer',
      data: requestBody,
    });

    return response.data;
  }

  /**
   * Search for taxpayers
   * Upstream: GET /api/ESBills/SearchTaxPayer?criteria=:term
   */
  async searchTaxPayer(criteria: string): Promise<SearchTaxpayerResponse> {
    const response = await this.request<SearchTaxpayerResponse>({
      method: 'GET',
      url: '/api/ESBills/SearchTaxPayer',
      params: {
        criteria,
      },
    });

    return response.data;
  }

  // ============================================================================
  // Payment Methods
  // ============================================================================

  /**
   * Initialize payment transaction
   * Upstream: POST /api/ESBills/CreateESTransaction
   */
  async createESTransaction(
    requestBody: InitPaymentRequest
  ): Promise<InitPaymentResponse> {
    const response = await this.request<unknown>({
      method: 'POST',
      url: '/api/ESBills/CreateESTransaction',
      data: requestBody,
    });

    // The response structure may vary, so we wrap it
    return {
      checkoutUrl: (response.data as { checkoutUrl?: string })?.checkoutUrl || '',
      rawResponse: response.data,
    } as InitPaymentResponse;
  }

  /**
   * Update payment redirect URL
   * Upstream: POST /api/ESBills/UpdatePaymentRedirectUrl
   */
  async updatePaymentRedirectUrl(redirectUrl: string): Promise<unknown> {
    const response = await this.request<unknown>({
      method: 'POST',
      url: '/api/ESBills/UpdatePaymentRedirectUrl',
      data: {
        redirectUrl: redirectUrl,
      },
    });

    return response.data;
  }
}

// Export singleton instance
export const payKadunaService = new PayKadunaService();
export default payKadunaService;
