// "use client";

// import React, { useMemo } from "react";
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { clusterApiUrl } from "@solana/web3.js";
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

// // Default styles that can be overridden by your app
// // require("@solana/wallet-adapter-react-ui/styles.css");
// import "@solana/wallet-adapter-react-ui/styles.css";


// // imports here

// export default function AmigoWalletProvider({
//     children,
//   }: {
//     children: React.ReactNode;
//   }) {
//     const network = WalletAdapterNetwork.Mainnet;
//     const endpoint = useMemo(() => clusterApiUrl(network), [network]);
//     const wallets = useMemo(
//       () => [
//         new PhantomWalletAdapter(),
//       ],
//       [],
//     );
  
//     return (
//       <ConnectionProvider endpoint={endpoint}>
//         <WalletProvider wallets={wallets} autoConnect>
//           <WalletModalProvider>{children}</WalletModalProvider>
//         </WalletProvider>
//       </ConnectionProvider>
//     );
//   }

"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,

} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function AmigoWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
 
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}