import { MsgExecuteContract } from "secretjs";

interface WithdrawLiqudiityParams {
    pool_address: string;
    lp_token_address: string;
    lp_token_amount: string; // Integer as string
    wallet_address: string;
}

export const getWithdrawLiquidityMessage = ({pool_address, lp_token_address, lp_token_amount, wallet_address}: WithdrawLiqudiityParams) => {
    const receiveMsg = {
        withdraw_liquidity: {}
    }
    return new MsgExecuteContract({
        sender: wallet_address,
        contract_address: lp_token_address,
        msg: {
            send: {
                recipient: pool_address,
                amount: lp_token_amount,
                msg: Buffer.from(JSON.stringify(receiveMsg)).toString('base64')
            }
        }
    });
};