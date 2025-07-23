import { QueryClient } from "../constants"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const queryContract = async <T = any>(contract_address: string, query: any): Promise<T> => {
    const result = await QueryClient.query.compute.queryContract({
        contract_address,
        query,
    });

    if (typeof result === 'string') throw result;

    return result as T;
}