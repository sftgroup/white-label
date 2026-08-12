// Ambient declarations for optional peer dependencies not published to npm yet.
// These packages are loaded dynamically via try/catch at runtime.

declare module '@0xaibridge/sdk' {
  export class BridgeSDK {
    constructor(opts: {
      bridgeAddress: string;
      rpcUrl?: string;
      provider?: any;
      signerKey?: string;
      signer?: any;
      gasLimitTransfer?: number;
      gasLimitComplete?: number;
    });
  }
}

declare module '@0xpredx/sdk' {
  export class PredXClient {
    constructor(config: PredXConfig);
    getMarkets(): Promise<Array<{ id: string; question: string; volume: string }>>;
    placeBet(params: { marketId: string; outcome: string; amount: string; privateKey: string }): Promise<{ txHash: string }>;
  }
  export interface PredXConfig {
    rpcUrl: string;
    chainId: number;
    brand?: { name?: string; primaryColor?: string };
  }
}

declare module 'oxachain-sdk' {
  export class OxaChainClient {
    constructor(opts: OxaChainClientOptions);
    setBrand(brand: { name?: string; symbol?: string; primaryColor?: string }): void;
    getBrand(): { name: string; primaryColor: string };
    getBalance(address: string): Promise<string>;
    sendTransaction(tx: { to: string; value?: string; data?: string }): Promise<string>;
  }
  export interface OxaChainClientOptions {
    rpcUrl?: string;
    chainId?: number;
    brand?: { name?: string; symbol?: string; primaryColor?: string };
  }
}
