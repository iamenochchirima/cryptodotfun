"use client";
import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { SessionData, useSessionData } from "./useSessionData";
import { WalletType } from "./types";
import { AuthClient } from "@dfinity/auth-client";
import { getAuthClient } from "./nfid";
import { aidFromPrincipal } from "./util";
import { useSiws } from "ic-siws-js/react";
import { useSiwe } from "ic-siwe-js/react";
import { useSiwbIdentity } from 'ic-use-siwb-identity';
import { useAccount, useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { host, network } from "@/constants/urls";
import { identityCertifierCanisterId, usersCanisterId, usersIDL, identityCertifierIDL, BACKEND_SERVICE, IDENTITY_CERTIFIER_SERVICE } from "@/constants/canisters-config";
import { apiLogout } from "@/services/AuthService";
import { useServerAuth } from "../hooks/useServerAuth";
import { User } from "../../canisters/src/declarations/users/users.did";

interface AuthContextType {
  login: (walletType: WalletType) => Promise<void>;
  logout: () => void;
  autoLogin: () => void;
  identity: any;
  principalId: string | null;
  sessionData: SessionData | null;
  user: User | null;
  isAuthenticated: boolean;
  fetchingUser: boolean;
  backendActor: ActorSubclass<BACKEND_SERVICE> | null;
  identityCertifierActor: ActorSubclass<IDENTITY_CERTIFIER_SERVICE> | null;
  setUser: (user: User | null) => void;
  serverAuthError: string | null;
  clearServerAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useSafeSiws = () => {
  try {
    return useSiws();
  } catch (error) {
    return { identity: null, clear: () => { } };
  }
};

const useSafeSiwe = () => {
  try {
    return useSiwe();
  } catch (error) {
    return { identity: null, clear: () => { } };
  }
};

const useSafeSiwb = () => {
  try {
    return useSiwbIdentity();
  } catch (error) {
    return { identity: null, clear: () => { }, identityAddress: null };
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const { identity: siwsIdentity, clear: siwsClear } = useSafeSiws();
  const { identity: siweIdentity, clear: siweClear } = useSafeSiwe();
  const { identity: siwbIdentity, clear: siwbClear, identityAddress } = useSafeSiwb();

  const { publicKey, disconnect: solanaDisconnect } = useWallet();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { address: ethAddress } = useAccount();
  const [identity, setIdentity] = useState<any>(null);
  const { sessionData, updateSessionData, deleteSessionData, syncSessionData } =
    useSessionData();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [backendActor, setBackendActor] =
    useState<ActorSubclass<BACKEND_SERVICE> | null>(null);
  const [identityCertifierActor, setIdentityCertifierActor] = useState<ActorSubclass<IDENTITY_CERTIFIER_SERVICE> | null>(null);

  const {
    isAuthenticating: isServerAuthenticating,
    isAuthenticated: isServerAuthenticated,
    error: serverAuthError,
    user,
    authenticateWithServer,
    checkExistingSession,
    resetAuth: resetServerAuth,
    clearError: clearServerAuthError,
    setUser
  } = useServerAuth({
    identityCertifierActor,
    backendActor,
    sessionData,
    updateSessionData
  });

  useEffect(() => {
    if (!isAuthenticated || !identityCertifierActor || !sessionData || !backendActor) {
      return;
    }

    if (sessionData.isBackendAuthenticated) {
      checkExistingSession();
      return;
    }

    if (!isServerAuthenticating && !isServerAuthenticated && !serverAuthError) {
      authenticateWithServer();
    }
  }, [
    isAuthenticated, 
    !!identityCertifierActor, 
    !!backendActor, 
    sessionData?.isBackendAuthenticated,
    isServerAuthenticating,
    isServerAuthenticated,
    !!serverAuthError 
  ]);


  useEffect(() => {
    const session = localStorage.getItem("session-data")
    if (session) {
      const sessionData: SessionData = JSON.parse(session);
      switch (sessionData.connectedWalletType) {
        case WalletType.InternetIdentity:
          updateInternetIdentityClient();
          break;
        case WalletType.SIWB:
          updateSIWBClient();
          break;
        case WalletType.SIWS:
          updateSIWSClient();
          break;
        case WalletType.SIWE:
          updateSIWEClient();
          break;
        case WalletType.NFID:
          updateNFIDClient();
          break;
      }
    }
  }, [siwsIdentity, siweIdentity, siwbIdentity]);

  const login = async (walletType: WalletType) => {
    const result = await getPrincipalAddress(walletType);
    if (!result) {
      throw new Error("Failed to get principal address.");
    }
    const { principalAddress, aid, chainAddress } = result;
    updateSessionData({
      connected: true,
      isBackendAuthenticated: false,
      connectedWalletType: walletType,
      principalId: principalAddress,
      aid: aid,
      chainAddress: chainAddress,
      setTime: Date.now(),
    });
    updateClient(walletType);
  };

  const logout = () => {
    const session = localStorage.getItem("session-data");
    if (session) {
      const sessionData = JSON.parse(session);
      switch (sessionData.connectedWalletType) {
        case WalletType.InternetIdentity:
          logoutInternetIdentity();
          break;
        case WalletType.SIWB:
          logoutSIWB();
          break;
        case WalletType.SIWS:
          logoutSIWS();
          break;
        case WalletType.SIWE:
          logoutSIWE();
          break;
        case WalletType.NFID:
          logoutNFID();
          break;
      }
    }
    
    resetServerAuth();
    deleteSessionData();
    setIsAuthenticated(false);
    apiLogout();
  };

  const logoutInternetIdentity = async () => {
    const authClient = await AuthClient.create();
    authClient.logout();
  };

  const logoutNFID = async () => {
    const authClient = await getAuthClient();
    authClient.logout();
  };

  const logoutSIWB = async () => {
    siwbClear();
    setIdentity(null);
    setPrincipalId(null);
    setIsAuthenticated(false);
    setBackendActor(null);
    setUser(null);
    deleteSessionData();
  };

  const logoutSIWE = async () => {
    siweClear();
    wagmiDisconnect();
  };

  const logoutSIWS = async () => {
    siwsClear();
    solanaDisconnect();
  };

  const autoLogin = () => {
    syncSessionData();
  };

  const updateClient = async (walletType: WalletType) => {
    switch (walletType) {
      case WalletType.InternetIdentity:
        await updateInternetIdentityClient();
        break;
      case WalletType.SIWB:
        await updateSIWBClient();
        break;
      case WalletType.SIWS:
        await updateSIWSClient();
        break;
      case WalletType.SIWE:
        await updateSIWEClient();
        break;
      case WalletType.NFID:
        await updateNFIDClient();
        break;
    }
  };

  const updateInternetIdentityClient = async () => {
    try {
      const authClient = await AuthClient.create();
      setAuthClient(authClient);
      const isAuthenticated = await authClient.isAuthenticated();
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        const agent = await HttpAgent.create({
          identity,
          host: host,
        });
        if (network === "local") {
          agent.fetchRootKey().catch((err) => {
            console.log("Error fetching root key: ", err);
          });
        }
        setPrincipalId(identity.getPrincipal().toText());
        const _backendActor = Actor.createActor<BACKEND_SERVICE>(usersIDL, {
          agent,
          canisterId: usersCanisterId,
        });
        setBackendActor(_backendActor);
        const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
          agent,
          canisterId: identityCertifierCanisterId,
        });
        setIdentityCertifierActor(_identityCertifierActor);
        setIdentity(identity);
        setIsAuthenticated(isAuthenticated);
        syncSessionData();
      }
    } catch (error) {
      console.log("Error in updateInternetIdentityClient: ", error);
    }
  };

  const updateSIWBClient = async () => {
    if (!siwbIdentity) {
      console.error("SIWB identity is not available.");
      throw new Error("SIWB identity is not available.");
    }

    try {
      const principalId = siwbIdentity.getPrincipal().toText();
      setPrincipalId(principalId);
      setIdentity(siwbIdentity);

      const agent = await HttpAgent.create({
        identity: siwbIdentity,
        host: host,
      });

      if (network === "local") {
        agent.fetchRootKey().catch((err) => {
          console.log("Error fetching root key: ", err);
        });
      }

      const _backendActor = Actor.createActor<BACKEND_SERVICE>(usersIDL, {
        agent,
        canisterId: usersCanisterId,
      });
      setBackendActor(_backendActor);
      const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
        agent,
        canisterId: identityCertifierCanisterId,
      });
      setIdentityCertifierActor(_identityCertifierActor);
      setIsAuthenticated(true);

      syncSessionData();
    } catch (error) {
      console.error("Error updating SIWB client:", error);
      throw error;
    }
  };

  const updateSIWSClient = async () => {
    if (!siwsIdentity) {
      throw new Error("SIWS identity is not available.");
    }
    const principalId = siwsIdentity.getPrincipal().toText();
    setPrincipalId(principalId);
    setIdentity(siwsIdentity);
    const agent = await HttpAgent.create({
      identity: siwsIdentity,
      host: host,
    });
    if (network === "local") {
      agent.fetchRootKey().catch((err) => {
        console.log("Error fetching root key: ", err);
      });
    }
    const _backendActor = Actor.createActor<BACKEND_SERVICE>(usersIDL, {
      agent,
      canisterId: usersCanisterId,
    });
    setBackendActor(_backendActor);
    const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
      agent,
      canisterId: identityCertifierCanisterId,
    });
    setIdentityCertifierActor(_identityCertifierActor);
    setIsAuthenticated(true);
    syncSessionData();
  };

  const updateSIWEClient = async () => {
    if (!siweIdentity) {
      throw new Error("SIWE identity is not available.");
    }
    const principalId = siweIdentity.getPrincipal().toText();
    setPrincipalId(principalId);
    setIdentity(siweIdentity);
    const agent = await HttpAgent.create({
      identity: siweIdentity,
      host: host,
    });
    if (network === "local") {
      agent.fetchRootKey().catch((err) => {
        console.log("Error fetching root key: ", err);
      });
    }
    const _backendActor = Actor.createActor<BACKEND_SERVICE>(usersIDL, {
      agent,
      canisterId: usersCanisterId,
    });
    setBackendActor(_backendActor);
    const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
      agent,
      canisterId: identityCertifierCanisterId,
    });
    setIdentityCertifierActor(_identityCertifierActor);
    setIsAuthenticated(true);
    syncSessionData();
  };

  const updateNFIDClient = async () => {
    const authClient = await getAuthClient();
    const isAuthenticated = await authClient.isAuthenticated();
    setIsAuthenticated(isAuthenticated);
    if (isAuthenticated) {
      const identity = authClient.getIdentity();
      setPrincipalId(identity.getPrincipal().toText());
      setIdentity(identity);
      const agent = await HttpAgent.create({
        identity,
        host: host,
      });
      if (network === "local") {
        agent.fetchRootKey().catch((err) => {
          console.log("Error fetching root key: ", err);
        });
      }
      const _backendActor = Actor.createActor<BACKEND_SERVICE>(usersIDL, {
        agent,
        canisterId: usersCanisterId,
      });
      setBackendActor(_backendActor);
      const _identityCertifierActor = Actor.createActor<IDENTITY_CERTIFIER_SERVICE>(identityCertifierIDL, {
        agent,
        canisterId: identityCertifierCanisterId,
      });
      setIdentityCertifierActor(_identityCertifierActor);
      syncSessionData();
    }
  };

  const getPrincipalAddress = async (walletType: WalletType) => {
    switch (walletType) {
      case WalletType.InternetIdentity:
        return getInternetIdentityPrincipalAddress();
      case WalletType.NFID:
        return getNFIDPrincipalAddress();
      case WalletType.SIWB:
        return getSIWBPrincipalAddress();
      case WalletType.SIWS:
        return getSIWSPrincipalAddress();
      case WalletType.SIWE:
        return getSIWEPrincipalAddress();
    }
  };

  const getInternetIdentityPrincipalAddress = async () => {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const principalAddress = identity.getPrincipal().toText();
    const aid = aidFromPrincipal(identity.getPrincipal());
    return { principalAddress, aid, chainAddress: principalAddress };
  };

  const getNFIDPrincipalAddress = async () => {
    const authClient = await getAuthClient();
    const identity = authClient.getIdentity();
    const principalAddress = identity.getPrincipal().toText();
    const aid = aidFromPrincipal(identity.getPrincipal());
    return { principalAddress, aid, chainAddress: principalAddress };
  };

  const getSIWBPrincipalAddress = async () => {
    if (!siwbIdentity || !identityAddress) {
      throw new Error("SIWB identity is not available.");
    }
    const principalAddress = siwbIdentity.getPrincipal().toText();
    const aid = aidFromPrincipal(siwbIdentity.getPrincipal() as any);
    const chainAddress = identityAddress || principalAddress;
    return { principalAddress, aid, chainAddress };
  };

  const getSIWEPrincipalAddress = async () => {
    if (!siweIdentity) {
      throw new Error("SIWE identity is not available.");
    }
    const principalAddress = siweIdentity.getPrincipal().toText();
    const aid = aidFromPrincipal(siweIdentity.getPrincipal());
    const chainAddress = ethAddress || principalAddress;
    return { principalAddress, aid, chainAddress };
  };

  const getSIWSPrincipalAddress = async () => {
    if (!siwsIdentity || !publicKey) {
      throw new Error("SIWS identity is not available.");
    }
    const principalAddress = siwsIdentity.getPrincipal().toText();
    const aid = aidFromPrincipal(siwsIdentity.getPrincipal());
    const chainAddress = publicKey.toString() || principalAddress;
    return { principalAddress, aid, chainAddress };
  };

  const value: AuthContextType = {
    login,
    logout,
    autoLogin,
    identity,
    principalId,
    sessionData,
    user,
    isAuthenticated,
    backendActor,
    identityCertifierActor,
    fetchingUser: isServerAuthenticating,
    setUser,
    serverAuthError,
    clearServerAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
