
import React, {
    useContext,
    FC,
} from "react";
import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE as BACKEND_SERVICE } from '../../../../src/declarations/users/users.did';
import { useAuth } from "./useAuth";
import { SessionData } from "./useSessionData";
import { User } from "../../../../src/declarations/users/users.did";
import { WalletType } from "./types";

export type AuthContextType = {
    login: (walletType: WalletType) => void;
    logout: () => void;
    sessionData: SessionData | null;
    isAuthenticated: boolean;
    principalId: string | null;
    identity : any; 
    backendActor: ActorSubclass<BACKEND_SERVICE> | null;
    user: User | null;
    setUser: (user: User) => void;
};

const initialContext: AuthContextType = {
    login: () => { },
    logout: () => { },
    sessionData: null,
    isAuthenticated: false,
    identity: null,
    principalId: null,
    backendActor: null,
    user: null,
    setUser: () => { },
};

export const AuthContext = React.createContext<AuthContextType>(initialContext);
interface LayoutProps {
    children: React.ReactNode;
}

export const AuthProvider: FC<LayoutProps> = ({ children }) => {
    const auth = useAuth();

    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthClient = () => useContext(AuthContext);

