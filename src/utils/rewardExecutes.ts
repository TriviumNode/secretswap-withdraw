import { MsgExecuteContract } from "secretjs";

export const getRewardRedeemMessage = (wallet_address: string, reward_pool_address: string, amount: string) => {
    return new MsgExecuteContract({
        sender: wallet_address,
        contract_address: reward_pool_address,
        msg: {
            redeem: {
                amount
            }
        }
    });
};

export const getRewardEmergencyRedeemMessage = (wallet_address: string, reward_pool_address: string) => {
    return new MsgExecuteContract({
        sender: wallet_address,
        contract_address: reward_pool_address,
        msg: {
            emergency_redeem: {}
        }
    });
};