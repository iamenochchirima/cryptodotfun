import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AddUserArgs {
  'username' : string,
  'interests' : Array<string>,
  'email' : [] | [string],
  'referral_code' : [] | [string],
  'referral_source' : [] | [string],
  'chain_data' : ChainData,
}
export type Chain = { 'ICP' : null } |
  { 'Ethereum' : null } |
  { 'Solana' : null } |
  { 'Bitcoin' : null } |
  { 'Other' : string };
export interface ChainData {
  'chain' : Chain,
  'wallet_address' : string,
  'wallet' : string,
}
export interface Interest { 'value' : string }
export type Result = { 'Ok' : null } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : User } |
  { 'Err' : string };
export interface User {
  'principal' : Principal,
  'username' : string,
  'interests' : Array<Interest>,
  'created_at' : bigint,
  'email' : [] | [string],
  'referral_code' : [] | [string],
  'referral_source' : [] | [string],
  'chain_data' : ChainData,
}
export interface _SERVICE {
  'add_user' : ActorMethod<[AddUserArgs], Result>,
  'get_user' : ActorMethod<[], Result_1>,
  'get_users' : ActorMethod<[], Array<User>>,
  'is_username_available' : ActorMethod<[string], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
