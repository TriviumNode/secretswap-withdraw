export class RewardsPoolBalanceQuery {
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