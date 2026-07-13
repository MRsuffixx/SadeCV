declare module "iyzipay" {
  type Callback = (error: Error | null, result: unknown) => void;

  class Iyzipay {
    constructor(options: { uri: string; apiKey: string; secretKey: string });
    subscriptionCheckoutForm: {
      initialize(request: unknown, callback: Callback): void;
      retrieve(request: unknown, callback: Callback): void;
    };
    subscription: {
      retrieve(request: unknown, callback: Callback): void;
    };
    checkoutFormInitialize: {
      create(request: unknown, callback: Callback): void;
    };
    checkoutForm: {
      retrieve(request: unknown, callback: Callback): void;
    };
  }

  export = Iyzipay;
}
