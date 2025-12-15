"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/providers/auth-context";
import { useWalletConnection } from "@/connect-wallet";
import { CHAIN_CONFIGS } from "@/connect-wallet/utils/wallet-config";

interface WalletInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletInfoModal({ isOpen, onClose }: WalletInfoModalProps) {
  const { walletState, disconnectWallet } = useWalletConnection();
  const { principalId, sessionData } = useAuth();
  const [activeTab, setActiveTab] = useState<"wallet" | "icp">("wallet");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const handleCopyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleCopyPrincipal = () => {
    if (principalId) {
      navigator.clipboard.writeText(principalId);
      setCopiedPrincipal(true);
      setTimeout(() => setCopiedPrincipal(false), 2000);
    }
  };

  const truncateAddress = (address: string, start: number = 6, end: number = 4) => {
    if (!address) return "";
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    onClose();
  };

  const getAuthMethodName = () => {
    if (sessionData?.walletType === "internet-identity") {
      return "Internet Identity";
    } else if (sessionData?.walletType === "nfid") {
      return "NFID";
    }
    return "ICP";
  };

  const getAuthMethodIcon = () => {
    if (sessionData?.walletType === "internet-identity") {
      return "/wallets/icp.png";
    } else if (sessionData?.walletType === "nfid") {
      return "/wallets/email.png";
    }
    return "/wallets/icp.png";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex items-start justify-center min-h-full p-4 pt-20">
        <div
          className="w-full max-w-sm bg-background border rounded-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-lg font-semibold">Wallet Info</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "wallet"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Connected Wallet
            </button>
            <button
              onClick={() => setActiveTab("icp")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "icp"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ICP Identity
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Connected Wallet Tab */}
            {activeTab === "wallet" && (
              <div className="space-y-4">
                {walletState.isConnected && walletState.chain ? (
                  <>
                    {/* Chain Info */}
                    <div className="flex items-center space-x-3 pb-3 border-b">
                      <div className="w-10 h-10 relative">
                        <Image
                          src={CHAIN_CONFIGS[walletState.chain].icon}
                          alt={CHAIN_CONFIGS[walletState.chain].name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Connected to</div>
                        <div className="font-medium">{CHAIN_CONFIGS[walletState.chain].name}</div>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Wallet Address</div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-mono text-sm">
                          {truncateAddress(walletState.address || "")}
                        </span>
                        <button
                          onClick={handleCopyAddress}
                          className="ml-2 p-1.5 hover:bg-background rounded transition-colors"
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Wallet Type */}
                    {walletState.walletType && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Wallet Type</div>
                        <div className="p-3 bg-muted rounded-lg text-sm capitalize">
                          {walletState.walletType}
                        </div>
                      </div>
                    )}

                    {/* Disconnect Button */}
                    <button
                      onClick={handleDisconnect}
                      className="w-full px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg font-medium transition-colors"
                    >
                      Disconnect Wallet
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No wallet connected
                  </div>
                )}
              </div>
            )}

            {/* ICP Identity Tab */}
            {activeTab === "icp" && (
              <div className="space-y-4">
                {principalId ? (
                  <>
                    {/* Auth Method Info */}
                    <div className="flex items-center space-x-3 pb-3 border-b">
                      <div className="w-10 h-10 relative">
                        <Image
                          src={getAuthMethodIcon()}
                          alt={getAuthMethodName()}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Authenticated with</div>
                        <div className="font-medium">{getAuthMethodName()}</div>
                      </div>
                    </div>

                    {/* Principal ID */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Principal ID</div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-mono text-sm break-all">
                          {truncateAddress(principalId, 10, 8)}
                        </span>
                        <button
                          onClick={handleCopyPrincipal}
                          className="ml-2 p-1.5 hover:bg-background rounded transition-colors flex-shrink-0"
                        >
                          {copiedPrincipal ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Full Principal ID (expandable) */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Full Principal</div>
                      <div className="p-3 bg-muted rounded-lg text-xs font-mono break-all">
                        {principalId}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Not authenticated
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
