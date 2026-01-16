/**
 * Script to find missing tokens and add them to secret_tokens.json
 *
 * Run with: npx ts-node --esm scripts/find-missing-tokens.ts
 */

import { SecretNetworkClient } from "secretjs";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data file paths
const DATA_DIR = path.join(__dirname, "..", "src", "data");
const BRIDGE_TOKENS_PATH = path.join(DATA_DIR, "bridge_tokens.json");
const SECRET_TOKENS_PATH = path.join(DATA_DIR, "secret_tokens.json");
const LIQUIDITY_POOLS_PATH = path.join(DATA_DIR, "liquidity_pools.json");

// Types
interface TokenInfo {
    name: string;
    address: string;
    decimals: number;
}

interface BridgeToken {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    image?: string;
}

interface LiquidityPool {
    pool_address: string;
    lp_token_address: string;
    asset_infos: Array<{
        token?: { contract_addr: string };
        native_token?: { denom: string };
    }>;
}

interface TokenInfoResponse {
    token_info: {
        name: string;
        symbol: string;
        decimals: number;
        total_supply?: string;
    };
}

// Create Secret Network client
const client = new SecretNetworkClient({
    chainId: "secret-4",
    url: "https://secret.api.trivium.network:1317",
});

// Load JSON file
function loadJson<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
}

// Save JSON file
function saveJson<T>(filePath: string, data: T): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

// Query token info from contract
async function queryTokenInfo(
    contractAddress: string,
): Promise<TokenInfoResponse | null> {
    try {
        const result = await client.query.compute.queryContract({
            contract_address: contractAddress,
            query: { token_info: {} },
        });
        return result as TokenInfoResponse;
    } catch (error) {
        console.error(
            `Failed to query token info for ${contractAddress}:`,
            error,
        );
        return null;
    }
}

// Main function
async function main() {
    console.log("Loading data files...");

    // Load all data
    const bridgeTokens = loadJson<BridgeToken[]>(BRIDGE_TOKENS_PATH);
    const secretTokens = loadJson<TokenInfo[]>(SECRET_TOKENS_PATH);
    const liquidityPools = loadJson<LiquidityPool[]>(LIQUIDITY_POOLS_PATH);

    // Build set of known token addresses
    const knownAddresses = new Set<string>();

    for (const token of bridgeTokens) {
        knownAddresses.add(token.address);
    }

    for (const token of secretTokens) {
        knownAddresses.add(token.address);
    }

    console.log(`Known tokens: ${knownAddresses.size}`);

    // Collect all unique token addresses from LP pool underlying assets only
    const allTokenAddresses = new Set<string>();

    // From liquidity pools - underlying assets only (not LP tokens)
    for (const pool of liquidityPools) {
        for (const assetInfo of pool.asset_infos) {
            if (assetInfo.token?.contract_addr) {
                allTokenAddresses.add(assetInfo.token.contract_addr);
            }
        }
    }

    console.log(
        `Total unique underlying asset addresses found: ${allTokenAddresses.size}`,
    );

    // Find missing tokens
    const missingAddresses: string[] = [];
    for (const address of allTokenAddresses) {
        if (!knownAddresses.has(address)) {
            missingAddresses.push(address);
        }
    }

    console.log(`Missing tokens: ${missingAddresses.length}`);

    if (missingAddresses.length === 0) {
        console.log("No missing tokens found!");
        return;
    }

    console.log("\nQuerying missing tokens...\n");

    // Query each missing token
    const newTokens: TokenInfo[] = [];

    for (const address of missingAddresses) {
        console.log(`Querying ${address}...`);

        const tokenInfo = await queryTokenInfo(address);

        if (tokenInfo?.token_info) {
            const { symbol, decimals } = tokenInfo.token_info;

            newTokens.push({
                name: symbol,
                address: address,
                decimals: decimals,
            });

            console.log(`  ✅ ${symbol} (${decimals} decimals)`);
        } else {
            console.log(`  ❌ Failed to query`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (newTokens.length === 0) {
        console.log("\nNo new tokens to add.");
        return;
    }

    // Add new tokens to secret_tokens.json
    console.log(
        `\nAdding ${newTokens.length} new tokens to secret_tokens.json...`,
    );

    const updatedSecretTokens = [...secretTokens, ...newTokens];

    // Sort by name
    updatedSecretTokens.sort((a, b) => a.name.localeCompare(b.name));

    saveJson(SECRET_TOKENS_PATH, updatedSecretTokens);

    console.log("Done!");

    // Print summary
    console.log("\n=== Summary ===");
    console.log(`Added ${newTokens.length} new tokens:`);
    for (const token of newTokens) {
        console.log(`  - ${token.name} (${token.address})`);
    }
}

main().catch(console.error);
