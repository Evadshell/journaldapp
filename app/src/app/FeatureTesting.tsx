"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useProgram } from "./setup";
import { useWallet } from "@solana/wallet-adapter-react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as anchor from "@coral-xyz/anchor";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

const FeatureTesting = () => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize fetchEntries to prevent unnecessary re-renders
  const fetchEntries = useCallback(async () => {
    if (!program || !publicKey) return;
    
    try {
      const fetchedEntries = await program.account.journalEntryState.all();
      setEntries(fetchedEntries);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching entries:", error);
      setLoading(false);
    }
  }, [program, publicKey]);

  // Create a new journal entry
  const createJournalEntry = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    try {
      const [journalPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(title), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .createJournalEntry(title, message)
        .accounts({
          journalEntry: journalPDA,
          payer: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log("Transaction Signature:", tx);
      setTitle("");
      setMessage("");
      fetchEntries(); // Refresh the list after creation
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  const updateJournalEntry = async (entry) => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }
    
    try {
      const tx = await program.methods
        .updateJournalEntry(entry.account.title, editMessage)
        .accounts({ 
          owner: publicKey, 
          journalEntry: entry.publicKey 
        })
        .rpc();

      console.log("Transaction Signature:", tx);
      setEditMessage("");
      fetchEntries(); // Refresh the list after update
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const deleteEntry = async (entry) => {
    if (!publicKey) return;
    
    try {
      const title = entry.account.title;

      const [journalPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(title), publicKey.toBuffer()],
        program.programId
      );
      
      // Call the delete method
      const tx = await program.methods
        .deleteJournalEntry(title)
        .accounts({
          journalEntry: journalPDA,
          owner: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        })
        .rpc();
        
      console.log("Delete Transaction Signature:", tx);
      
      
      await fetchEntries(); // Refresh after deletion
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  useEffect(() => {
    if (publicKey && mounted) {
      fetchEntries();
    }
  }, [fetchEntries, publicKey, mounted]);

  // Don't render wallet-dependent content until client-side hydration is complete
  if (!mounted) {
    return <div className="p-6 max-w-2xl mx-auto">Loading wallet...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between">
        <WalletMultiButton />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <h2 className="text-lg font-bold">New Journal Entry</h2>
            <Input 
              placeholder="Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="mb-2"
            />
            <Input 
              placeholder="Message" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              className="mb-2"
            />
            <Button onClick={createJournalEntry}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4">
  {loading ? (
    <p>Loading entries...</p>
  ) : entries.length === 0 ? (
    <p>No entries found. Create your first journal entry!</p>
  ) : (
    entries.map((entry) => (
      <Card key={entry.publicKey.toString()}>
        <CardHeader>
          <CardTitle>{entry.account.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{entry.account.message}</p>
          <div className="flex gap-2 mt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedEntry(entry);
                  setEditMessage(entry.account.message);
                }}>Edit</Button>
              </DialogTrigger>
              <DialogContent>
                <h2 className="text-lg font-bold">Update Entry</h2>
                <Input
                  placeholder="New message"
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={() => updateJournalEntry(entry)}>Update</Button>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" onClick={() => deleteEntry(entry)}>Delete</Button>
          </div>
        </CardContent>
      </Card>
    ))
  )}
</div>
    </div>
  );
};

export default FeatureTesting;