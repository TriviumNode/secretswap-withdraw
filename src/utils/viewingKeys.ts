import { MsgExecuteContract, SecretNetworkClient } from "secretjs";

// Get a viewing key for a specified contract from the wallet. Will return undefined if the wallet doesn't have a key for the contract.
export const getViewingKeyFromWallet = async (contract_address: string): Promise<string | undefined> => {
    if (!window.keplr) throw 'Keplr not found. Is it installed and unlocked?'
    try {
        return await window.keplr.getSecret20ViewingKey('secret-4', contract_address);
    } catch {
        return undefined;
    }
}

// Set viewing keys on multiple contracts in a single transaction.
export const setViewingKeys = async (client: SecretNetworkClient, wallet_address: string, viewing_key: string, contract_addresses: string[]) => {
    const messages = contract_addresses.map(ca => {
        return new MsgExecuteContract({
            sender: wallet_address,
            contract_address: ca,
            msg: {
                set_viewing_key: {
                    key: viewing_key
                }
            }
        });
    });
    return await client.tx.broadcast(messages, {
        gasLimit: messages.length * 40_000 + 50_000,
    });
}