export type ChargeInput = {
  amountKobo: number;
  reference: string;
  email: string;
};

export type ChargeResult = {
  success: boolean;
  paymentId: string;
  provider: "mock" | "";
};

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  async charge(input: ChargeInput): Promise<ChargeResult> {
    return {
      success: true,
      paymentId: `mock_${input.reference}`,
      provider: "mock",
    };
  }
}

export const paymentProvider: PaymentProvider = new MockPaymentProvider();
