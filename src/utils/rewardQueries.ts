export class SecretSwapRewardsPoolBalanceQuery {
    balance: {
        address: string;
        key: string;
    };

    constructor(wallet_address: string, viewing_key: string) {
        this.balance = {
            address: wallet_address,
            key: viewing_key
        }
    }
}

export class BridgeRewardsPoolBalanceQuery {
    deposit: {
        address: string;
        key: string;
    };

    constructor(wallet_address: string, viewing_key: string) {
        this.deposit = {
            address: wallet_address,
            key: viewing_key
        }
    }
}