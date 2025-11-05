# Frontend

Privacy-preserving perpetual DEX frontend built with Next.js 14 and TailwindCSS.

## Features

- Wallet connection via RainbowKit
- fhEVM client-side encryption
- Trading interface
- Position management
- Responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Web3**: Wagmi + Viem
- **Wallet**: RainbowKit
- **Encryption**: fhevmjs

## Development

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_CHAIN_ID=8009
NEXT_PUBLIC_RPC_URL=https://devnet.zama.ai
NEXT_PUBLIC_GATEWAY_URL=https://gateway.zama.ai
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS=<deployed_address>
NEXT_PUBLIC_PERPETUAL_DEX_ADDRESS=<deployed_address>
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<your_project_id>
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

## Pages

- `/` - Landing page
- `/trade` - Trading interface
- `/positions` - Position management

## Components

- `components/layout/Header.tsx` - Navigation header with wallet connection
- `components/trading/OrderForm.tsx` - Form to open encrypted positions
- `lib/fhevm/client.ts` - fhEVM initialization and encryption utilities
- `lib/providers/web3-provider.tsx` - Web3 and Wagmi provider

## Deployment

This frontend is designed to be deployed on Vercel:

```bash
vercel
```

Make sure to set environment variables in Vercel dashboard.

## License

MIT
