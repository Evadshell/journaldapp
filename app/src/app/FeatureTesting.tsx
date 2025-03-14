"use client";
import React, { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useProgram } from "./setup";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
const FeatureTesting = () => {
  const { program, provider } = useProgram();
  const { publicKey } = useWallet();
  const createJournalEntry = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }
    const tx = await program?.methods
      .createJournalEntry("test", "testing testing")
      .accounts({
        payer: publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log(tx);
  };
  return (
    <div>
      <div className="mb-4">
        <WalletMultiButton />
      </div>
      <div className="flex flex-col gap-2 w-full max-w-md">
        <button
          onClick={createJournalEntry}
          disabled={!publicKey}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:bg-gray-400"
        >
          Create entry
        </button>
      </div>
    </div>
  );
};

export default FeatureTesting;
