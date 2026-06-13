// Local payment abstraction layer for future Tanzania payment integrations
// Supports: Tigo Pesa, Airtel Money, M-Pesa, NMB, CRDB Bank

export interface LocalPaymentProvider {
  name: string
  code: string
  supportedCountries: string[]
}

export interface PaymentRequest {
  amount: number
  currency: string
  phoneNumber?: string
  reference: string
  description: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  message: string
}

const LOCAL_PROVIDERS: LocalPaymentProvider[] = [
  { name: 'M-Pesa', code: 'mpesa', supportedCountries: ['Tanzania', 'Kenya'] },
  { name: 'Tigo Pesa', code: 'tigo', supportedCountries: ['Tanzania'] },
  { name: 'Airtel Money', code: 'airtel', supportedCountries: ['Tanzania', 'Kenya', 'Uganda'] },
  { name: 'NMB Bank', code: 'nmb', supportedCountries: ['Tanzania'] },
  { name: 'CRDB Bank', code: 'crdb', supportedCountries: ['Tanzania'] },
]

export function getLocalProviders(): LocalPaymentProvider[] {
  return LOCAL_PROVIDERS
}

export async function processLocalPayment(request: PaymentRequest, providerCode: string): Promise<PaymentResponse> {
  const provider = LOCAL_PROVIDERS.find(p => p.code === providerCode)
  if (!provider) {
    return { success: false, message: `Unsupported payment provider: ${providerCode}` }
  }

  // Production: integrate with actual provider APIs
  console.log(`[Local Payment] Processing via ${provider.name}: ${request.amount} ${request.currency}`)

  return {
    success: true,
    transactionId: `LOC-${Date.now()}`,
    message: `Payment of ${request.amount} ${request.currency} processed via ${provider.name}`,
  }
}
